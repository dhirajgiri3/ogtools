import { SubredditContext } from '@/core/types';

/**
 * Subreddit Profiles Database
 * 
 * Detailed metadata for each target subreddit including culture, formality,
 * acceptable language patterns, moderation levels, and common topics.
 */

export const SUBREDDIT_PROFILES: Record<string, SubredditContext> = {
    'r/productivity': {
        name: 'r/productivity',
        culture: 'casual',
        formalityLevel: 0.4,
        typicalCommentLength: { min: 50, max: 300 },
        acceptableMarkers: ['lol', 'tbh', 'ngl', 'honestly', 'literally', 'fr'],
        avoidMarkers: ['academic jargon', 'overly formal language', 'corporate speak'],
        moderationLevel: 'moderate',
        promotionTolerance: 'moderate',
        commonTopics: [
            'time management',
            'workflow optimization',
            'app recommendations',
            'work-life balance',
            'focus techniques',
            'productivity hacks',
            'task management',
            'goal setting'
        ]
    },

    'r/PowerPoint': {
        name: 'r/PowerPoint',
        culture: 'casual',
        formalityLevel: 0.3,
        typicalCommentLength: { min: 40, max: 250 },
        acceptableMarkers: ['lol', 'tbh', 'honestly', 'literally'],
        avoidMarkers: ['technical jargon', 'overly academic'],
        moderationLevel: 'relaxed',
        promotionTolerance: 'moderate',
        commonTopics: [
            'formatting issues',
            'design tips',
            'animation help',
            'template recommendations',
            'slide layout',
            'presentation tips',
            'PowerPoint features'
        ]
    },

    'r/GoogleSlides': {
        name: 'r/GoogleSlides',
        culture: 'casual',
        formalityLevel: 0.35,
        typicalCommentLength: { min: 40, max: 250 },
        acceptableMarkers: ['lol', 'tbh', 'honestly'],
        avoidMarkers: ['technical jargon', 'corporate speak'],
        moderationLevel: 'relaxed',
        promotionTolerance: 'moderate',
        commonTopics: [
            'formatting questions',
            'collaboration features',
            'template sharing',
            'design advice',
            'Google Workspace tips',
            'slide transitions'
        ]
    },

    'r/consulting': {
        name: 'r/consulting',
        culture: 'professional',
        formalityLevel: 0.7,
        typicalCommentLength: { min: 100, max: 400 },
        acceptableMarkers: ['in my experience', 'typically', 'generally', 'IMO', 'IMHO'],
        avoidMarkers: ['lol', 'lmao', 'excessive slang', 'unprofessional language'],
        moderationLevel: 'moderate',
        promotionTolerance: 'low',
        commonTopics: [
            'client management',
            'deliverables',
            'project delivery',
            'career advice',
            'consulting frameworks',
            'client meetings',
            'strategy work',
            'work-life balance'
        ]
    },

    'r/entrepreneur': {
        name: 'r/entrepreneur',
        culture: 'professional',
        formalityLevel: 0.6,
        typicalCommentLength: { min: 80, max: 350 },
        acceptableMarkers: ['honestly', 'IMO', 'in my experience', 'tbh'],
        avoidMarkers: ['excessive casualness', 'unprofessional'],
        moderationLevel: 'moderate',
        promotionTolerance: 'moderate',
        commonTopics: [
            'startup growth',
            'business strategy',
            'productivity tools',
            'scaling challenges',
            'founder mindset',
            'product development',
            'customer acquisition',
            'time management'
        ]
    },

    'r/startups': {
        name: 'r/startups',
        culture: 'professional',
        formalityLevel: 0.65,
        typicalCommentLength: { min: 90, max: 380 },
        acceptableMarkers: ['honestly', 'IMO', 'in my experience'],
        avoidMarkers: ['excessive slang', 'unprofessional'],
        moderationLevel: 'moderate',
        promotionTolerance: 'low',
        commonTopics: [
            'fundraising',
            'product-market fit',
            'team building',
            'growth strategies',
            'startup operations',
            'founder challenges',
            'MVP development',
            'customer validation'
        ]
    },

    'r/smallbusiness': {
        name: 'r/smallbusiness',
        culture: 'professional',
        formalityLevel: 0.55,
        typicalCommentLength: { min: 70, max: 320 },
        acceptableMarkers: ['honestly', 'IMO', 'in my experience', 'tbh'],
        avoidMarkers: ['academic jargon', 'overly formal'],
        moderationLevel: 'moderate',
        promotionTolerance: 'moderate',
        commonTopics: [
            'customer management',
            'operations efficiency',
            'marketing strategies',
            'financial planning',
            'growth challenges',
            'tool recommendations',
            'time saving tips'
        ]
    },

    'r/business': {
        name: 'r/business',
        culture: 'professional',
        formalityLevel: 0.6,
        typicalCommentLength: { min: 80, max: 350 },
        acceptableMarkers: ['typically', 'generally', 'IMO', 'in my experience'],
        avoidMarkers: ['lol', 'lmao', 'excessive slang'],
        moderationLevel: 'moderate',
        promotionTolerance: 'low',
        commonTopics: [
            'business strategy',
            'market trends',
            'operational efficiency',
            'management advice',
            'industry insights',
            'professional development'
        ]
    },

    'r/marketing': {
        name: 'r/marketing',
        culture: 'professional',
        formalityLevel: 0.5,
        typicalCommentLength: { min: 70, max: 330 },
        acceptableMarkers: ['honestly', 'IMO', 'in my experience', 'tbh'],
        avoidMarkers: ['unprofessional language'],
        moderationLevel: 'moderate',
        promotionTolerance: 'moderate',
        commonTopics: [
            'content marketing',
            'campaign strategies',
            'analytics tools',
            'social media',
            'brand building',
            'marketing automation',
            'conversion optimization'
        ]
    },

    'r/presentations': {
        name: 'r/presentations',
        culture: 'casual',
        formalityLevel: 0.45,
        typicalCommentLength: { min: 60, max: 280 },
        acceptableMarkers: ['honestly', 'tbh', 'literally'],
        avoidMarkers: ['overly academic', 'corporate jargon'],
        moderationLevel: 'relaxed',
        promotionTolerance: 'moderate',
        commonTopics: [
            'presentation design',
            'public speaking',
            'slide templates',
            'visual storytelling',
            'presentation software',
            'design best practices'
        ]
    },

    // NEW B2B / SAAS SUBREDDITS
    'r/SaaS': {
        name: 'r/SaaS',
        culture: 'professional',
        formalityLevel: 0.6,
        typicalCommentLength: { min: 80, max: 350 },
        acceptableMarkers: ['MRR', 'ARR', 'churn', 'validation', 'PMF', 'imo'],
        avoidMarkers: ['excessive self-promo', 'low-effort posts'],
        moderationLevel: 'moderate',
        promotionTolerance: 'moderate',
        commonTopics: [
            'pricing strategy',
            'customer acquisition',
            'churn reduction',
            'tech stack',
            'marketing channels',
            'bootstrapping',
            'payment gateways',
            'hiring'
        ]
    },

    'r/sideproject': {
        name: 'r/sideproject',
        culture: 'casual',
        formalityLevel: 0.4,
        typicalCommentLength: { min: 50, max: 250 },
        acceptableMarkers: ['feedback?', 'thoughts?', 'built this', 'weekend project', 'tbh'],
        avoidMarkers: ['corporate speak', 'formal pitches'],
        moderationLevel: 'relaxed',
        promotionTolerance: 'moderate',
        commonTopics: [
            'idea validation',
            'project showcase',
            'getting first users',
            'tech stack',
            'monetization',
            'launch strategies',
            'product hunt'
        ]
    },

    'r/growthhacking': {
        name: 'r/growthhacking',
        culture: 'professional',
        formalityLevel: 0.55,
        typicalCommentLength: { min: 60, max: 300 },
        acceptableMarkers: ['case study', 'results', 'tactics', 'insights'],
        avoidMarkers: ['spam', 'black hat', 'vague advice'],
        moderationLevel: 'moderate',
        promotionTolerance: 'low',
        commonTopics: [
            'viral loops',
            'seo strategies',
            'cold outreach',
            'conversion optimization',
            'social media growth',
            'email marketing',
            'analytics',
            'user acquisition'
        ]
    },

    'r/digitalmarketing': {
        name: 'r/digitalmarketing',
        culture: 'professional',
        formalityLevel: 0.6,
        typicalCommentLength: { min: 70, max: 320 },
        acceptableMarkers: ['ROI', 'CPC', 'CTR', 'in my experience'],
        avoidMarkers: ['guru spam', 'get rich quick'],
        moderationLevel: 'strict',
        promotionTolerance: 'low',
        commonTopics: [
            'seo updates',
            'ppc campaigns',
            'content strategy',
            'social media algorithms',
            'agency life',
            'client management',
            'marketing tools',
            'career advice'
        ]
    },

    'r/webdev': {
        name: 'r/webdev',
        culture: 'technical',
        formalityLevel: 0.5,
        typicalCommentLength: { min: 40, max: 300 },
        acceptableMarkers: ['docs', 'repo', 'bug', 'framework', 'imo'],
        avoidMarkers: ['marketing fluff', 'non-technical questions'],
        moderationLevel: 'strict',
        promotionTolerance: 'zero',
        commonTopics: [
            'frontend frameworks',
            'backend architecture',
            'css tricks',
            'api design',
            'career questions',
            'hosting solutions',
            'performance optimization',
            'debugging'
        ]
    },

    'r/AskMarketing': {
        name: 'r/AskMarketing',
        culture: 'professional',
        formalityLevel: 0.55,
        typicalCommentLength: { min: 60, max: 300 },
        acceptableMarkers: ['advice needed', 'what do you think', 'recommendations'],
        avoidMarkers: ['spam', 'self-promo'],
        moderationLevel: 'moderate',
        promotionTolerance: 'low',
        commonTopics: [
            'marketing strategy',
            'tool recommendations',
            'career advice',
            'student questions',
            'social media help',
            'digital marketing basics'
        ]
    }
};

/**
 * Get subreddit profile with fallback defaults
 */
export function getSubredditProfile(subreddit: string): SubredditContext {
    const profile = SUBREDDIT_PROFILES[subreddit];

    if (!profile) {
        // Return default profile for unknown subreddits
        console.warn(`No profile found for ${subreddit}, using defaults`);
        return {
            name: subreddit,
            culture: 'casual',
            formalityLevel: 0.5,
            typicalCommentLength: { min: 60, max: 300 },
            acceptableMarkers: ['honestly', 'tbh', 'IMO'],
            avoidMarkers: ['spam', 'promotional language'],
            moderationLevel: 'moderate',
            promotionTolerance: 'low',
            commonTopics: ['general discussion']
        };
    }

    return profile;
}

/**
 * Get all available subreddit names
 */
export function getAllSubreddits(): string[] {
    return Object.keys(SUBREDDIT_PROFILES);
}

/**
 * Get subreddits by culture type
 */
export function getSubredditsByCulture(culture: SubredditContext['culture']): string[] {
    return Object.entries(SUBREDDIT_PROFILES)
        .filter(([_, profile]) => profile.culture === culture)
        .map(([name, _]) => name);
}
