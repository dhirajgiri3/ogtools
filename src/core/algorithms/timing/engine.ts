import {
    ConversationThread,
    ScheduledConversation,
    Persona,
    PersonaTiming,
    TimeWindow,
    DistributionMetrics
} from '@/core/types';
import { getPersonaTiming, isActiveHour, isPeakHour, getRandomResponseDelay } from '@/core/data/personas/timing';
import {
    addMinutes,
    addDays,
    randomInt,
    randomWithVariance,
    isWeekend,
    getHour,
    setHour,
    getStartOfWeek,
    getRandomDateInWeek
} from './utils';

// ============================================
// SIMPLE DISTRIBUTION LOGIC
// ============================================

interface SimpleUsage {
    personas: Record<string, number>;
    subreddits: Record<string, number>;
    combinations: Record<string, number>;
    lastUsedIndex: Record<string, number>;
}

/**
 * Select least-used persona (simple round-robin with anti-clustering)
 */
export function selectBalancedPersona(
    personas: Persona[],
    usage: SimpleUsage,
    currentIndex: number,
    recentlyUsed: string[]
): Persona {
    // Filter out recently used (last 2)
    const available = personas.filter(p => !recentlyUsed.includes(p.id));
    if (available.length === 0) return personas[currentIndex % personas.length];

    // Pick the one with least usage
    return available.reduce((least, current) => {
        const leastCount = usage.personas[least.id] || 0;
        const currentCount = usage.personas[current.id] || 0;
        return currentCount < leastCount ? current : least;
    });
}

/**
 * Select least-used subreddit (avoiding same combo)
 */
export function selectBalancedSubreddit(
    subreddits: string[],
    usage: SimpleUsage,
    personaId: string,
    recentlyUsed: string[]
): string {
    // Filter out recently used and overused combos
    const available = subreddits.filter(sub => {
        if (recentlyUsed.includes(sub)) return false;
        const combo = `${personaId}:${sub}`;
        return (usage.combinations[combo] || 0) < 2; // Max 2 times per combo
    });
    if (available.length === 0) return subreddits[0];

    // Pick least used
    return available.reduce((least, current) => {
        const leastCount = usage.subreddits[least] || 0;
        const currentCount = usage.subreddits[current] || 0;
        return currentCount < leastCount ? current : least;
    });
}

/**
 * Track usage (simple increment)
 */
export function trackUsage(
    usage: SimpleUsage,
    personaId: string,
    subreddit: string,
    index: number
): void {
    usage.personas[personaId] = (usage.personas[personaId] || 0) + 1;
    usage.subreddits[subreddit] = (usage.subreddits[subreddit] || 0) + 1;
    const combo = `${personaId}:${subreddit}`;
    usage.combinations[combo] = (usage.combinations[combo] || 0) + 1;
    usage.lastUsedIndex[personaId] = index;
    usage.lastUsedIndex[subreddit] = index;
}

/**
 * Get simple distribution metrics
 */
export function getDistributionMetrics(usage: SimpleUsage, total: number): DistributionMetrics {
    // Simple diversity: how many unique combos / total posts
    const combinationDiversity = Object.keys(usage.combinations).length / Math.max(1, total);

    // Simple balance check: variance from even distribution
    const personaCount = Object.keys(usage.personas).length;
    const expectedPerPersona = total / personaCount;
    let personaVariance = 0;
    Object.values(usage.personas).forEach(count => {
        personaVariance += Math.pow(count - expectedPerPersona, 2);
    });
    const diversityScore = 1 - Math.min(1, personaVariance / (total * total));

    return {
        personaBalance: { ...usage.personas },
        subredditBalance: { ...usage.subreddits },
        diversityScore,
        combinationDiversity
    };
}

/**
 * Create empty usage tracker
 */
export function createUsageTracker(): SimpleUsage {
    return {
        personas: {},
        subreddits: {},
        combinations: {},
        lastUsedIndex: {}
    };
}

// ============================================
// POST TIME SELECTION
// ============================================

