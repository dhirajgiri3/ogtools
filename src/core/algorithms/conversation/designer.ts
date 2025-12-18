import { generateWithOpenAI } from '@/shared/lib/api/openai-client';
import {
    ArcTemplate,
    Persona,
    CompanyContext,
    SubredditContext,
    ConversationThread,
    Post,
    Comment,
    Reply,
    PostTemplate,
    CommentTemplate,
    ReplyTemplate
} from '@/core/types';
import { getSubredditProfile } from '@/core/data/subreddits/profiles';
import { injectAuthenticity } from '../authenticity/engine';
import { buildPostPrompt, buildCommentPrompt, buildReplyPrompt } from './prompt-builder';

/**
 * Conversation Designer (Layer 2)
 * 
 * Generates complete conversation threads using predefined arc templates.
 * Creates posts, top-level comments, and nested replies with realistic structure.
 */

// ============================================
// ARC TEMPLATES
// ============================================

export const ARC_TEMPLATES: ArcTemplate[] = [
    {
        type: 'discovery',
        name: 'Discovery Arc',
        description: 'User discovers solution through community help - VALUE FIRST',
        postTemplate: {
            tone: 'genuine_question',
            framing: 'time_spent',
            emotion: 'frustration',
            mentionProduct: false
        },
        commentTemplates: [
            {
                // COMMENT 1: Pure empathy - NO solutions yet
                purpose: 'validate_problem',
                tone: 'empathetic',
                timingRange: { min: 15, max: 45 },
                productMention: false
            },
            {
                // COMMENT 2: Ask clarifying question - builds engagement
                purpose: 'ask_clarifying_question',
                tone: 'curious',
                timingRange: { min: 30, max: 75 },
                productMention: false
            },
            {
                // COMMENT 3: Generic workflow advice - NO tools
                purpose: 'suggest_approach',
                tone: 'helpful',
                timingRange: { min: 60, max: 120 },
                productMention: false
            },
            {
                // COMMENT 4: FINALLY mention tool - earned through value
                purpose: 'tool_mention',
                tone: 'casual_recommendation',
                timingRange: { min: 120, max: 240 },
                productMention: true,
                productFraming: 'personal_discovery'
            }
        ],
        replyTemplates: [
            {
                replyType: 'op_followup',
                purpose: 'acknowledge',
                tone: 'grateful'
            },
            {
                replyType: 'op_followup',
                purpose: 'answer_clarifying_question',
                tone: 'informative'
            },
            {
                replyType: 'op_followup',
                purpose: 'show_interest',
                tone: 'curious'
            },
            {
                replyType: 'commenter_elaboration',
                purpose: 'build_on_advice',
                tone: 'supportive'
            }
        ]
    },

    {
        type: 'comparison',
        name: 'Comparison Arc',
        description: 'User researching options, gets balanced feedback',
        postTemplate: {
            tone: 'research_question',
            framing: 'comparison',
            emotion: 'curiosity',
            mentionProduct: true  // Product mentioned in post for comparison
        },
        commentTemplates: [
            {
                purpose: 'balanced_comparison',
                tone: 'experienced_user',
                timingRange: { min: 20, max: 60 },
                productMention: true,
                productFraming: 'comparative_experience'
            },
            {
                purpose: 'different_perspective',
                tone: 'nuanced',
                timingRange: { min: 45, max: 120 },
                productMention: true,
                productFraming: 'qualified_recommendation'
            },
            {
                purpose: 'clarification',
                tone: 'helpful',
                timingRange: { min: 60, max: 180 },
                productMention: false
            }
        ],
        replyTemplates: [
            {
                replyType: 'op_followup',
                purpose: 'thanks_for_detail',
                tone: 'appreciative'
            },
            {
                replyType: 'commenter_elaboration',
                purpose: 'agree_elaborate',
                tone: 'collaborative'
            }
        ]
    },

    {
        type: 'problemSolver',
        name: 'Problem Solver Arc',
        description: 'User vents frustration, community provides solutions - EMPATHY FIRST',
        postTemplate: {
            tone: 'venting_frustration',
            framing: 'frustration',
            emotion: 'frustration',
            mentionProduct: false
        },
        commentTemplates: [
            {
                // COMMENT 1: Pure empathy - "I feel you"
                purpose: 'empathy_validation',
                tone: 'supportive',
                timingRange: { min: 10, max: 30 },
                productMention: false
            },
            {
                // COMMENT 2: Share similar experience - builds trust
                purpose: 'share_similar_experience',
                tone: 'relatable',
                timingRange: { min: 25, max: 60 },
                productMention: false
            },
            {
                // COMMENT 3: Generic workflow suggestion - NO tools
                purpose: 'workflow_suggestion',
                tone: 'advice_giving',
                timingRange: { min: 60, max: 120 },
                productMention: false
            },
            {
                // COMMENT 4: Tool mention - only after value established
                purpose: 'tool_mention_with_context',
                tone: 'problem_solving',
                timingRange: { min: 120, max: 300 },
                productMention: true,
                productFraming: 'problem_specific'
            }
        ],
        replyTemplates: [
            {
                replyType: 'op_followup',
                purpose: 'relate_to_experience',
                tone: 'relieved'
            },
            {
                replyType: 'op_followup',
                purpose: 'vent_agreement',
                tone: 'cathartic'
            },
            {
                replyType: 'op_followup',
                purpose: 'express_intent_to_try',
                tone: 'hopeful'
            },
            {
                replyType: 'op_followup',
                purpose: 'thanks_checking_out',
                tone: 'grateful'
            }
        ]
    }
];

