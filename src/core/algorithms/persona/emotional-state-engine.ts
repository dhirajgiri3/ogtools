import { EnhancedPersona } from '@/core/data/personas/persona-library';

/**
 * Emotional State Engine
 *
 * Models realistic emotional progression throughout Reddit conversations.
 * Emotions evolve naturally based on:
 * - Persona's emotional profile
 * - Conversation arc type
 * - Community responses
 * - Time progression
 *
 * Makes conversations feel ALIVE - emotions change as thread develops.
 */

// TYPE DEFINITIONS

export interface EmotionalState {
    primaryEmotion: 'frustration' | 'excitement' | 'curiosity' | 'relief' | 'anxiety' | 'satisfaction' | 'empathy' | 'analytical';
    intensity: number; // 0-1 scale
    trajectory: 'escalating' | 'stable' | 'deescalating';
    triggers: string[]; // What caused this state
    duration: number; // minutes in this state
}

export interface EmotionalArc {
    startState: EmotionalState;
    progression: EmotionalState[]; // State at each comment/reply
    endState: EmotionalState;
    turningPoints: {
        position: number; // Comment index where shift happened
        trigger: string; // What caused the shift
        oldEmotion: string;
        newEmotion: string;
        intensity: number;
    }[];
}

export type ArcType = 'discovery' | 'comparison' | 'problemSolver' | 'debate' | 'selfDiscovery' | 'veteranHelpsNewbie' | 'warStory';

// EMOTIONAL ARC GENERATION

/**
 * Generate realistic emotional arc for conversation
 *
 * @param persona - Extended persona with emotional profile
 * @param arcType - Type of conversation arc
 * @param problemContext - What problem they're dealing with
 * @returns Complete emotional arc with progression
 */
export function generateEmotionalArc(
    persona: EnhancedPersona,
    arcType: ArcType,
    problemContext: string
): EmotionalArc {
    // Get arc template
    const template = getArcTemplate(arcType);

    // Adjust intensities based on persona's emotional profile
    const adjustedProgression = adjustForPersona(template.pattern, template.intensities, persona);

    // Build turning points
    const turningPoints = template.turningPoints.map((tp, idx) => ({
        position: tp.position,
        trigger: tp.trigger,
        oldEmotion: adjustedProgression[tp.position - 1]?.emotion || template.pattern[0],
        newEmotion: adjustedProgression[tp.position]?.emotion || template.pattern[tp.position],
        intensity: adjustedProgression[tp.position]?.intensity || 0.5
    }));

    return {
        startState: {
            primaryEmotion: adjustedProgression[0].emotion as any,
            intensity: adjustedProgression[0].intensity,
            trajectory: 'stable',
            triggers: [problemContext],
            duration: 0
        },
        progression: adjustedProgression.map((state, idx) => ({
            primaryEmotion: state.emotion as any,
            intensity: state.intensity,
            trajectory: determineTrajectory(adjustedProgression, idx),
            triggers: [turningPoints.find(tp => tp.position === idx)?.trigger || 'natural progression'],
            duration: estimateStateDuration(persona, state.emotion)
        })),
        endState: {
            primaryEmotion: adjustedProgression[adjustedProgression.length - 1].emotion as any,
            intensity: adjustedProgression[adjustedProgression.length - 1].intensity,
            trajectory: 'deescalating',
            triggers: [],
            duration: 0
        },
        turningPoints
    };
}

// ARC TEMPLATES

interface ArcTemplate {
    pattern: string[]; // Emotion at each stage
    intensities: number[]; // Base intensity (0-1)
    turningPoints: {
        position: number;
        trigger: string;
    }[];
}

/**
 * Get emotional pattern for arc type
 */
