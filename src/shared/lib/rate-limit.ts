/**
 * Rate Limiting Utility
 * 
 * Implements in-memory rate limiting for API endpoints.
 * Tracks requests by IP address and enforces configurable limits.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

class RateLimiter {
    private requests: Map<string, RateLimitEntry> = new Map();
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;

        // Clean up expired entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Check if a request should be allowed
     */
    check(identifier: string): {
        allowed: boolean;
        remaining: number;
        resetTime: number;
    } {
        const now = Date.now();
        const entry = this.requests.get(identifier);

        // No previous requests or window expired
        if (!entry || now > entry.resetTime) {
            const resetTime = now + this.config.windowMs;
            this.requests.set(identifier, {
                count: 1,
                resetTime,
            });

            return {
                allowed: true,
                remaining: this.config.maxRequests - 1,
                resetTime,
            };
        }

        // Within window - check if limit exceeded
        if (entry.count >= this.config.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime,
            };
        }

        // Increment count
        entry.count++;
        this.requests.set(identifier, entry);

        return {
            allowed: true,
            remaining: this.config.maxRequests - entry.count,
            resetTime: entry.resetTime,
        };
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.requests.entries()) {
            if (now > entry.resetTime) {
                this.requests.delete(key);
            }
        }
    }

    /**
     * Reset rate limit for a specific identifier (useful for testing)
     */
    reset(identifier: string): void {
        this.requests.delete(identifier);
    }

    /**
     * Get current status for an identifier
     */
    getStatus(identifier: string): {
        count: number;
        remaining: number;
        resetTime: number | null;
    } {
        const entry = this.requests.get(identifier);
        const now = Date.now();

        if (!entry || now > entry.resetTime) {
            return {
                count: 0,
                remaining: this.config.maxRequests,
                resetTime: null,
            };
        }

        return {
            count: entry.count,
            remaining: Math.max(0, this.config.maxRequests - entry.count),
            resetTime: entry.resetTime,
        };
    }
}

// Create rate limiter instances for different endpoints
export const generateRateLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
});

export const regenerateRateLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
});

/**
 * Extract client identifier from request
 * Uses IP address as identifier (can be enhanced with user ID in production)
 */
export function getClientIdentifier(request: Request): string {
    // Try to get real IP from headers (for production with proxies/load balancers)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, use the first one
        return forwardedFor.split(',')[0].trim();
    }

    if (realIp) {
        return realIp;
    }

    // Fallback to a default identifier for local development
    // In production, you might want to use user ID from auth session
    return 'local-dev';
}

/**
 * Format time remaining until reset
 */
export function formatResetTime(resetTime: number): string {
    const now = Date.now();
    const diff = resetTime - now;

    if (diff <= 0) {
        return 'now';
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }

    return `${seconds}s`;
}