// ============================================
// PERSONA SELECTION LOGIC
// ============================================

/**
 * Score persona for subreddit fit
 */
export function scorePersonaForSubreddit(
    persona: Persona,
    subreddit: SubredditContext
): number {
    let score = 0;

    // Interest overlap (10 points per matching topic)
    const interestOverlap = persona.interests.filter(interest =>
        subreddit.commonTopics.some(topic =>
            topic.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(topic.toLowerCase())
        )
    );
    score += interestOverlap.length * 10;

    // Formality match (max 20 points)
    const formalityDiff = Math.abs(persona.vocabulary.formality - subreddit.formalityLevel);
    score += (1 - formalityDiff) * 20;

    // Culture match (15 points if default style matches)
    const cultureMatch =
        (subreddit.culture === 'casual' && persona.communicationStyle.default === 'casual') ||
        (subreddit.culture === 'professional' && persona.communicationStyle.default === 'professional') ||
        (subreddit.culture === 'technical' && persona.communicationStyle.default === 'technical');
    if (cultureMatch) score += 15;

    return score;
}

/**
 * Select personas for arc (poster + commenters)
 */
export function selectPersonasForArc(
    personas: Persona[],
    subreddit: SubredditContext,
    numCommenters: number = 3,
    usedPosters: Set<string> = new Set()
): {
    poster: Persona;
    commenters: Persona[];
} {
    // Score all personas for subreddit match
    const scoredPersonas = personas.map(p => ({
        persona: p,
        score: scorePersonaForSubreddit(p, subreddit)
    })).sort((a, b) => b.score - a.score);

    // Select poster: rotate through personas to ensure fair distribution
    let poster: Persona;

    if (personas.length === 1) {
        // Only one persona - use it
        poster = scoredPersonas[0].persona;
    } else {
        // Find highest-scoring persona that hasn't been used yet
        const unusedPersona = scoredPersonas.find(sp => !usedPosters.has(sp.persona.id));

        if (unusedPersona) {
            // Use an unused persona (prioritize by subreddit match score)
            poster = unusedPersona.persona;
        } else {
            // All personas used - use round-robin based on set size
            // This ensures even distribution instead of always picking highest scorer
            const rotationIndex = usedPosters.size % personas.length;
            poster = personas[rotationIndex];
        }
    }

    // Select commenters to MAXIMIZE VARIANCE (not just top scorers)
    const availableCommenters = scoredPersonas.filter(sp => sp.persona.id !== poster.id);
    const commenters: Persona[] = [];

    if (availableCommenters.length > 0) {
        // Strategy: Pick personas with diverse formality levels to maximize style variance
        const formalityLevels = availableCommenters.map(sp => sp.persona.vocabulary.formality);
        const minFormality = Math.min(...formalityLevels);
        const maxFormality = Math.max(...formalityLevels);

        // 1. Pick most casual persona (lowest formality)
        const casualPersona = availableCommenters.find(sp =>
            sp.persona.vocabulary.formality === minFormality
        );
        if (casualPersona && commenters.length < numCommenters) {
            commenters.push(casualPersona.persona);
        }

        // 2. Pick most formal persona (highest formality, different from casual)
        const formalPersona = availableCommenters.find(sp =>
            sp.persona.vocabulary.formality === maxFormality &&
            !commenters.some(c => c.id === sp.persona.id)
        );
        if (formalPersona && commenters.length < numCommenters) {
            commenters.push(formalPersona.persona);
        }

        // 3. Fill remaining slots with highest scorers not yet selected
        for (const sp of availableCommenters) {
            if (commenters.length >= numCommenters) break;
            if (!commenters.some(c => c.id === sp.persona.id)) {
                commenters.push(sp.persona);
            }
        }
    } else if (personas.length === 1) {
        // Edge case: Only 1 persona total
        // Allow them to comment on their own post (realistic for small teams)
        commenters.push(poster);
    }

    return { poster, commenters };
}

