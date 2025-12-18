import {
    SafetyReport,
    CheckResult,
    Violation,
    Warning,
    ScheduledConversation,
    AccountHistory,
    Persona
} from '@/core/types';
import { GENERATION_LIMITS, SAFETY_THRESHOLDS } from '@/config/constants';
import { calculateTextSimilarity, findRepeatedPhrases } from '@/shared/lib/utils/text-similarity';
import { getMinutesDifference, calculateTimingCV } from '../timing/utils';

/**
 * Safety Validator
 * 
 * Heuristic-based safety validation to prevent account bans.
 * Runs safety checks on generated calendars.
 */



/**
 * Create mock account histories for personas
 * In production, this would fetch real Reddit account data
 */
export function createMockAccountHistories(personas: Persona[]): AccountHistory[] {
    return personas.map(persona => ({
        personaId: persona.id,
        accountAge: 90, // 90 days old (safe)
        karma: Math.floor(Math.random() * 50) + 150, // 150-200 karma
        commentHistory: [], // Would contain recent comments
        postHistory: [], // Would contain recent posts
        subredditActivity: new Map(), // Subreddit -> post count
        productMentions: 0,
        lastProductMention: null,
        riskLevel: 'trusted'
    }));
}




function checkAccountReadiness(
    accountHistories: AccountHistory[]
): CheckResult {
    const issues: string[] = [];
    let totalScore = 0;

    accountHistories.forEach(account => {
        let accountScore = 1;

        // Check account age (30+ days required)
        if (account.accountAge < 30) {
            issues.push(`${account.personaId}: Account too new (${account.accountAge} days, need 30 +)`);
            accountScore -= 0.5;
        } else if (account.accountAge < 60) {
            issues.push(`${account.personaId}: Account age marginal(${account.accountAge} days)`);
            accountScore -= 0.2;
        }

        // Check karma (50+ required)
        if (account.karma < 50) {
            issues.push(`${account.personaId}: Karma too low(${account.karma}, need 50 +)`);
            accountScore -= 0.5;
        }

        totalScore += Math.max(0, accountScore);
    });

    const avgScore = totalScore / accountHistories.length;

    return {
        passed: avgScore >= 0.8,
        score: avgScore,
        details: issues.length === 0
            ? 'All accounts meet readiness requirements'
            : issues.join('; ')
    };
}


function checkFrequencyLimits(
    scheduledConversations: ScheduledConversation[]
): CheckResult {
    const issues: string[] = [];
    let violationCount = 0;

    // Group by subreddit
    const subredditPosts = new Map<string, number>();
    const subredditPostDates = new Map<string, Date[]>();
    const personaPosts = new Map<string, number>();
    const personaProductMentions = new Map<string, { dates: Date[]; count: number }>();

    scheduledConversations.forEach(sc => {
        const subreddit = sc.conversation.subreddit;
        const posterId = sc.conversation.post.persona.id;

        // Track subreddit posts
        subredditPosts.set(subreddit, (subredditPosts.get(subreddit) || 0) + 1);
        const dates = subredditPostDates.get(subreddit) || [];
        dates.push(sc.scheduledTime);
        subredditPostDates.set(subreddit, dates);

        // Track persona posts
        personaPosts.set(posterId, (personaPosts.get(posterId) || 0) + 1);

        // Track product mentions per persona
        const productComments = sc.conversation.topLevelComments.filter(c => c.productMention);
        if (productComments.length > 0) {
            const productData = personaProductMentions.get(posterId) || { dates: [], count: 0 };
            productData.count += 1;
            productData.dates = [...productData.dates, ...sc.commentTimings.slice(0, productComments.length)];
            personaProductMentions.set(posterId, productData);
        }
    });

    // Check subreddit frequency (max 2 posts per subreddit per week)
    subredditPosts.forEach((count, subreddit) => {
        if (count > 2) {
            issues.push(`${subreddit}: ${count} posts / week(limit: 2)`);
            violationCount++;
        }
    });

    // Check persona frequency (max 7 posts per persona per week)
    personaPosts.forEach((count, personaId) => {
        if (count > 7) {
            issues.push(`${personaId}: ${count} posts / week(limit: 7)`);
            violationCount++;
        }
    });

    // Check product mention frequency (max 1 per persona per week)
    personaProductMentions.forEach((data, personaId) => {
        if (data.count > 1) {
            issues.push(`${personaId}: ${data.count} product mentions / week(limit: 1)`);
            violationCount++;
        }
    });

    const totalChecks = subredditPosts.size + personaPosts.size + personaProductMentions.size;
    const score = totalChecks === 0 ? 1 : 1 - (violationCount / (totalChecks * 2)); // Adjusted for severity

    return {
        passed: violationCount === 0,
        score: Math.max(0, score),
        details: issues.length === 0
            ? 'All frequency limits satisfied'
            : issues.join('; ')
    };
}