function getArcTemplate(arcType: ArcType): ArcTemplate {
    const templates: Record<ArcType, ArcTemplate> = {
        // Post → Comment 1 → Comment 2 → Comment 3 → Comment 4
        discovery: {
            // Frustrated → Curious → Cautiously Optimistic → Relieved
            pattern: ['frustration', 'curiosity', 'cautious_optimism', 'relief', 'satisfaction'],
            intensities: [0.7, 0.5, 0.4, 0.6, 0.7],
            turningPoints: [
                { position: 1, trigger: 'someone validated the problem' },
                { position: 2, trigger: 'learned about new approach' },
                { position: 3, trigger: 'got specific solution' },
                { position: 4, trigger: 'confirmed it works' }
            ]
        },

        problemSolver: {
            // Very Frustrated → Venting → Slightly Better → Hopeful
            pattern: ['frustration', 'frustration', 'relief', 'cautious_optimism', 'satisfaction'],
            intensities: [0.9, 0.7, 0.5, 0.6, 0.7],
            turningPoints: [
                { position: 1, trigger: 'empathy from community' },
                { position: 2, trigger: 'someone shared similar experience' },
                { position: 3, trigger: 'got actionable advice' },
                { position: 4, trigger: 'feeling hopeful about solution' }
            ]
        },

        comparison: {
            // Curious → Analytical → Informed → Decisive
            pattern: ['curiosity', 'curiosity', 'analytical', 'satisfaction', 'relief'],
            intensities: [0.6, 0.5, 0.4, 0.7, 0.6],
            turningPoints: [
                { position: 1, trigger: 'got first perspective' },
                { position: 2, trigger: 'heard different viewpoint' },
                { position: 3, trigger: 'compared options' },
                { position: 4, trigger: 'made decision' }
            ]
        },

        debate: {
            // Curious → Engaged → Thoughtful → Nuanced Understanding
            pattern: ['curiosity', 'analytical', 'analytical', 'empathy', 'satisfaction'],
            intensities: [0.5, 0.6, 0.5, 0.4, 0.5],
            turningPoints: [
                { position: 1, trigger: 'heard opinion A' },
                { position: 2, trigger: 'heard conflicting opinion B' },
                { position: 3, trigger: 'understood both sides' },
                { position: 4, trigger: 'formed nuanced view' }
            ]
        },

        selfDiscovery: {
            // Confused → Thinking → Realization → Excited
            pattern: ['anxiety', 'curiosity', 'analytical', 'excitement', 'satisfaction'],
            intensities: [0.6, 0.5, 0.4, 0.7, 0.8],
            turningPoints: [
                { position: 1, trigger: 'someone asked clarifying question' },
                { position: 2, trigger: 'started thinking through problem' },
                { position: 3, trigger: 'had realization' },
                { position: 4, trigger: 'figured it out themselves' }
            ]
        },

        veteranHelpsNewbie: {
            // Anxious → Curious → Relieved → Grateful
            pattern: ['anxiety', 'curiosity', 'relief', 'satisfaction', 'satisfaction'],
            intensities: [0.7, 0.5, 0.6, 0.7, 0.7],
            turningPoints: [
                { position: 1, trigger: 'veteran offered gentle guidance' },
                { position: 2, trigger: 'learned something new' },
                { position: 3, trigger: 'path forward is clear' },
                { position: 4, trigger: 'feeling confident' }
            ]
        },

        warStory: {
            // Frustrated → Validated → Commiserating → Slightly Better
            pattern: ['frustration', 'frustration', 'empathy', 'relief', 'satisfaction'],
            intensities: [0.8, 0.7, 0.5, 0.5, 0.6],
            turningPoints: [
                { position: 1, trigger: 'someone said "same"' },
                { position: 2, trigger: 'shared their own war story' },
                { position: 3, trigger: 'realized not alone' },
                { position: 4, trigger: 'got prevention tip' }
            ]
        }
    };

    return templates[arcType] || templates.discovery;
}

// PERSONA ADJUSTMENT

interface EmotionalStateAdjusted {
    emotion: string;
    intensity: number;
}

/**
 * Adjust arc intensities based on persona's emotional profile
 */