// ============================================
// CONTENT GENERATION FUNCTIONS
// ============================================

/**
 * Generate post content
 */
export async function generatePost(
    template: PostTemplate,
    persona: Persona,
    company: CompanyContext,
    subreddit: SubredditContext,
    keywords: string[]
): Promise<Post> {
    const prompt = buildPostPrompt(template, persona, company, subreddit, keywords);
    const rawContent = await generateWithOpenAI(prompt);
    const content = await injectAuthenticity(rawContent, persona, subreddit.name, 'post');

    return {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        persona,
        subreddit: subreddit.name,
        content,
        emotion: template.emotion,
        keywords,
        scheduledTime: new Date() // Will be set by timing engine
    };
}

/**
 * Generate comment content
 */
export async function generateComment(
    template: CommentTemplate,
    persona: Persona,
    company: CompanyContext,
    subreddit: SubredditContext,
    postContent: string,
    posterName: string,
    keywords: string[] = []
): Promise<Comment> {
    const prompt = buildCommentPrompt(
        template,
        persona,
        company,
        subreddit,
        postContent,
        posterName,
        keywords
    );
    const rawContent = await generateWithOpenAI(prompt);
    const content = await injectAuthenticity(rawContent, persona, subreddit.name, 'comment');

    return {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        persona,
        content,
        scheduledTime: new Date(), // Will be set by timing engine
        replyTo: 'post',
        purpose: template.purpose,
        productMention: template.productMention
    };
}

/**
 * Generate reply content
 */
export async function generateReply(
    template: ReplyTemplate,
    persona: Persona,
    subreddit: SubredditContext,
    postContent: string,
    parentCommentContent: string,
    parentCommentId: string,
    isOP: boolean
): Promise<Reply> {
    const prompt = buildReplyPrompt(
        template,
        persona,
        subreddit,
        postContent,
        parentCommentContent,
        isOP
    );
    const rawContent = await generateWithOpenAI(prompt);
    const content = await injectAuthenticity(rawContent, persona, subreddit.name, 'reply');

    return {
        id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        persona,
        content,
        scheduledTime: new Date(), // Will be set by timing engine
        parentCommentId,
        replyType: template.replyType
    };
}

/**
 * Generate complete conversation thread
 */