function checkTimingRealism(
    scheduledConversations: ScheduledConversation[]
): CheckResult {
    const issues: string[] = [];
    let violationCount = 0;

    scheduledConversations.forEach(sc => {
        const postTime = sc.scheduledTime;

        // Check first comment not < 5 min after post
        if (sc.commentTimings.length > 0) {
            const firstCommentDelay = getMinutesDifference(postTime, sc.commentTimings[0]);
            if (firstCommentDelay < 5) {
                issues.push(`First comment too fast(${Math.round(firstCommentDelay)}min, need 5 + min)`);
                violationCount++;
            }
        }

        // Check for mechanical regularity (timing variance)
        const allTimings = [postTime, ...sc.commentTimings, ...sc.replyTimings];
        if (allTimings.length >= 3) {
            const cv = calculateTimingCV(allTimings);
            if (cv < 0.3) {
                issues.push(`Timing too regular(CV: ${cv.toFixed(2)}, need \u003e0.3)`);
                violationCount++;
            }
        }

        // Check comments not all in narrow window (<1 hour suspicious)
        if (sc.commentTimings.length >= 2) {
            const firstComment = sc.commentTimings[0];
            const lastComment = sc.commentTimings[sc.commentTimings.length - 1];
            const timeSpan = getMinutesDifference(firstComment, lastComment);

            if (timeSpan < 60 && sc.commentTimings.length >= 3) {
                issues.push(`All comments in ${Math.round(timeSpan)} min(suspicious if \u003c60min)`);
                violationCount++;
            }
        }
    });

    const totalChecks = scheduledConversations.length * 2; // 2 checks per conversation
    const score = totalChecks === 0 ? 1 : 1 - (violationCount / totalChecks);

    return {
        passed: violationCount === 0,
        score: Math.max(0, score),
        details: issues.length === 0
            ? 'Timing patterns appear realistic'
            : issues.join('; ')
    };
}


function checkCollusionPatterns(
    scheduledConversations: ScheduledConversation[]
): CheckResult {
    const issues: string[] = [];
    let suspiciousPatterns = 0;

    // Track persona co-occurrence
    const personaPairs = new Map<string, number>();
    const totalConversations = scheduledConversations.length;

    scheduledConversations.forEach(sc => {
        const participants = [
            sc.conversation.post.persona.id,
            ...sc.conversation.topLevelComments.map(c => c.persona.id),
            ...sc.conversation.replies.map(r => r.persona.id)
        ];

        const uniqueParticipants = [...new Set(participants)];

        // Check all pairs
        for (let i = 0; i < uniqueParticipants.length; i++) {
            for (let j = i + 1; j < uniqueParticipants.length; j++) {
                const pair = [uniqueParticipants[i], uniqueParticipants[j]].sort().join('_');
                personaPairs.set(pair, (personaPairs.get(pair) || 0) + 1);
            }
        }
    });

    // Check for suspicious co-occurrence (>80% of conversations)
    personaPairs.forEach((count, pair) => {
        const percentage = count / totalConversations;
        if (percentage > 0.8) {
            issues.push(`${pair}: appear together in ${Math.round(percentage * 100)}% of conversations`);
            suspiciousPatterns++;
        }
    });

    const score = personaPairs.size === 0 ? 1 : 1 - (suspiciousPatterns / personaPairs.size);

    return {
        passed: suspiciousPatterns === 0,
        score: Math.max(0, score),
        details: issues.length === 0
            ? 'No suspicious collusion patterns detected'
            : issues.join('; ')
    };
}


function checkContentSimilarity(
    scheduledConversations: ScheduledConversation[]
): CheckResult {
    const issues: string[] = [];
    let violationCount = 0;

    // Collect all posts and product mentions
    const posts = scheduledConversations.map(sc => sc.conversation.post.content);
    const productMentions = scheduledConversations.flatMap(sc =>
        sc.conversation.topLevelComments.filter(c => c.productMention).map(c => c.content)
    );

    // Check post similarity
    for (let i = 0; i < posts.length; i++) {
        for (let j = i + 1; j < posts.length; j++) {
            const similarity = calculateTextSimilarity(posts[i], posts[j]);
            if (similarity > 0.7) {
                issues.push(`Posts ${i + 1} and ${j + 1} are ${Math.round(similarity * 100)}% similar(limit: 70 %)`);
                violationCount++;
            } else if (similarity > 0.6) {
                issues.push(`Posts ${i + 1} and ${j + 1} are ${Math.round(similarity * 100)}% similar(warning: \u003e60 %)`);
            }
        }
    }

    // Check product mention similarity
    for (let i = 0; i < productMentions.length; i++) {
        for (let j = i + 1; j < productMentions.length; j++) {
            const similarity = calculateTextSimilarity(productMentions[i], productMentions[j]);
            if (similarity > 0.7) {
                issues.push(`Product mentions too similar(${Math.round(similarity * 100)} %)`);
                violationCount++;
            }
        }
    }

    // Check for repeated exact phrases
    const allTexts = [...posts, ...productMentions];
    const repeatedPhrases = findRepeatedPhrases(allTexts, 3);
    const problematicPhrases = [...repeatedPhrases.entries()].filter(([_, count]) => count > 2);

    if (problematicPhrases.length > 0) {
        issues.push(`${problematicPhrases.length} phrases repeated 3 + times(template fingerprint)`);
        violationCount++;
    }

    const totalChecks = (posts.length * (posts.length - 1)) / 2; // Pairwise comparisons
    const score = totalChecks === 0 ? 1 : 1 - (violationCount / totalChecks);

    return {
        passed: violationCount === 0,
        score: Math.max(0, score),
        details: issues.length === 0
            ? 'Content shows good variation'
            : issues.slice(0, 3).join('; ') // Show top 3 issues
    };
}



