import {
    ConversationThread,
    QualityScore,
    Issue,
    Strength,
    SubredditContext,
    CompanyContext
} from '@/core/types';
import { getSubredditProfile } from '@/core/data/subreddits/profiles';
import { calculateStyleVariance } from '@/shared/lib/utils/text-similarity';

/**
 * Quality Predictor
 * 
 * Scores conversations across multiple dimensions to predict quality and authenticity.
 * Dimensions: Subreddit Relevance, Problem Specificity, Authenticity, Value First, Engagement Design.
 */

const AI_PATTERNS = [
    /\d+\.\s+/g,                              // Numbered lists
    /certainly/gi,
    /furthermore/gi,
    /moreover/gi,
    /\bthus\b/gi,
    /\bhence\b/gi,
    // Balanced argument patterns
    /on (the )?one hand.*on (the )?other hand/gi,
    /while.*however/gi,
    /although.*nevertheless/gi,
    // Overly helpful patterns
    /hope this helps/gi,
    /let me know if you have (any )?questions/gi,
    /feel free to/gi,
    /don't hesitate to/gi,
    // Enthusiasm markers
    /\babsolutely\b/gi,
    /\bdefinitely\b/gi,
    /great question/gi,
    // Corporate/formal speak
    /\bcomprehensive\b/gi,
    /\bthorough\b/gi,
    /\bleverage\b/gi,
    /\butilize\b/gi,
    /in conclusion/gi,
    /to summarize/gi
];

const EXPANDED_CONTRACTIONS = [
    /\bdo not\b/gi,
    /\bdoes not\b/gi,
    /\bdid not\b/gi,
    /\bcannot\b/gi,
    /\bcan not\b/gi,
    /\bwill not\b/gi,
    /\bwould not\b/gi,
    /\bcould not\b/gi,
    /\bshould not\b/gi,
    /\bhas not\b/gi,
    /\bhave not\b/gi,
    /\bis not\b/gi,
    /\bare not\b/gi,
    /\bwas not\b/gi,
    /\bwere not\b/gi,
    /\bit is\b/gi,
    /\bthat is\b/gi,
    /\bI am\b/gi,
    /\bI have\b/gi,
    /\bI will\b/gi,
    /\bI would\b/gi
];