export function selectRealisticPostTime(
    persona: Persona,
    weekStart: Date
): Date {
    const timing = getPersonaTiming(persona.id);

    // Select random day in week
    let postDate = getRandomDateInWeek(weekStart);

    // Check weekend pattern
    if (isWeekend(postDate)) {
        if (timing.weekendPattern === 'offline') {
            // Move to next Monday
            while (isWeekend(postDate)) {
                postDate = addDays(postDate, 1);
            }
        } else if (timing.weekendPattern === 'reduced') {
            // 50% chance to skip to Monday
            if (Math.random() < 0.5) {
                while (isWeekend(postDate)) {
                    postDate = addDays(postDate, 1);
                }
            }
        }
    }

    // Select hour within active windows
    let hour: number;

    // 70% chance to use peak activity hour
    if (Math.random() < 0.7 && timing.peakActivity.length > 0) {
        hour = timing.peakActivity[randomInt(0, timing.peakActivity.length - 1)];
    } else {
        // Use any active hour
        const activeWindow = timing.activeHours[randomInt(0, timing.activeHours.length - 1)];
        hour = randomInt(activeWindow.start, Math.min(activeWindow.end - 1, 23));
    }

    // Set hour with random minute (NEVER on the hour)
    postDate = setHour(postDate, hour);

    // Ensure it's during active time
    postDate = ensureActiveTime(postDate, persona.id);

    return postDate;
}

/**
 * Ensure time falls within persona's active hours
 */
function ensureActiveTime(date: Date, personaId: string): Date {
    const timing = getPersonaTiming(personaId);
    const hour = getHour(date);

    // Check if currently in active window
    const isActive = timing.activeHours.some((window: { start: number; end: number }) => {
        if (window.end > 24) {
            return hour >= window.start || hour < (window.end - 24);
        }
        return hour >= window.start && hour < window.end;
    });

    if (isActive) {
        return date;
    }

    // Find next active window
    const nextWindow = timing.activeHours.find((w: { start: number; end: number }) => w.start > hour) || timing.activeHours[0];

    // Jump to start of next window
    let adjustedDate = setHour(date, nextWindow.start);

    // If we wrapped to tomorrow
    if (nextWindow.start <= hour) {
        adjustedDate = addDays(adjustedDate, 1);
    }

    // Add random offset within first 30 minutes
    adjustedDate = addMinutes(adjustedDate, randomInt(0, 30));

    return adjustedDate;
}

// ============================================
// COMMENT TIMING
// ============================================

/**
 * Generate comment timings relative to post time
 */
export function generateCommentTimings(
    postTime: Date,
    commentTemplates: { timingRange: { min: number; max: number } }[],
    commenterPersonas: Persona[]
): Date[] {
    const timings: Date[] = [];
    let previousTime = postTime;

    for (let i = 0; i < commentTemplates.length; i++) {
        const template = commentTemplates[i];
        const persona = commenterPersonas[i];

        // Get base delay from template
        const baseDelay = randomInt(template.timingRange.min, template.timingRange.max);

        // Apply persona response delay
        const personaDelay = getRandomResponseDelay(persona.id);

        // Combine with ±15% variance
        const finalDelay = Math.round(randomWithVariance(
            Math.min(baseDelay, baseDelay + personaDelay / 2),
            0.15
        ));

        // Ensure minimum 5 minutes
        const adjustedDelay = Math.max(5, finalDelay);

        // Calculate comment time
        let commentTime = addMinutes(previousTime, adjustedDelay);

        // Ensure during commenter's active hours
        commentTime = ensureActiveTime(commentTime, persona.id);

        timings.push(commentTime);
        previousTime = commentTime; // Ensure increasing delays
    }

    return timings;
}

// ============================================
// REPLY TIMING
// ============================================

/**
 * Generate reply timings relative to parent comments
 */