/**
 * Validate safety of conversation calendar
 */
export function validateSafety(
    scheduledConversations: ScheduledConversation[],
    personas: Persona[],
    customHistories?: AccountHistory[]
): SafetyReport {
    // Create mock account histories OR use provided ones
    const accountHistories = customHistories || createMockAccountHistories(personas);

    // Run all safety checks
    const accountReadiness = checkAccountReadiness(accountHistories);
    const frequencyLimits = checkFrequencyLimits(scheduledConversations);
    const timingRealism = checkTimingRealism(scheduledConversations);
    const collusionPatterns = checkCollusionPatterns(scheduledConversations);
    const contentSimilarity = checkContentSimilarity(scheduledConversations);

    // Collect violations and warnings
    const violations: Violation[] = [];
    const warnings: Warning[] = [];

    // Account readiness failures are critical
    if (!accountReadiness.passed) {
        violations.push({
            type: 'account_not_ready',
            severity: 'critical',
            message: 'One or more accounts not ready for posting',
            fix: accountReadiness.details
        });
    }

    // Frequency limit failures are high severity
    if (!frequencyLimits.passed) {
        violations.push({
            type: 'frequency_violation',
            severity: 'high',
            message: 'Frequency limits exceeded',
            fix: frequencyLimits.details
        });
    }

    // Timing issues are high severity
    if (!timingRealism.passed && timingRealism.score < 0.7) {
        violations.push({
            type: 'timing_unrealistic',
            severity: 'high',
            message: 'Timing patterns appear automated',
            fix: timingRealism.details
        });
    } else if (!timingRealism.passed) {
        warnings.push({
            type: 'timing_concern',
            severity: 'medium',
            message: 'Some timing patterns may be suspicious',
            recommendation: timingRealism.details
        });
    }

    // Collusion patterns are medium warnings
    if (!collusionPatterns.passed) {
        warnings.push({
            type: 'collusion_pattern',
            severity: 'medium',
            message: 'Some personas appear together frequently',
            recommendation: collusionPatterns.details
        });
    }

    // Content similarity failures are critical
    if (!contentSimilarity.passed && contentSimilarity.score < 0.6) {
        violations.push({
            type: 'content_too_similar',
            severity: 'critical',
            message: 'Content shows templated patterns',
            fix: contentSimilarity.details
        });
    } else if (!contentSimilarity.passed) {
        warnings.push({
            type: 'content_similarity',
            severity: 'low',
            message: 'Some content similarity detected',
            recommendation: contentSimilarity.details
        });
    }

    // Calculate overall risk
    let overallRisk: SafetyReport['overallRisk'];
    if (violations.some(v => v.severity === 'critical')) {
        overallRisk = 'critical';
    } else if (violations.some(v => v.severity === 'high')) {
        overallRisk = 'high';
    } else if (warnings.length >= 3) {
        overallRisk = 'medium';
    } else if (warnings.length > 0) {
        overallRisk = 'low';
    } else {
        overallRisk = 'low';
    }

    // Determine if passed
    const passed = overallRisk === 'low' || (overallRisk === 'medium' && violations.length === 0);

    // Generate recommendations
    const recommendations = generateRecommendations(violations, warnings);

    return {
        passed,
        overallRisk,
        checks: {
            accountReadiness,
            frequencyLimits,
            timingRealism,
            collusionPatterns,
            contentSimilarity
        },
        violations,
        warnings,
        recommendations
    };
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(
    violations: Violation[],
    warnings: Warning[]
): string[] {
    const recommendations: string[] = [];

    if (violations.length > 0) {
        recommendations.push('🔴 CRITICAL: Fix all violations before posting');
    }

    if (warnings.length >= 3) {
        recommendations.push('⚠️ Consider regenerating to reduce warnings');
    }

    if (violations.some(v => v.type === 'content_too_similar')) {
        recommendations.push('Increase content variation - use different arc types and personas');
    }

    if (violations.some(v => v.type === 'frequency_violation')) {
        recommendations.push('Reduce posts per week or distribute across more subreddits');
    }

    if (warnings.some(w => w.type === 'timing_concern')) {
        recommendations.push('Add more timing variance to appear more natural');
    }

    return recommendations.slice(0, 5);
}