function scoreSubredditRelevance(
    thread: ConversationThread,
    subreddit: SubredditContext,
    company?: CompanyContext
): { score: number; issues: Issue[]; strengths: Strength[] } {
    let score = 0;
    const issues: Issue[] = [];
    const strengths: Strength[] = [];

    // Topic alignment (0-10) - Made more lenient
    const postWords = thread.post.content.toLowerCase();
    const topicMatches = subreddit.commonTopics.filter(topic =>
        postWords.includes(topic.toLowerCase())
    );

    // Also check for partial matches (productivity -> productive, etc)
    const partialMatches = subreddit.commonTopics.filter(topic => {
        const words = topic.toLowerCase().split(' ');
        return words.some(word => postWords.includes(word.substring(0, Math.max(4, word.length - 2))));
    });

    // Company Relevance (Priority Over Subreddit Topics)
    if (company) {
        const allContentLower = (thread.post.content + ' ' + thread.topLevelComments.map(c => c.content).join(' ')).toLowerCase();
        // Check for ANY matching keyword from company context
        const keywordMatch = company.keywords.find(k =>
            allContentLower.includes(k.toLowerCase())
        );

        if (keywordMatch) {
            // OVERRIDE: If it matches company keywords, it is RELEVANT, regardless of subreddit usage.
            // Give 15 points (base topic match is 10)
            score += 15;
            strengths.push({
                type: 'company_relevance',
                message: 'Content is highly relevant to company domain',
                example: `Matched keyword: "${keywordMatch}"`
            });
        }
    }

    // Subreddit Topic Alignment (Secondary if Company Matches)
    if (!company) {
        // Only prioritize subreddit topics if no company context provided
        if (topicMatches.length >= 2) {
            score += 10;
            strengths.push({
                type: 'topic_alignment',
                message: 'Post aligns well with subreddit topics',
                example: `Mentions: ${topicMatches.slice(0, 2).join(', ')}`
            });
        } else if (topicMatches.length === 1 || partialMatches.length >= 2) {
            score += 8;
        } else if (partialMatches.length >= 1) {
            score += 6;
        } else {
            score += 3;
            issues.push({
                type: 'off_topic',
                severity: 'low',
                message: 'Post may not align closely with subreddit topics',
                suggestion: `Consider mentioning: ${subreddit.commonTopics.slice(0, 3).join(', ')}`
            });
        }
    } else {
        // If company context exists, just add small bonus for subreddit alignment
        // but don't penalize mismatches (since user might be disrupting the space)
        if (topicMatches.length >= 1) score += 5;
    }



    // Formality match (0-5)
    const formalityMatch = 1 - Math.abs(
        thread.post.persona.vocabulary.formality - subreddit.formalityLevel
    );
    score += formalityMatch * 5;

    if (formalityMatch > 0.7) {
        strengths.push({
            type: 'formality_match',
            message: 'Writing style matches subreddit formality',
            example: 'Tone is appropriate'
        });
    } else if (formalityMatch < 0.4) {
        issues.push({
            type: 'formality_mismatch',
            severity: 'low',
            message: 'Writing style may not match subreddit culture',
            suggestion: `${subreddit.name} expects ${subreddit.formalityLevel > 0.6 ? 'professional' : 'casual'} tone`
        });
    }

    // Promotion appropriateness (0-5)
    const productMentionCount = thread.topLevelComments.filter(c => c.productMention).length;

    if (subreddit.promotionTolerance === 'zero' && productMentionCount > 0) {
        score += 0;
        issues.push({
            type: 'excessive_promotion',
            severity: 'high',
            message: `${subreddit.name} has zero promotion tolerance`,
            suggestion: 'Remove product mentions or choose different subreddit'
        });
    } else if (subreddit.promotionTolerance === 'low' && productMentionCount > 1) {
        score += 2;
        issues.push({
            type: 'too_promotional',
            severity: 'medium',
            message: 'Too many product mentions for this subreddit',
            suggestion: 'Keep to 1 product mention maximum'
        });
    } else {
        score += 5;
    }

    return { score, issues, strengths };
}


function scoreProblemSpecificity(
    thread: ConversationThread
): { score: number; issues: Issue[]; strengths: Strength[] } {
    let score = 0;
    const issues: Issue[] = [];
    const strengths: Strength[] = [];

    const postContent = thread.post.content.toLowerCase();

    // Concrete details (0-8): numbers, time references, dates
    const hasNumbers = /\d+/.test(postContent);
    const hasTimeReferences = /(hours?|days?|weeks?|months?|minutes?|yesterday|last\s+\w+|ago)/i.test(postContent);
    const hasQuantifiers = /(every|each|always|never|sometimes|usually)/i.test(postContent);

    let detailScore = 0;
    if (hasNumbers) detailScore += 3;
    if (hasTimeReferences) detailScore += 3;
    if (hasQuantifiers) detailScore += 2;
    score += detailScore;

    if (detailScore >= 6) {
        strengths.push({
            type: 'specific_details',
            message: 'Post includes concrete details',
            example: 'Has numbers, timeframes, or specific context'
        });
    } else if (detailScore < 3) {
        issues.push({
            type: 'too_vague',
            severity: 'medium',
            message: 'Post lacks specific details',
            suggestion: 'Add timeframes, numbers, or concrete examples'
        });
    }

    // Specific situation (0-7)
    const hasPersonalContext = /(i'm|i am|i've|i have|my|me|i)/i.test(postContent);
    const hasSpecificScenario = postContent.length > 100; // Longer posts tend to be more specific

    if (hasPersonalContext && hasSpecificScenario) {
        score += 7;
        strengths.push({
            type: 'specific_situation',
            message: 'Describes a specific personal situation',
            example: 'Provides context about their scenario'
        });
    } else if (hasPersonalContext) {
        score += 4;
    } else {
        score += 0;
        issues.push({
            type: 'generic_problem',
            severity: 'medium',
            message: 'Problem description is too generic',
            suggestion: 'Make it more personal and specific to your situation'
        });
    }

    // Avoids "looking for tool" framing (0-5)
    const toolFishing = /(looking for|need a|recommend|suggestion|what tool|best tool)/i.test(postContent);

    if (!toolFishing) {
        score += 5;
        strengths.push({
            type: 'problem_focused',
            message: 'Focuses on problem, not tool-seeking',
            example: 'Not explicitly asking for recommendations'
        });
    } else {
        score += 0;
        issues.push({
            type: 'tool_fishing',
            severity: 'high',
            message: 'Post explicitly asks for tool recommendations',
            suggestion: 'Focus on describing the problem, not seeking solutions'
        });
    }

    return { score, issues, strengths };
}