function adjustForPersona(
    pattern: string[],
    baseIntensities: number[],
    persona: EnhancedPersona
): EmotionalStateAdjusted[] {
    return pattern.map((emotion, idx) => {
        const baseIntensity = baseIntensities[idx];
        let adjustedIntensity = baseIntensity;

        // Adjust based on persona's emotional profile
        if (emotion === 'frustration' || emotion.includes('frustration')) {
            const personaFrustrationIntensity = persona.emotionalProfile.frustration.intensity;
            adjustedIntensity = baseIntensity * personaFrustrationIntensity;

            // Adjust recovery based on recovery time
            if (idx > 0 && pattern[idx - 1].includes('frustration')) {
                const recoveryFactor = {
                    'quick': 0.6,
                    'moderate': 0.8,
                    'slow': 1.1
                }[persona.emotionalProfile.frustration.recoveryTime];

                adjustedIntensity *= recoveryFactor;
            }
        }

        if (emotion === 'excitement' || emotion === 'satisfaction') {
            const personaExcitementIntensity = persona.emotionalProfile.excitement.intensity;
            adjustedIntensity = baseIntensity * personaExcitementIntensity;
        }

        // Cap between 0 and 1
        adjustedIntensity = Math.min(1, Math.max(0, adjustedIntensity));

        return {
            emotion,
            intensity: adjustedIntensity
        };
    });
}

// TRAJECTORY DETERMINATION

/**
 * Determine if emotion is escalating, stable, or deescalating
 */
function determineTrajectory(
    progression: EmotionalStateAdjusted[],
    currentIdx: number
): 'escalating' | 'stable' | 'deescalating' {
    if (currentIdx === 0) return 'stable';
    if (currentIdx >= progression.length - 1) return 'deescalating';

    const currentIntensity = progression[currentIdx].intensity;
    const previousIntensity = progression[currentIdx - 1].intensity;

    const diff = currentIntensity - previousIntensity;

    if (diff > 0.1) return 'escalating';
    if (diff < -0.1) return 'deescalating';
    return 'stable';
}

// DURATION ESTIMATION

/**
 * Estimate how long persona stays in this emotional state (in minutes)
 */
function estimateStateDuration(persona: EnhancedPersona, emotion: string): number {
    // Base durations
    const baseDurations: Record<string, number> = {
        frustration: 60,
        relief: 30,
        excitement: 45,
        curiosity: 40,
        analytical: 50,
        anxiety: 55,
        satisfaction: 35,
        empathy: 40,
        cautious_optimism: 45
    };

    const base = baseDurations[emotion] || 40;

    // Adjust based on persona's recovery time for frustration
    if (emotion === 'frustration') {
        const recoveryMultiplier = {
            'quick': 0.7,
            'moderate': 1.0,
            'slow': 1.4
        }[persona.emotionalProfile.frustration.recoveryTime];

        return base * recoveryMultiplier;
    }

    // Adjust based on excitement sustained interest
    if (emotion === 'excitement' || emotion === 'satisfaction') {
        const sustainedMultiplier = {
            'quick_fade': 0.6,
            'sustained': 1.0,
            'long_term': 1.3
        }[persona.emotionalProfile.excitement.sustainedInterest];

        return base * sustainedMultiplier;
    }

    return base;
}

// EMOTIONAL CONTEXT INJECTION

/**
 * Inject emotional context into prompt for more authentic generation
 *
 * @param basePrompt - Original prompt
 * @param emotionalState - Current emotional state
 * @param persona - Persona with emotional profile
 * @returns Enhanced prompt with emotional context
 */
