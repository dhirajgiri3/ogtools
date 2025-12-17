import { WeekCalendar, Persona, SubredditContext } from '@/core/types';

/**
 * Week Context Utility
 *
 * Extracts context from previous weeks to avoid repetition and improve quality
 * across sequential calendar generation.
 */

export interface WeekContext {
    usedTopics: string[];                    // Topics already covered
    personaUsage: Map<string, number>;       // Persona ID -> usage count
    subredditUsage: Map<string, number>;     // Subreddit name -> usage count
    recentPosts: string[];                   // Recent post contents (for similarity check)
    productMentionsByPersona: Map<string, number>; // Persona ID -> product mention count
}

/**
 * Extract context from previous weeks for intelligent generation
 */
export function extractWeekContext(previousWeeks: WeekCalendar[]): WeekContext {
    const context: WeekContext = {
        usedTopics: [],
        personaUsage: new Map(),
        subredditUsage: new Map(),
        recentPosts: [],
        productMentionsByPersona: new Map()
    };

    // Analyze all previous weeks
    for (const week of previousWeeks) {
        for (const scheduled of week.conversations) {
            const conv = scheduled.conversation;

            // Track post content for similarity
            context.recentPosts.push(conv.post.content);

            // Extract topics from posts (simple keyword extraction)
            const topics = extractTopics(conv.post.content);
            context.usedTopics.push(...topics);

            // Track persona usage
            const posterId = conv.post.persona.id;
            context.personaUsage.set(
                posterId,
                (context.personaUsage.get(posterId) || 0) + 1
            );

            // Track subreddit usage
            const subreddit = conv.subreddit;
            context.subredditUsage.set(
                subreddit,
                (context.subredditUsage.get(subreddit) || 0) + 1
            );

            // Track product mentions per persona
            for (const comment of conv.topLevelComments) {
                if (comment.productMention) {
                    const commenterId = comment.persona.id;
                    context.productMentionsByPersona.set(
                        commenterId,
                        (context.productMentionsByPersona.get(commenterId) || 0) + 1
                    );
                }
            }
        }
    }

    return context;
}

/**
 * Simple topic extraction from post content
 * Extracts key phrases (2-3 words) that represent the topic
 */
function extractTopics(content: string): string[] {
    const topics: string[] = [];
    const lowerContent = content.toLowerCase();

    // Common topic patterns to extract
    const patterns = [
        /(?:working on|dealing with|trying to|struggling with)\s+([a-z\s]{2,30})/gi,
        /(?:create|build|make|design)\s+([a-z\s]{2,30})/gi,
        /(?:presentation|deck|slides?|report|document)\s+([a-z\s]{0,20})/gi
    ];

    for (const pattern of patterns) {
        const matches = lowerContent.matchAll(pattern);
        for (const match of matches) {
            if (match[1]) {
                topics.push(match[1].trim());
            }
        }
    }

    return topics;
}

/**
 * Select personas with diversity in mind (prefer underused personas)
 */
export function selectDiversePersonas(
    availablePersonas: Persona[],
    context: WeekContext,
    count: number
): Persona[] {
    // Sort personas by usage (least used first)
    const sortedPersonas = [...availablePersonas].sort((a, b) => {
        const aUsage = context.personaUsage.get(a.id) || 0;
        const bUsage = context.personaUsage.get(b.id) || 0;
        return aUsage - bUsage;
    });

    return sortedPersonas.slice(0, count);
}

/**
 * Select subreddit with diversity in mind (prefer underused subreddits)
 */
export function selectDiverseSubreddit(
    availableSubreddits: string[],
    context: WeekContext
): string {
    // Sort subreddits by usage (least used first)
    const sortedSubreddits = [...availableSubreddits].sort((a, b) => {
        const aUsage = context.subredditUsage.get(a) || 0;
        const bUsage = context.subredditUsage.get(b) || 0;
        return aUsage - bUsage;
    });

    return sortedSubreddits[0];
}

/**
 * Check if a topic is too similar to previously used topics
 */
export function isTopicTooSimilar(
    newTopic: string,
    context: WeekContext,
    similarityThreshold: number = 0.7
): boolean {
    const newWords = new Set(newTopic.toLowerCase().split(/\s+/));

    for (const usedTopic of context.usedTopics) {
        const usedWords = new Set(usedTopic.toLowerCase().split(/\s+/));
        const overlap = [...newWords].filter(w => usedWords.has(w)).length;
        const similarity = overlap / Math.max(newWords.size, usedWords.size);

        if (similarity >= similarityThreshold) {
            return true;
        }
    }

    return false;
}

/**
 * Check if persona has reached product mention limit across weeks
 */
export function hasReachedProductMentionLimit(
    personaId: string,
    context: WeekContext,
    limitPerWeek: number = 1
): boolean {
    const mentions = context.productMentionsByPersona.get(personaId) || 0;
    return mentions >= limitPerWeek * context.personaUsage.size;
}