function scoreAuthenticity(
    thread: ConversationThread
): { score: number; issues: Issue[]; strengths: Strength[] } {
    let score = 0;
    const issues: Issue[] = [];
    const strengths: Strength[] = [];

    // AI pattern detection (0-10)
    const allContent = [
        thread.post.content,
        ...thread.topLevelComments.map(c => c.content),
        ...thread.replies.map(r => r.content)
    ].join(' ');

    const allContentLower = allContent.toLowerCase();

    let patternMatches = AI_PATTERNS.reduce((count, pattern) => {
        const matches = allContent.match(pattern);
        return count + (matches ? matches.length : 0);
    }, 0);

    // NEW: Check for lack of contractions (AI often expands them)
    const contractionCheck = detectMissingContractions(allContent);
    if (contractionCheck.expandedCount > 2) {
        patternMatches += contractionCheck.expandedCount;
    }

    // NEW: Check for suspiciously comprehensive answers
    const avgCommentLength = thread.topLevelComments.length > 0
        ? thread.topLevelComments.reduce((sum, c) => sum + c.content.length, 0) / thread.topLevelComments.length
        : 0;
    if (avgCommentLength > 300) {
        patternMatches += 2; // Penalize overly long comments
    }

    if (patternMatches === 0) {
        score += 10;
        strengths.push({
            type: 'no_ai_patterns',
            message: 'No obvious AI patterns detected',
            example: 'Writing sounds natural and human'
        });
    } else if (patternMatches <= 2) {
        score += 7;
    } else if (patternMatches <= 4) {
        score += 3;
        issues.push({
            type: 'ai_patterns',
            severity: 'medium',
            message: `Detected ${patternMatches} potential AI patterns`,
            suggestion: 'Remove formal language, use contractions, be less comprehensive'
        });
    } else {
        score += 0;
        issues.push({
            type: 'ai_patterns',
            severity: 'critical',
            message: `Detected ${patternMatches} AI writing patterns`,
            suggestion: 'Remove numbered lists, formal transitions, corporate language, expand contractions'
        });
    }

    // Style variance (0-7)
    const allTexts = [
        thread.post.content,
        ...thread.topLevelComments.map(c => c.content)
    ];

    const variance = calculateStyleVariance(allTexts);

    if (variance > 0.3) {
        score += 7;
        strengths.push({
            type: 'style_variance',
            message: 'Good variance in writing styles',
            example: 'Different commenters sound distinct'
        });
    } else if (variance > 0.15) {
        score += 4;
    } else {
        score += 0;
        issues.push({
            type: 'similar_styles',
            severity: 'high',
            message: 'All comments sound too similar',
            suggestion: 'Ensure different personas sound distinct'
        });
    }

    // Natural imperfections (0-5)
    const hasImperfections =
        /\b(honestly|tbh|ngl|lol|kinda| pretty |lowkey|idk|imo|fwiw)\b/i.test(allContentLower) ||
        !allContent.endsWith('.') ||
        /[a-z]\.[A-Z]/.test(allContent) || // Missing space after period
        /\.\.\./g.test(allContent) || // Trailing off
        /[a-z]\s+[a-z]/g.test(allContent.charAt(0) + allContent.slice(1)); // Lowercase start

    if (hasImperfections) {
        score += 5;
        strengths.push({
            type: 'natural_language',
            message: 'Includes natural language patterns',
            example: 'Has casual markers or minor imperfections'
        });
    } else {
        score += 0;
        issues.push({
            type: 'too_perfect',
            severity: 'medium',
            message: 'Writing is too perfect - lacks human imperfections',
            suggestion: 'Add casual language, minor imperfections'
        });
    }

    // Personality consistency (0-3)
    // Check if poster uses their characteristic vocabulary
    const posterVocab = thread.post.persona.vocabulary.characteristic;
    const posterUsesOwnStyle = posterVocab.some(word =>
        thread.post.content.toLowerCase().includes(word.toLowerCase())
    );

    if (posterUsesOwnStyle) {
        score += 3;
    }

    return { score, issues, strengths };
}