export async function generateConversation(
    arcType: 'discovery' | 'comparison' | 'problemSolver',
    personas: Persona[],
    company: CompanyContext,
    subreddit: string,
    keywords: string[],
    usedPosters: Set<string> = new Set()
): Promise<Omit<ConversationThread, 'qualityScore'>> {
    // Get arc template
    const arc = ARC_TEMPLATES.find(a => a.type === arcType);
    if (!arc) throw new Error(`Unknown arc type: ${arcType}`);

    // Get subreddit profile
    const subredditProfile = getSubredditProfile(subreddit);

    // Select personas for roles (with rotation tracking)
    const { poster, commenters } = selectPersonasForArc(personas, subredditProfile, arc.commentTemplates.length, usedPosters);

    // Generate post
    const post = await generatePost(arc.postTemplate, poster, company, subredditProfile, keywords);

    // PERFORMANCE OPTIMIZATION: Parallelize comment generation
    // Cycle through available commenters if we have fewer than templates
    const commentPromises = arc.commentTemplates.map((template, i) => {
        if (commenters.length === 0) return null;

        // Cycle through commenters (allows one persona to make multiple comments)
        const commenter = commenters[i % commenters.length];

        // CRITICAL SAFETY: Force first comment to NEVER mention product
        const safeTemplate = i === 0
            ? { ...template, productMention: false, productFraming: undefined }
            : template;

        return generateComment(
            safeTemplate,
            commenter,
            company,
            subredditProfile,
            post.content,
            poster.name,
            keywords // Pass keywords for SEO targeting
        );
    });

    const topLevelComments = (await Promise.all(commentPromises)).filter((c): c is Comment => c !== null);

    // PERFORMANCE OPTIMIZATION: Parallelize reply generation  
    const replyPromises = arc.replyTemplates.map((replyTemplate, i) => {
        if (i >= topLevelComments.length) return null;

        const isOP = replyTemplate.replyType === 'op_followup';
        const replyPersona = isOP ? poster : commenters[Math.min(i, commenters.length - 1)];
        const parentComment = topLevelComments[i];

        return generateReply(
            replyTemplate,
            replyPersona,
            subredditProfile,
            post.content,
            parentComment.content,
            parentComment.id,
            isOP
        );
    });

    const replies = (await Promise.all(replyPromises)).filter((r): r is Reply => r !== null);

    return {
        id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        post,
        topLevelComments,
        replies,
        arcType,
        subreddit
    };
}

/**
 * Generate conversation with specific poster persona (for rotation control)
 */
export async function generateConversationWithPersona(
    arcType: 'discovery' | 'comparison' | 'problemSolver',
    posterPersona: Persona,
    allPersonas: Persona[],
    company: CompanyContext,
    subreddit: string,
    keywords: string[]
): Promise<Omit<ConversationThread, 'qualityScore'>> {
    // Get arc template
    const arc = ARC_TEMPLATES.find(a => a.type === arcType);
    if (!arc) throw new Error(`Unknown arc type: ${arcType}`);

    // Get subreddit profile
    const subredditProfile = getSubredditProfile(subreddit);

    // Use the assigned poster
    const poster = posterPersona;

    // Select commenters (excluding the poster)
    const availableCommenters = allPersonas.filter(p => p.id !== poster.id);
    const scoredCommenters = availableCommenters.map(p => ({
        persona: p,
        score: scorePersonaForSubreddit(p, subredditProfile)
    })).sort((a, b) => b.score - a.score);

    const commenters: Persona[] = scoredCommenters
        .slice(0, arc.commentTemplates.length)
        .map(sc => sc.persona);

    // If no other personas available, allow poster to comment
    if (commenters.length === 0 && allPersonas.length === 1) {
        commenters.push(poster);
    }

    // Generate post
    const post = await generatePost(arc.postTemplate, poster, company, subredditProfile, keywords);

    // Generate comments in parallel
    const commentPromises = arc.commentTemplates.map((template, i) => {
        if (commenters.length === 0) return null;

        const commenter = commenters[i % commenters.length];

        // Force first comment to NEVER mention product
        const safeTemplate = i === 0
            ? { ...template, productMention: false, productFraming: undefined }
            : template;

        return generateComment(
            safeTemplate,
            commenter,
            company,
            subredditProfile,
            post.content,
            poster.name,
            keywords
        );
    });

    const topLevelComments = (await Promise.all(commentPromises)).filter((c): c is Comment => c !== null);

    // Generate replies in parallel
    const replyPromises = arc.replyTemplates.map((replyTemplate, i) => {
        if (i >= topLevelComments.length) return null;

        const isOP = replyTemplate.replyType === 'op_followup';
        const replyPersona = isOP ? poster : commenters[Math.min(i, commenters.length - 1)];
        const parentComment = topLevelComments[i];

        return generateReply(
            replyTemplate,
            replyPersona,
            subredditProfile,
            post.content,
            parentComment.content,
            parentComment.id,
            isOP
        );
    });

    const replies = (await Promise.all(replyPromises)).filter((r): r is Reply => r !== null);

    return {
        id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        post,
        topLevelComments,
        replies,
        arcType,
        subreddit
    };
}

/**
 * Get random arc type (with distribution)
 */
export function getRandomArcType(): 'discovery' | 'comparison' | 'problemSolver' {
    const rand = Math.random();
    // 40% discovery, 30% comparison, 30% problem-solver
    if (rand < 0.4) return 'discovery';
    if (rand < 0.7) return 'comparison';
    return 'problemSolver';
}
