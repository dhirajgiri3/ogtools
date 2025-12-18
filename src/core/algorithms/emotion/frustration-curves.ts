import { EnhancedPersona } from '@/core/data/personas/persona-library';

/**
 * Frustration Curves System
 *
 * Models realistic frustration → relief progression in Reddit conversations.
 * Frustration isn't static - it evolves as:
 * - Community validates the problem (slight decrease)
 * - Someone shares similar experience (empathy decrease)
 * - Helpful suggestion received (significant decrease)
 * - Concrete solution found (major decrease)
 *
 * Different personas recover at different speeds.
 */

// TYPE DEFINITIONS

export interface FrustrationCurve {
    timeline: FrustrationTimePoint[];
    peak: {
        time: number; // minutes
        level: number; // 0-1
        cause: string;
    };
    resolution: {
        time: number; // minutes
        level: number; // 0-1
        cause: string;
    };
    recoverySpeed: 'quick' | 'moderate' | 'slow';
}

export interface FrustrationTimePoint {
    time: number; // minutes into conversation
    frustrationLevel: number; // 0-1 scale
    triggers: string[];
    context: string; // What's happening at this point
}

// FRUSTRATION CURVE GENERATION

/**
 * Generate frustration curve for problem-solver arc
 *
 * Typical pattern:
 * - Start: High frustration (persona-dependent)
 * - T+15min: Validation brings it down slightly
 * - T+45min: Helpful suggestion brings it down significantly
 * - T+120min: Concrete solution brings it to low
 *
 * @param persona - Extended persona with emotional profile
 * @param problem - What they're frustrated about
 * @param arcType - Type of conversation (affects curve shape)
 * @returns Complete frustration curve
 */
export function generateFrustrationCurve(
    persona: EnhancedPersona,
    problem: string,
    arcType: 'discovery' | 'problemSolver' | 'warStory' = 'problemSolver'
): FrustrationCurve {
    const baseIntensity = persona.emotionalProfile.frustration.intensity;
    const recoverySpeed = persona.emotionalProfile.frustration.recoveryTime;

    // Get curve template based on arc type
    const template = getCurveTemplate(arcType);

    // Adjust timeline based on persona
    const timeline = template.timeline.map(point => ({
        time: point.time,
        frustrationLevel: adjustFrustrationLevel(
            point.frustrationLevel,
            baseIntensity,
            recoverySpeed,
            point.time
        ),
        triggers: point.triggers,
        context: point.context
    }));

    // Find peak and resolution
    const peak = timeline.reduce((max, point) =>
        point.frustrationLevel > max.frustrationLevel ? point : max
    );

    const resolution = timeline[timeline.length - 1];

    return {
        timeline,
        peak: {
            time: peak.time,
            level: peak.frustrationLevel,
            cause: peak.context
        },
        resolution: {
            time: resolution.time,
            level: resolution.frustrationLevel,
            cause: resolution.context
        },
        recoverySpeed
    };
}

// CURVE TEMPLATES

interface CurveTemplate {
    timeline: {
        time: number;
        frustrationLevel: number;
        triggers: string[];
        context: string;
    }[];
}

/**
 * Get frustration curve template for arc type
 */
