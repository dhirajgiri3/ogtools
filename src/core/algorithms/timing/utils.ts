/**
 * Timing Utilities
 * 
 * Helper functions for date/time manipulation and scheduling.
 */

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
}

/**
 * Add hours to a date
 */
export function addHours(date: Date, hours: number): Date {
    return new Date(date.getTime() + hours * 3600000);
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Get random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random float with variance
 */
export function randomWithVariance(base: number, variance: number): number {
    const min = base * (1 - variance);
    const max = base * (1 + variance);
    return Math.random() * (max - min) + min;
}

/**
 * Check if date is weekend
 */
export function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Get hour of day (0-23)
 */
export function getHour(date: Date): number {
    return date.getHours();
}

/**
 * Set hour of day while preserving date
 */
export function setHour(date: Date, hour: number): Date {
    const result = new Date(date);
    result.setHours(hour, randomInt(0, 59), randomInt(0, 59));
    return result;
}

/**
 * Get start of week (Monday)
 */
export function getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days, else go to Monday
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Get random date within week
 */
export function getRandomDateInWeek(weekStart: Date): Date {
    const daysOffset = randomInt(0, 6);
    return addDays(weekStart, daysOffset);
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Calculate time difference in minutes
 */
export function getMinutesDifference(date1: Date, date2: Date): number {
    return Math.abs(date2.getTime() - date1.getTime()) / 60000;
}

/**
 * Calculate coefficient of variation for timing regularity
 * Lower = more regular (suspicious), Higher = more varied (natural)
 */
export function calculateTimingCV(timings: Date[]): number {
    if (timings.length < 2) return 1;

    // Calculate delays between consecutive timings (in minutes)
    const delays: number[] = [];
    for (let i = 1; i < timings.length; i++) {
        delays.push(getMinutesDifference(timings[i - 1], timings[i]));
    }

    // Calculate mean and standard deviation
    const mean = delays.reduce((sum, d) => sum + d, 0) / delays.length;
    const variance = delays.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / delays.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation
    return mean === 0 ? 0 : stdDev / mean;
}