export function generateReplyTimings(
    replyTemplates: { replyType: 'op_followup' | 'commenter_elaboration' | 'cross_commenter' }[],
    replyPersonas: Persona[],
    parentCommentTimes: Date[]
): Date[] {
    const timings: Date[] = [];

    for (let i = 0; i < replyTemplates.length && i < parentCommentTimes.length; i++) {
        const template = replyTemplates[i];
        const persona = replyPersonas[i];
        const parentTime = parentCommentTimes[i];

        // OP replies faster, other commenters slower
        const isOP = template.replyType === 'op_followup';
        const baseDelay = isOP
            ? randomInt(10, 60)  // OP: 10-60 minutes
            : randomInt(30, 120); // Others: 30-120 minutes

        // Apply persona response delay
        const personaDelay = getRandomResponseDelay(persona.id);
        const finalDelay = Math.round((baseDelay + personaDelay) / 2);

        // Add variance
        const adjustedDelay = Math.max(5, Math.round(randomWithVariance(finalDelay, 0.2)));

        // Calculate reply time
        let replyTime = addMinutes(parentTime, adjustedDelay);

        // Ensure during persona's active hours
        replyTime = ensureActiveTime(replyTime, persona.id);

        timings.push(replyTime);
    }

    return timings;
}

// ============================================
// SCHEDULE GENERATION
// ============================================

/**
 * Generate complete schedule for multiple conversations
 */
export function generateSchedule(
    conversations: (Omit<ConversationThread, 'qualityScore'> & { qualityScore: any })[],
    personas: Persona[],
    startDate: Date,
    postsPerWeek: number
): ScheduledConversation[] {
    const weekStart = getStartOfWeek(startDate);
    const scheduled: ScheduledConversation[] = [];

    // Distribute posts across week to avoid clustering
    const dayDistribution = distributePostsAcrossWeek(postsPerWeek);

    for (let i = 0; i < conversations.length; i++) {
        const conversation = conversations[i];
        const dayOffset = dayDistribution[i % dayDistribution.length];

        // Get poster persona
        const poster = conversation.post.persona;

        // Calculate post time
        const postTime = selectRealisticPostTime(poster, addDays(weekStart, dayOffset));

        // Get commenter personas
        const commenterPersonas = conversation.topLevelComments.map(c => c.persona);

        // Generate timing templates based on actual comments
        const commentTimingTemplates = conversation.topLevelComments.map((_, idx) => ({
            timingRange: {
                min: 15 + (idx * 15),  // Stagger: 15, 30, 45...
                max: 45 + (idx * 45)   // Stagger: 45, 90, 135...
            }
        }));

        // Generate comment timings
        const commentTimings = generateCommentTimings(
            postTime,
            commentTimingTemplates,
            commenterPersonas
        );

        // Get reply personas
        const replyPersonas = conversation.replies.map(r => r.persona);

        // Generate reply timings
        const replyTimings = generateReplyTimings(
            conversation.replies.map(r => ({ replyType: r.replyType })),
            replyPersonas,
            commentTimings
        );

        // Create scheduled conversation
        scheduled.push({
            conversation: conversation as ConversationThread,
            scheduledTime: postTime,
            commentTimings,
            replyTimings
        });
    }

    // Sort by scheduled time
    scheduled.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

    return scheduled;
}

/**
 * Distribute posts across week to avoid clustering
 */
function distributePostsAcrossWeek(postsPerWeek: number): number[] {
    const distribution: number[] = [];

    if (postsPerWeek <= 5) {
        // Spread across weekdays (Mon-Fri)
        const spacing = Math.floor(5 / postsPerWeek);
        for (let i = 0; i < postsPerWeek; i++) {
            distribution.push(i * spacing);
        }
    } else {
        // Use all 7 days
        const spacing = Math.floor(7 / postsPerWeek);
        for (let i = 0; i < postsPerWeek; i++) {
            distribution.push(i * spacing % 7);
        }
    }

    return distribution;
}

/**
 * Apply scheduling to conversation thread
 * Updates the scheduled times for post, comments, and replies
 */
export function applyScheduleToConversation(
    conversation: ConversationThread,
    scheduled: ScheduledConversation
): ConversationThread {
    // Update post time
    conversation.post.scheduledTime = scheduled.scheduledTime;

    // Update comment times
    conversation.topLevelComments.forEach((comment, i) => {
        if (i < scheduled.commentTimings.length) {
            comment.scheduledTime = scheduled.commentTimings[i];
        }
    });

    // Update reply times
    conversation.replies.forEach((reply, i) => {
        if (i < scheduled.replyTimings.length) {
            reply.scheduledTime = scheduled.replyTimings[i];
        }
    });

    return conversation;
}