/**
 * Helper: Detect when AI expands contractions (e.g., "do not" instead of "don't")
 */
function detectMissingContractions(content: string): { expandedCount: number } {
    let count = 0;
    for (const pattern of EXPANDED_CONTRACTIONS) {
        const matches = content.match(pattern);
        if (matches) {
            count += matches.length;
        }
    }

    return { expandedCount: count };
}


function scoreValueFirst(
    thread: ConversationThread
): { score: number; issues: Issue[]; strengths: Strength[] } {
    let score = 0;
    const issues: Issue[] = [];
    const strengths: Strength[] = [];

    // Product NOT in post (0-8)
    if (!thread.post.content.toLowerCase().includes(thread.post.persona.name.split(' ')[0].toLowerCase())) {
        score += 8;
        strengths.push({
            type: 'value_first_post',
            message: 'Post focuses on problem, not product',
            example: 'No product mention in initial post'
        });
    } else if (thread.arcType === 'comparison') {
        score += 4; // Comparison arc allows product in post
    } else {
        score += 0;
        issues.push({
            type: 'early_product_mention',
            severity: 'high',
            message: 'Product mentioned too early (in post)',
            suggestion: 'Move product mention to comments, not post'
        });
    }

    // Value content precedes product (0-7)
    const firstProductMentionIndex = thread.topLevelComments.findIndex(c => c.productMention);

    if (firstProductMentionIndex === -1) {
        score += 7; // No product mention at all
    } else if (firstProductMentionIndex >= 1) {
        score += 7;
        strengths.push({
            type: 'value_before_product',
            message: 'Helpful comments before product mention',
            example: `Product mentioned in comment ${firstProductMentionIndex + 1}`
        });
    } else if (firstProductMentionIndex === 0) {
        score += 0;
        issues.push({
            type: 'immediate_promotion',
            severity: 'critical',
            message: 'First comment mentions product',
            suggestion: 'Add value/validation comments before product mention'
        });
    }

    // Non-promotional framing (0-5)
    const productComments = thread.topLevelComments.filter(c => c.productMention);
    const hasPromotionalLanguage = productComments.some(c =>
        /(the best|revolutionary|game-changer|must-have|you need|you should buy)/i.test(c.content)
    );

    if (!hasPromotionalLanguage && productComments.length > 0) {
        score += 5;
        strengths.push({
            type: 'natural_mention',
            message: 'Product mentioned naturally',
            example: 'No promotional language detected'
        });
    } else if (hasPromotionalLanguage) {
        score += 0;
        issues.push({
            type: 'promotional_language',
            severity: 'critical',
            message: 'Using promotional language',
            suggestion: 'Make it sound personal: "I use X" not "You need X"'
        });
    }

    return { score, issues, strengths };
}


