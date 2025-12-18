/**
 * Centralized Configuration for Reddit Mastermind
 * 
 * All constants, limits, and thresholds in one place for easy maintenance
 */

// ============================================
// GENERATION LIMITS
// ============================================

export const GENERATION_LIMITS = {
    // Frequency limits per persona/subreddit per week
    MAX_POSTS_PER_SUBREDDIT: 2,
    MAX_POSTS_PER_PERSONA: 7,
    MAX_PRODUCT_MENTIONS_PER_PERSONA: 2,

    // Posts per week range
    MIN_POSTS_PER_WEEK: 1,
    MAX_POSTS_PER_WEEK: 14,

    // Quality thresholds
    MIN_QUALITY_THRESHOLD: 50,
    MAX_QUALITY_THRESHOLD: 95,
    DEFAULT_QUALITY_THRESHOLD: 75,

    // Regeneration attempts
    MAX_REGENERATION_ATTEMPTS: 1, // Reduced for speed

    // Content generation
    MIN_PERSONAS_REQUIRED: 1,
    MIN_SUBREDDITS_REQUIRED: 1,
    MIN_KEYWORDS_REQUIRED: 3,
} as const;

// ============================================
// TIMING CONFIGURATION
// ============================================

export const TIMING_CONFIG = {
    // Gaps between posts (in minutes)
    MIN_GAP_BETWEEN_POSTS: 120, // 2 hours
    MAX_GAP_BETWEEN_POSTS: 2880, // 2 days

    // Comment timing ranges (in minutes)
    COMMENT_TIMING: {
        MIN: 15,
        MAX: 300, // 5 hours
    },

    // Reply timing ranges (in minutes)
    REPLY_TIMING: {
        MIN: 10,
        MAX: 180, // 3 hours
    },
} as const;

// ============================================
// QUALITY SCORING WEIGHTS
// ============================================

export const QUALITY_WEIGHTS = {
    SUBREDDIT_RELEVANCE: 0.25,
    SPECIFICITY: 0.20,
    AUTHENTICITY: 0.25,
    VALUE_FIRST: 0.20,
    ENGAGEMENT_POTENTIAL: 0.10,
} as const;

// ============================================
// SAFETY VALIDATION THRESHOLDS
// ============================================

export const SAFETY_THRESHOLDS = {
    // Content similarity
    MAX_REPEATED_PHRASES: 30,
    MAX_SIMILARITY_PERCENTAGE: 0.40,

    // Collusion detection
    MAX_COLLUSION_PERCENTAGE: 0.70, // Same personas together

    // Account age simulation (days)
    MIN_ACCOUNT_AGE: 30,
    MAX_ACCOUNT_AGE: 365,
} as const;

// ============================================
// CAMPAIGN SETUP VALIDATION
// ============================================

export const SETUP_VALIDATION = {
    COMPANY: {
        NAME_MIN_LENGTH: 2,
        NAME_MAX_LENGTH: 50,
        PRODUCT_MIN_LENGTH: 10,
        PRODUCT_MAX_LENGTH: 500,
    },

    VALUE_PROPOSITIONS: {
        MIN_ITEMS: 2,
        MAX_ITEMS: 5,
        MIN_LENGTH: 10,
        MAX_LENGTH: 100,
    },

    KEYWORDS: {
        MIN_ITEMS: 3,
        MAX_ITEMS: 15,
    },
} as const;

// ============================================
// LLM CONFIGURATION
// ============================================

export const LLM_CONFIG = {
    DEFAULT_MODEL: 'gemini-1.5-flash',
    TEMPERATURE: 0.8, // Higher for more creative, natural content
    MAX_TOKENS: 500,

    // Timeouts
    REQUEST_TIMEOUT: 30000, // 30 seconds

    // Rate limiting
    MAX_CONCURRENT_REQUESTS: 5,
} as const;

// ============================================
// UI CONFIGURATION
// ============================================

export const UI_CONFIG = {
    // Animation durations (ms)
    ANIMATION_DURATION: 200,

    // Debounce delays (ms)
    SEARCH_DEBOUNCE: 300,
    VALIDATION_DEBOUNCE: 500,

    // Pagination
    ITEMS_PER_PAGE: 20,
} as const;

// ============================================
// HELPER TYPES
// ============================================

export type GenerationLimit = keyof typeof GENERATION_LIMITS;
export type QualityWeight = keyof typeof QUALITY_WEIGHTS;
export type SafetyThreshold = keyof typeof SAFETY_THRESHOLDS;
