/**
 * Custom Error Types for Reddit Mastermind
 * 
 * Provides specific error types for better error handling and debugging
 */

/**
 * Base Error Class
 */

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
        public timeframe: string,
        details?: Record<string, any>
    ) {
        super(message, 'FREQUENCY_LIMIT_ERROR', 429, {
            ...details,
            limit,
            actual,
            timeframe
        });
    }
}



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