function getCurveTemplate(arcType: string): CurveTemplate {
    const templates: Record<string, CurveTemplate> = {
        discovery: {
            // Frustrated → Validated → Hopeful → Relieved
            timeline: [
                {
                    time: 0,
                    frustrationLevel: 0.75, // Start frustrated
                    triggers: ['problem encountered', 'spent hours on this', 'deadline pressure'],
                    context: 'Initial post - venting frustration'
                },
                {
                    time: 15, // First empathy comment
                    frustrationLevel: 0.6, // Slight decrease from validation
                    triggers: ['someone understands', 'not alone'],
                    context: 'Someone validated the problem'
                },
                {
                    time: 45, // Helpful suggestion
                    frustrationLevel: 0.4, // Significant decrease
                    triggers: ['potential solution', 'hope'],
                    context: 'Got helpful suggestion'
                },
                {
                    time: 90, // More specific help
                    frustrationLevel: 0.25, // Getting better
                    triggers: ['concrete advice', 'actionable steps'],
                    context: 'Received specific guidance'
                },
                {
                    time: 120, // Tool mention with specific help
                    frustrationLevel: 0.15, // Low, mostly relieved
                    triggers: ['concrete next step', 'path forward'],
                    context: 'Found concrete solution'
                }
            ]
        },

        problemSolver: {
            // Very Frustrated → Venting → Still Frustrated → Better → Hopeful
            timeline: [
                {
                    time: 0,
                    frustrationLevel: 0.9, // Start VERY frustrated
                    triggers: ['problem encountered', 'this is the worst', 'so over this'],
                    context: 'Initial vent post'
                },
                {
                    time: 10, // Quick empathy
                    frustrationLevel: 0.8, // Minimal decrease
                    triggers: ['someone said same'],
                    context: 'Quick empathy comment'
                },
                {
                    time: 30, // Shared experience
                    frustrationLevel: 0.65, // Moderate decrease
                    triggers: ['not alone', 'others struggled too'],
                    context: 'Someone shared similar struggle'
                },
                {
                    time: 75, // Workflow suggestion
                    frustrationLevel: 0.45, // Significant decrease
                    triggers: ['approach that might work', 'worth trying'],
                    context: 'Got workflow suggestion'
                },
                {
                    time: 150, // Specific tool/solution
                    frustrationLevel: 0.25, // Much better
                    triggers: ['concrete solution', 'others vouched for it'],
                    context: 'Found solution with social proof'
                }
            ]
        },

        warStory: {
            // Frustrated → Commiserating → Validated → Slightly Better
            timeline: [
                {
                    time: 0,
                    frustrationLevel: 0.8, // High frustration
                    triggers: ['nightmare scenario', 'cant believe this happened'],
                    context: 'Sharing war story'
                },
                {
                    time: 12, // First commiseration
                    frustrationLevel: 0.7, // Slight decrease
                    triggers: ['someone said same'],
                    context: 'Someone commiserated'
                },
                {
                    time: 35, // Others share war stories
                    frustrationLevel: 0.55, // Moderate decrease (validated)
                    triggers: ['others had it worse', 'not alone', 'laughing about it'],
                    context: 'Others shared their war stories'
                },
                {
                    time: 80, // Prevention tips
                    frustrationLevel: 0.45, // Slightly better
                    triggers: ['how to prevent next time', 'actionable advice'],
                    context: 'Got prevention tips'
                },
                {
                    time: 120, // Dark humor acceptance
                    frustrationLevel: 0.4, // Accepting it
                    triggers: ['gallows humor', 'at least we survived'],
                    context: 'Processing through humor'
                }
            ]
        }
    };

    return templates[arcType] || templates.problemSolver;
}

// PERSONA ADJUSTMENT

/**
 * Adjust frustration level based on persona's emotional profile
 */
function adjustFrustrationLevel(
    baseFrustration: number,
    personaIntensity: number,
    recoverySpeed: 'quick' | 'moderate' | 'slow',
    timeElapsed: number
): number {
    // Adjust for persona's base frustration intensity
    let adjusted = baseFrustration * personaIntensity;

    // Adjust for recovery speed
    // As time goes on, recovery speed matters more
    const timeFactors = {
        quick: Math.pow(0.95, timeElapsed / 10), // Faster decay
        moderate: Math.pow(0.97, timeElapsed / 10), // Normal decay
        slow: Math.pow(0.99, timeElapsed / 10) // Slower decay
    };

    adjusted *= timeFactors[recoverySpeed];

    // Cap between 0 and 1
    return Math.min(1, Math.max(0, adjusted));
}

// REPLY ADJUSTMENT

/**
 * Adjust reply based on current frustration level
 *
 * @param baseReply - Original reply text
 * @param currentFrustration - Current frustration level (0-1)
 * @param persona - Persona with emotional profile
 * @returns Adjusted reply that reflects frustration level
 */
export function adjustReplyForFrustrationLevel(
    baseReply: string,
    currentFrustration: number,
    persona: EnhancedPersona
): string {
    // High frustration (>0.7): Make shorter, more emotional
    if (currentFrustration > 0.7) {
        return makeMoreFrustrated(baseReply, persona);
    }

    // Low frustration (<0.3): More grateful, relieved
    if (currentFrustration < 0.3) {
        return makeMoreRelieved(baseReply, persona);
    }

    // Medium frustration (0.3-0.7): Return as-is
    return baseReply;
}

/**
 * Make reply sound more frustrated
 */
function makeMoreFrustrated(reply: string, persona: EnhancedPersona): string {
    const frustratedMarkers = persona.dynamicVocabulary.frustrated || [
        'ugh', 'honestly', 'literally', 'i cant even', 'why', 'this is pain'
    ];

    const marker = frustratedMarkers[Math.floor(Math.random() * frustratedMarkers.length)];

    // Shorten reply - frustrated people don't elaborate
    const shortened = reply.split('.')[0]; // Just first sentence

    // Add frustrated marker
    if (Math.random() < 0.6) {
        return `${marker} ${shortened}`;
    }

    return shortened;
}

/**
 * Make reply sound more relieved
 */
function makeMoreRelieved(reply: string, persona: EnhancedPersona): string {
    const relievedMarkers = [
        'thank you', 'this helps', 'appreciate it', 'ok yeah',
        'helpful', 'thanks for this', 'good to know'
    ];

    const marker = relievedMarkers[Math.floor(Math.random() * relievedMarkers.length)];

    // Add gratitude/relief marker
    if (Math.random() < 0.7) {
        return `${marker}, ${reply}`;
    }

    return reply;
}

// FRUSTRATION CONTEXT INJECTION

/**
 * Inject frustration context into prompt
 *
 * Helps AI understand where persona is emotionally at this point
 */