function scoreEngagementDesign(
    thread: ConversationThread
): { score: number; issues: Issue[]; strengths: Strength[] } {
    let score = 0;
    const issues: Issue[] = [];
    const strengths: Strength[] = [];

    // Post asks genuine question (0-5)
    const hasQuestion = /\?/.test(thread.post.content);

    if (hasQuestion) {
        score += 5;
        strengths.push({
            type: 'asks_question',
            message: 'Post asks for community input',
            example: 'Includes question mark'
        });
    } else {
        score += 0;
        issues.push({
            type: 'no_question',
            severity: 'low',
            message: 'Post doesn\'t ask for help',
            suggestion: 'End with a question to invite responses'
        });
    }

    // OP returns to engage (0-5)
    const opReplies = thread.replies.filter(r => r.replyType === 'op_followup');

    if (opReplies.length >= 2) {
        score += 5;
        strengths.push({
            type: 'op_engagement',
            message: 'OP actively engages with comments',
            example: `${opReplies.length} OP replies`
        });
    } else if (opReplies.length === 1) {
        score += 3;
    } else {
        score += 0;
        issues.push({
            type: 'no_op_engagement',
            severity: 'medium',
            message: 'OP doesn\'t engage with commenters',
            suggestion: 'Add OP replies to make thread realistic'
        });
    }

    // Multiple perspectives (0-3)
    const uniqueCommenters = new Set(thread.topLevelComments.map(c => c.persona.id));

    if (uniqueCommenters.size >= 3) {
        score += 3;
    } else if (uniqueCommenters.size >= 2) {
        score += 2;
    }

    // Relatable framing (0-2)
    const hasRelatableEmotions = /(frustrated|excited|confused|struggling|wondering)/i.test(thread.post.content);

    if (hasRelatableEmotions) {
        score += 2;
    }

    return { score, issues, strengths };
}



/**
 * Predict quality score for conversation thread
 */
export function predictQuality(
    thread: ConversationThread,
    company?: CompanyContext
): QualityScore {
    const subreddit = getSubredditProfile(thread.subreddit);

    // Score each dimension
    const relevance = scoreSubredditRelevance(thread, subreddit, company);
    const specificity = scoreProblemSpecificity(thread);
    const authenticity = scoreAuthenticity(thread);
    const valueFirst = scoreValueFirst(thread);
    const engagement = scoreEngagementDesign(thread);

    // Calculate overall score
    const overall = Math.round(
        relevance.score +
        specificity.score +
        authenticity.score +
        valueFirst.score +
        engagement.score
    );

    // Determine grade
    let grade: QualityScore['grade'];
    if (overall >= 90) grade = 'excellent';
    else if (overall >= 70) grade = 'good';
    else if (overall >= 50) grade = 'needs_improvement';
    else grade = 'poor';

    // Collect all issues and strengths
    const issues = [
        ...relevance.issues,
        ...specificity.issues,
        ...authenticity.issues,
        ...valueFirst.issues,
        ...engagement.issues
    ];

    const strengths = [
        ...relevance.strengths,
        ...specificity.strengths,
        ...authenticity.strengths,
        ...valueFirst.strengths,
        ...engagement.strengths
    ];

    // Generate suggestions
    const suggestions = generateSuggestions(issues);

    return {
        overall,
        dimensions: {
            subredditRelevance: relevance.score,
            problemSpecificity: specificity.score,
            authenticity: authenticity.score,
            valueFirst: valueFirst.score,
            engagementDesign: engagement.score
        },
        grade,
        issues,
        strengths,
        suggestions
    };
}

/**
 * Generate actionable suggestions from issues
 */
function generateSuggestions(issues: Issue[]): string[] {
    // Group by severity
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');

    const suggestions: string[] = [];

    if (criticalIssues.length > 0) {
        suggestions.push(`🔴 CRITICAL: ${criticalIssues[0].suggestion}`);
    }

    if (highIssues.length > 0) {
        suggestions.push(`⚠️ HIGH: ${highIssues[0].suggestion}`);
    }

    // Add general suggestions
    if (issues.some(i => i.type === 'ai_patterns')) {
        suggestions.push('Make language more conversational and less AI-like');
    }

    if (issues.some(i => i.type === 'tool_fishing')) {
        suggestions.push('Reframe post to focus on problem, not seeking tools');
    }

    return suggestions.slice(0, 5); // Max 5 suggestions
}
