/**
 * Custom Error Types for Reddit Mastermind
 * 
 * Provides specific error types for better error handling and debugging
 */

// ============================================
// BASE ERROR CLASSES
// ============================================

export class RedditMastermindError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500,
        public details?: Record<string, any>
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

// ============================================
// VALIDATION ERRORS
// ============================================

export class ValidationError extends RedditMastermindError {
    constructor(message: string, public field?: string, details?: Record<string, any>) {
        super(message, 'VALIDATION_ERROR', 400, details);
    }
}

export class FrequencyLimitError extends RedditMastermindError {
    constructor(
        message: string,
        public limit: number,
        public actual: number,
        public entity: string
    ) {
        super(
            message,
            'FREQUENCY_LIMIT_EXCEEDED',
            400,
            { limit, actual, entity }
        );
    }
}

export class QualityThresholdError extends RedditMastermindError {
    constructor(
        message: string,
        public threshold: number,
        public actualScore: number
    ) {
        super(
            message,
            'QUALITY_THRESHOLD_NOT_MET',
            400,
            { threshold, actualScore }
        );
    }
}

// ============================================
// GENERATION ERRORS
// ============================================

export class GenerationError extends RedditMastermindError {
    constructor(message: string, details?: Record<string, any>) {
        super(message, 'GENERATION_ERROR', 500, details);
    }
}

export class PersonaSelectionError extends RedditMastermindError {
    constructor(message: string, availablePersonas: number, required: number) {
        super(
            message,
            'PERSONA_SELECTION_ERROR',
            400,
            { availablePersonas, required }
        );
    }
}

export class SubredditSelectionError extends RedditMastermindError {
    constructor(message: string, availableSubreddits: number, required: number) {
        super(
            message,
            'SUBREDDIT_SELECTION_ERROR',
            400,
            { availableSubreddits, required }
        );
    }
}

// ============================================
// LLM ERRORS
// ============================================

export class LLMError extends RedditMastermindError {
    constructor(
        message: string,
        public provider: string,
        public originalError?: Error
    ) {
        super(
            message,
            'LLM_ERROR',
            500,
            { provider, originalError: originalError?.message }
        );
    }
}

export class RateLimitError extends RedditMastermindError {
    constructor(
        message: string,
        public retryAfter?: number
    ) {
        super(
            message,
            'RATE_LIMIT_ERROR',
            429,
            { retryAfter }
        );
    }
}

export class APIKeyError extends RedditMastermindError {
    constructor(message: string = 'API key is missing or invalid') {
        super(message, 'API_KEY_ERROR', 401);
    }
}

// ============================================
// SAFETY ERRORS
// ============================================

export class SafetyViolationError extends RedditMastermindError {
    constructor(
        message: string,
        public violations: string[]
    ) {
        super(
            message,
            'SAFETY_VIOLATION',
            400,
            { violations }
        );
    }
}

export class CollusionDetectedError extends RedditMastermindError {
    constructor(
        message: string,
        public collusionRate: number
    ) {
        super(
            message,
            'COLLUSION_DETECTED',
            400,
            { collusionRate }
        );
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if error is a known Reddit Mastermind error
 */
export function isRedditMastermindError(error: unknown): error is RedditMastermindError {
    return error instanceof RedditMastermindError;
}

/**
 * Convert any error to a standardized error response
 */
export function toErrorResponse(error: unknown): {
    error: string;
    code: string;
    statusCode: number;
    details?: Record<string, any>;
} {
    if (isRedditMastermindError(error)) {
        return {
            error: error.message,
            code: error.code,
            statusCode: error.statusCode,
            details: error.details,
        };
    }

    // Handle standard errors
    if (error instanceof Error) {
        return {
            error: error.message,
            code: 'INTERNAL_ERROR',
            statusCode: 500,
        };
    }

    // Unknown error
    return {
        error: 'An unknown error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 500,
    };
}