export function injectFrustrationContext(
    basePrompt: string,
    frustrationLevel: number,
    frustrationTrend: 'increasing' | 'stable' | 'decreasing'
): string {
    const frustrationContext = getFrustrationContext(frustrationLevel, frustrationTrend);

    return `${basePrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
😤 FRUSTRATION LEVEL CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${frustrationContext.description}

How this affects your reply:
${frustrationContext.replyGuidance}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

interface FrustrationContext {
    description: string;
    replyGuidance: string;
}

/**
 * Get frustration context description
 */
function getFrustrationContext(
    level: number,
    trend: 'increasing' | 'stable' | 'decreasing'
): FrustrationContext {
    const contexts: Record<string, FrustrationContext> = {
        // High frustration (0.7+)
        high_increasing: {
            description: 'You\'re VERY frustrated and it\'s getting worse. Type quickly, emotionally.',
            replyGuidance: '• Keep it SHORT (1 sentence)\n• Use frustrated vocabulary\n• Don\'t overthink it'
        },
        high_stable: {
            description: 'You\'re very frustrated. Still annoyed but not escalating.',
            replyGuidance: '• Brief and emotional\n• Show frustration clearly\n• Maybe one frustrated marker (ugh, honestly)'
        },
        high_decreasing: {
            description: 'You were very frustrated, but this is helping a bit. Still annoyed though.',
            replyGuidance: '• Starting to feel a bit better\n• Cautiously optimistic\n• Acknowledge the help'
        },

        // Medium frustration (0.3-0.7)
        medium_increasing: {
            description: 'You\'re moderately frustrated and it\'s building.',
            replyGuidance: '• Show increasing frustration\n• Getting more emotional'
        },
        medium_stable: {
            description: 'You\'re moderately frustrated. Consistent annoyance.',
            replyGuidance: '• Normal reply with mild frustration showing\n• Natural tone'
        },
        medium_decreasing: {
            description: 'You were frustrated but feeling better now. Calming down.',
            replyGuidance: '• Tone is improving\n• More hopeful\n• Appreciate the help'
        },

        // Low frustration (0-0.3)
        low_increasing: {
            description: 'You were feeling better, but something is annoying you again.',
            replyGuidance: '• Mild frustration showing\n• Still mostly positive'
        },
        low_stable: {
            description: 'You\'re feeling much better. Minimal frustration.',
            replyGuidance: '• Positive tone\n• Grateful\n• Relieved'
        },
        low_decreasing: {
            description: 'You\'re feeling great now. Problem is solved or path forward is clear.',
            replyGuidance: '• Very positive\n• Thankful\n• Express relief and satisfaction'
        }
    };

    // Determine level category
    const levelCategory = level > 0.7 ? 'high' : level > 0.3 ? 'medium' : 'low';
    const key = `${levelCategory}_${trend}`;

    return contexts[key] || contexts.medium_stable;
}

// UTILITY FUNCTIONS

/**
 * Get frustration level at specific time
 */
export function getFrustrationAtTime(
    curve: FrustrationCurve,
    timeMinutes: number
): number {
    // Find closest timeline point
    let closest = curve.timeline[0];
    let minDiff = Math.abs(timeMinutes - closest.time);

    for (const point of curve.timeline) {
        const diff = Math.abs(timeMinutes - point.time);
        if (diff < minDiff) {
            minDiff = diff;
            closest = point;
        }
    }

    return closest.frustrationLevel;
}

/**
 * Get frustration trend at specific time
 */
export function getFrustrationTrend(
    curve: FrustrationCurve,
    timeMinutes: number
): 'increasing' | 'stable' | 'decreasing' {
    // Find current and previous points
    const currentIdx = curve.timeline.findIndex(p => p.time >= timeMinutes);
    if (currentIdx <= 0) return 'stable';

    const current = curve.timeline[currentIdx];
    const previous = curve.timeline[currentIdx - 1];

    const diff = current.frustrationLevel - previous.frustrationLevel;

    if (diff > 0.05) return 'increasing';
    if (diff < -0.05) return 'decreasing';
    return 'stable';
}

/**
 * Get frustration summary for debugging
 */
export function getFrustrationSummary(curve: FrustrationCurve): string {
    const levels = curve.timeline.map(p => `T${p.time}min: ${(p.frustrationLevel * 100).toFixed(0)}%`);
    return `Peak: ${(curve.peak.level * 100).toFixed(0)}% → Resolution: ${(curve.resolution.level * 100).toFixed(0)}%\n${levels.join(' → ')}`;
}

/**
 * Check if frustration is in "danger zone" (too high for too long)
 */
export function isInDangerZone(curve: FrustrationCurve, currentTime: number): boolean {
    const currentLevel = getFrustrationAtTime(curve, currentTime);

    // Danger if frustration > 0.8 after 60 minutes
    // (Should be deescalating by then in a good conversation)
    return currentLevel > 0.8 && currentTime > 60;
}
