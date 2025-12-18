import { PersonaTiming } from '@/core/types';

/**
 * Persona Timing Profiles
 * 
 * Realistic activity patterns for each persona including timezones,
 * active hours, peak activity times, and response delay patterns.
 */

export const PERSONA_TIMING_PROFILES: Record<string, PersonaTiming> = {
    'riley_ops': {
        timezone: 'America/New_York',           // EST
        activeHours: [
            { start: 8, end: 12 },                // Morning work hours
            { start: 13, end: 18 },               // Afternoon work hours
            { start: 21, end: 23 }                // Evening browsing
        ],
        peakActivity: [10, 14, 16, 22],         // Mid-morning, afternoon, evening
        weekendPattern: 'active',               // Active on weekends
        typicalResponseDelay: {
            min: 20,                              // 20 minutes minimum
            max: 180                              // 3 hours maximum
        }
    },

    'jordan_consults': {
        timezone: 'America/New_York',           // EST
        activeHours: [
            { start: 7, end: 9 },                 // Early morning check
            { start: 12, end: 14 },               // Lunch break
            { start: 17, end: 22 }                // Evening availability
        ],
        peakActivity: [8, 13, 19, 21],          // Early morning, lunch, evening
        weekendPattern: 'reduced',              // Less active on weekends
        typicalResponseDelay: {
            min: 45,                              // 45 minutes minimum
            max: 240                              // 4 hours maximum
        }
    },

    'emily_econ': {
        timezone: 'America/Los_Angeles',        // PST
        activeHours: [
            { start: 11, end: 15 },               // Between classes
            { start: 20, end: 26 }                // Late night (crosses midnight)
        ],
        peakActivity: [12, 21, 23, 1],          // Lunch, evening, late night
        weekendPattern: 'active',               // Very active on weekends
        typicalResponseDelay: {
            min: 15,                              // 15 minutes minimum (quick responder)
            max: 120                              // 2 hours maximum
        }
    },

    'alex_sells': {
        timezone: 'America/New_York',           // EST
        activeHours: [
            { start: 6, end: 8 },                 // Early morning
            { start: 12, end: 13 },               // Quick lunch
            { start: 17, end: 19 }                // After work
        ],
        peakActivity: [7, 12, 18],              // Morning, lunch, evening
        weekendPattern: 'offline',              // Rarely on weekends
        typicalResponseDelay: {
            min: 30,                              // 30 minutes minimum
            max: 180                              // 3 hours maximum
        }
    },

    'priya_pm': {
        timezone: 'America/Los_Angeles',        // PST
        activeHours: [
            { start: 9, end: 12 },                // Morning standup/work
            { start: 13, end: 17 },               // Afternoon work
            { start: 20, end: 22 }                // Evening check-in
        ],
        peakActivity: [10, 15, 21],             // Mid-morning, afternoon, evening
        weekendPattern: 'reduced',              // Light activity on weekends
        typicalResponseDelay: {
            min: 35,                              // 35 minutes minimum
            max: 200                              // ~3.5 hours maximum
        }
    },
    'sarah_designer': {
        timezone: 'America/New_York',           // EST
        activeHours: [
            { start: 10, end: 14 },               // Late start/lunch
            { start: 19, end: 26 },                // Late night grind
        ],
        peakActivity: [11, 23, 1],              // Late morning, late night
        weekendPattern: 'active',               // Active on weekends
        typicalResponseDelay: {
            min: 15,
            max: 120
        }
    },

    'mark_trainer': {
        timezone: 'America/Chicago',            // CST
        activeHours: [
            { start: 8, end: 17 },                // Business hours
            { start: 19, end: 21 }                // Evening check
        ],
        peakActivity: [9, 13, 20],              // Morning, post-lunch, evening
        weekendPattern: 'reduced',              // Less active
        typicalResponseDelay: {
            min: 10,                              // Very responsive
            max: 90
        }
    }
};

/**
 * Get persona timing profile
 */
export function getPersonaTiming(personaId: string): PersonaTiming {
    const timing = PERSONA_TIMING_PROFILES[personaId];

    if (!timing) {
        console.warn(`No timing profile found for ${personaId}, using defaults`);
        // Default: 9-5 worker in EST
        return {
            timezone: 'America/New_York',
            activeHours: [{ start: 9, end: 17 }],
            peakActivity: [10, 14, 16],
            weekendPattern: 'reduced',
            typicalResponseDelay: {
                min: 30,
                max: 180
            }
        };
    }

    return timing;
}

/**
 * Check if a given hour is within persona's active hours
 */
export function isActiveHour(personaId: string, hour: number): boolean {
    const timing = getPersonaTiming(personaId);

    return timing.activeHours.some(window => {
        // Handle windows that cross midnight (e.g., 20-26)
        if (window.end > 24) {
            return hour >= window.start || hour < (window.end - 24);
        }
        return hour >= window.start && hour < window.end;
    });
}

/**
 * Check if a given hour is a peak activity hour
 */
export function isPeakHour(personaId: string, hour: number): boolean {
    const timing = getPersonaTiming(personaId);
    return timing.peakActivity.includes(hour % 24);
}

/**
 * Get random response delay for persona (in minutes)
 */
export function getRandomResponseDelay(personaId: string): number {
    const timing = getPersonaTiming(personaId);
    const { min, max } = timing.typicalResponseDelay;

    // Add some variance - not purely random
    // 60% chance of being in first half of range
    const useFirstHalf = Math.random() < 0.6;
    const midpoint = (min + max) / 2;

    if (useFirstHalf) {
        return Math.floor(Math.random() * (midpoint - min) + min);
    } else {
        return Math.floor(Math.random() * (max - midpoint) + midpoint);
    }
}

/**
 * Get all available persona IDs
 */
export function getAllPersonaIds(): string[] {
    return Object.keys(PERSONA_TIMING_PROFILES);
}