export function injectEmotionalContext(
    basePrompt: string,
    emotionalState: EmotionalState,
    persona: EnhancedPersona
): string {
    const emotionalModifiers = getEmotionalModifiers(emotionalState, persona);

    return `${basePrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 EMOTIONAL STATE CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${emotionalModifiers.context}

This affects your typing:
${emotionalModifiers.typingGuidance}

Your emotional expression style: ${emotionalModifiers.expressionStyle}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

interface EmotionalModifiers {
    context: string;
    typingGuidance: string;
    expressionStyle: string;
}

/**
 * Get emotional modifiers for prompt
 */
function getEmotionalModifiers(
    state: EmotionalState,
    persona: EnhancedPersona
): EmotionalModifiers {
    const intensityLevel = state.intensity > 0.7 ? 'high' : state.intensity > 0.4 ? 'medium' : 'low';

    const contexts: Record<string, Record<string, string>> = {
        frustration: {
            high: "You're REALLY frustrated right now. Type quickly, don't overthink it. Let the frustration show.",
            medium: "You're annoyed and it's showing in your typing. Be direct.",
            low: "You're a bit frustrated but trying to stay constructive. Keep it measured."
        },
        relief: {
            high: "You're SO RELIEVED. This is exactly what you needed to hear. Show gratitude.",
            medium: "You're feeling better about this. Some weight lifted. Express appreciation.",
            low: "That helps a bit. Feeling slightly better. Acknowledge it."
        },
        excitement: {
            high: "You're genuinely excited about this. Show enthusiasm, but stay authentic to your personality.",
            medium: "This is interesting. You're engaged and curious. Show interest.",
            low: "Mildly intrigued. Curious to learn more. Keep it measured."
        },
        curiosity: {
            high: "You're very curious about this. Ask questions, show genuine interest.",
            medium: "You want to understand this better. Natural curiosity.",
            low: "Somewhat curious. Casually interested."
        },
        analytical: {
            high: "You're in full analysis mode. Think through pros/cons, be methodical.",
            medium: "You're being thoughtful and analytical. Consider different angles.",
            low: "Thinking this through casually. Light analysis."
        },
        anxiety: {
            high: "You're anxious and it shows. A bit unsure, seeking reassurance.",
            medium: "Feeling uncertain. Looking for guidance.",
            low: "Slightly anxious but managing it."
        },
        satisfaction: {
            high: "You're very satisfied with how this turned out. Express contentment.",
            medium: "This worked out well. You're pleased.",
            low: "It's okay, you're satisfied enough."
        },
        empathy: {
            high: "You deeply relate to this. Show strong empathy and understanding.",
            medium: "You understand what they're going through. Be supportive.",
            low: "You get it. Brief empathy."
        }
    };

    const context = contexts[state.primaryEmotion]?.[intensityLevel] || "You're engaged in this conversation.";

    // Typing guidance based on intensity and trajectory
    let typingGuidance = '';
    if (state.intensity > 0.6) {
        typingGuidance = '• Type faster, more imperfections\n• Shorter sentences\n• More emotional language';
    } else if (state.trajectory === 'escalating') {
        typingGuidance = '• Getting more emotional as you type\n• Building intensity';
    } else if (state.trajectory === 'deescalating') {
        typingGuidance = '• Calming down\n• More measured tone';
    } else {
        typingGuidance = '• Type normally\n• Stay consistent with your voice';
    }

    // Expression style based on persona
    let expressionStyle = 'Natural and authentic';
    if (state.primaryEmotion === 'frustration') {
        expressionStyle = {
            'venting': 'Vent openly, let it out',
            'analytical': 'Explain why this is frustrating logically',
            'humor': 'Use humor to cope with frustration',
            'quiet': 'Frustrated but keeping it contained'
        }[persona.emotionalProfile.frustration.expressionStyle];
    } else if (state.primaryEmotion === 'excitement') {
        expressionStyle = {
            'enthusiastic': 'Show genuine enthusiasm',
            'measured': 'Excited but keeping it measured',
            'cautious': 'Excited but cautiously optimistic',
            'evangelist': 'Very enthusiastic, almost evangelical'
        }[persona.emotionalProfile.excitement.expressionStyle];
    }

    return {
        context,
        typingGuidance,
        expressionStyle
    };
}

// EMOTIONAL STATE QUERIES

/**
 * Get emotional state at specific comment index
 */
export function getEmotionalStateAtIndex(
    arc: EmotionalArc,
    index: number
): EmotionalState {
    if (index < 0) return arc.startState;
    if (index >= arc.progression.length) return arc.endState;
    return arc.progression[index];
}

/**
 * Check if there's a turning point at this index
 */
export function getTurningPointAtIndex(
    arc: EmotionalArc,
    index: number
): typeof arc.turningPoints[0] | null {
    return arc.turningPoints.find(tp => tp.position === index) || null;
}

/**
 * Get emotion summary for debugging
 */
export function getEmotionSummary(arc: EmotionalArc): string {
    const emotions = arc.progression.map(p => `${p.primaryEmotion}(${(p.intensity * 100).toFixed(0)}%)`);
    return `${arc.startState.primaryEmotion} → ${emotions.join(' → ')} → ${arc.endState.primaryEmotion}`;
}
