import { EnhancedPersona } from '@/core/data/personas/persona-library';
import { EmotionalState } from '../persona/emotional-state-engine';

/**
 * Humor Timing Engine
 *
 * Models when and how personas use humor. Not everyone uses humor, and those
 * who do have different styles and timing.
 *
 * Humor Types:
 * - Self-deprecating: "lol i'm probably the wrong person to ask"
 * - Dark: "at least we're all suffering together"
 * - Wholesome: "we love to see it!"
 * - Dry: "the irony is not lost on me"
 * - Sarcastic: "oh great, another solution that won't work"
 *
 * Timing Matters:
 * - Good timing: Humor during relief/resolution
 * - Bad timing: Humor during high frustration (inappropriate)
 * - Perfect timing: Humor at just the right emotional moment
 */

// TYPE DEFINITIONS

export interface HumorOpportunity {
    commentIndex: number; // Which comment index
    type: 'self-deprecating' | 'dark' | 'wholesome' | 'dry' | 'sarcastic';
    appropriateness: number; // 0-1 (some personas have bad timing!)
    setup: string; // What situation/context
    payoff?: string; // Optional punchline
    fits_persona: boolean; // Whether this fits persona's style
}

export interface HumorContext {
    emotionalState: EmotionalState;
    subredditFormality: number;
    conversationPhase: 'initiation' | 'development' | 'resolution';
    recentHumor: boolean; // Was there humor recently?
}

// HUMOR OPPORTUNITY IDENTIFICATION

/**
 * Identify when humor would be natural in thread
 *
 * @param emotionalArc - Emotional progression of conversation
 * @param persona - Persona with humor style
 * @param subredditFormality - How formal the subreddit is (0-1)
 * @returns Array of humor opportunities
 */
export function identifyHumorOpportunities(
    emotionalArc: EmotionalState[],
    persona: EnhancedPersona,
    subredditFormality: number
): HumorOpportunity[] {
    if (!persona.humorStyle.usesHumor) {
        return []; // This persona doesn't use humor
    }

    // Too formal for humor
    if (subredditFormality > 0.7 && persona.humorStyle.type !== 'dry') {
        return [];
    }

    const opportunities: HumorOpportunity[] = [];

    emotionalArc.forEach((state, index) => {
        const phase = getConversationPhase(index, emotionalArc.length);
        const recentHumor = hasRecentHumor(opportunities, index);

        // Identify opportunities based on emotional state
        const opportunity = identifyOpportunityAtState(
            state,
            index,
            persona,
            phase,
            recentHumor,
            subredditFormality
        );

        if (opportunity) {
            opportunities.push(opportunity);
        }
    });

    // Filter by frequency setting
    return filterByFrequency(opportunities, persona.humorStyle.frequency);
}

/**
 * Identify humor opportunity at specific emotional state
 */
function identifyOpportunityAtState(
    state: EmotionalState,
    index: number,
    persona: EnhancedPersona,
    phase: 'initiation' | 'development' | 'resolution',
    recentHumor: boolean,
    subredditFormality: number
): HumorOpportunity | null {
    // Don't overdo humor - skip if recent
    if (recentHumor) return null;

    const humorType = persona.humorStyle.type;
    const timing = persona.humorStyle.timing;

    // Self-deprecating humor: When admitting struggle or being vulnerable
    if (humorType === 'self-deprecating' && (state.primaryEmotion === 'frustration' || state.primaryEmotion === 'empathy')) {
        return {
            commentIndex: index,
            type: 'self-deprecating',
            appropriateness: calculateAppropriateness(timing, state, phase, subredditFormality),
            setup: 'relatable struggle moment',
            fits_persona: true
        };
    }

    // Dark humor: When frustration is high (commiserating)
    if (humorType === 'dark' && state.primaryEmotion === 'frustration' && state.intensity > 0.6) {
        return {
            commentIndex: index,
            type: 'dark',
            appropriateness: calculateAppropriateness(timing, state, phase, subredditFormality),
            setup: 'commiserating about problem',
            fits_persona: true
        };
    }

    // Wholesome humor: When resolving, feeling better
    if (humorType === 'wholesome' && state.trajectory === 'deescalating' && (state.primaryEmotion === 'relief' || state.primaryEmotion === 'satisfaction')) {
        return {
            commentIndex: index,
            type: 'wholesome',
            appropriateness: calculateAppropriateness(timing, state, phase, subredditFormality),
            setup: 'celebrating progress',
            fits_persona: true
        };
    }

    // Dry humor: Analytical moments, ironic situations
    if (humorType === 'dry' && state.primaryEmotion === 'analytical') {
        return {
            commentIndex: index,
            type: 'dry',
            appropriateness: calculateAppropriateness(timing, state, phase, subredditFormality),
            setup: 'ironic observation',
            fits_persona: true
        };
    }

    // Sarcastic humor: Frustration with specific thing
    if (humorType === 'sarcastic' && state.primaryEmotion === 'frustration' && state.intensity > 0.5) {
        return {
            commentIndex: index,
            type: 'sarcastic',
            appropriateness: calculateAppropriateness(timing, state, phase, subredditFormality),
            setup: 'frustrated about specific thing',
            fits_persona: true
        };
    }

    return null;
}

// APPROPRIATENESS CALCULATION

/**
 * Calculate how appropriate humor is at this moment
 *
 * Perfect timing: 0.9+
 * Good timing: 0.7-0.9
 * Bad timing: <0.7
 */
function calculateAppropriateness(
    personaTiming: 'inappropriate' | 'good' | 'perfect',
    state: EmotionalState,
    phase: 'initiation' | 'development' | 'resolution',
    subredditFormality: number
): number {
    let score = 0.5; // Base

    // Persona timing modifier
    const timingModifiers = {
        'perfect': 1.0,
        'good': 0.8,
        'inappropriate': 0.6
    };
    score *= timingModifiers[personaTiming];

    // Emotional state modifier
    // Humor works better when deescalating or at moderate intensity
    if (state.trajectory === 'deescalating') {
        score += 0.2;
    } else if (state.trajectory === 'escalating') {
        score -= 0.1; // Harder to land humor when escalating
    }

    // High intensity emotions make humor riskier
    if (state.intensity > 0.8) {
        score -= 0.2;
    }

    // Phase modifier - resolution is best time for humor
    if (phase === 'resolution') {
        score += 0.2;
    } else if (phase === 'initiation') {
        score -= 0.1; // Too early
    }

    // Subreddit formality modifier
    if (subredditFormality > 0.6) {
        score -= 0.2; // Formal subs, humor is riskier
    } else if (subredditFormality < 0.4) {
        score += 0.1; // Casual subs, humor is welcome
    }

    return Math.min(1, Math.max(0, score));
}

// HUMOR GENERATION

/**
 * Inject humor into content
 *
 * @param baseContent - Original content
 * @param opportunity - Humor opportunity
 * @param persona - Persona using humor
 * @returns Content with humor injected
 */
export function injectHumor(
    baseContent: string,
    opportunity: HumorOpportunity,
    persona: EnhancedPersona
): string {
    const humorLine = generateHumorLine(opportunity.type, persona);

    // Inject based on appropriateness
    if (opportunity.appropriateness > 0.7) {
        // Good/perfect timing - humor enhances
        return `${baseContent} ${humorLine}`;
    } else if (opportunity.appropriateness > 0.5) {
        // Okay timing - add humor but make it optional/casual
        return `${baseContent} ${humorLine}`;
    } else {
        // Bad timing - acknowledge it's awkward (meta-humor)
        return `${baseContent} ${humorLine} (sorry, bad timing?)`;
    }
}

/**
 * Generate humor line based on type
 */
function generateHumorLine(
    type: HumorOpportunity['type'],
    persona: EnhancedPersona
): string {
    const templates: Record<HumorOpportunity['type'], string[]> = {
        'self-deprecating': [
            "lol i'm probably the wrong person to ask",
            "not me being an expert at making this mistake",
            "i've perfected the art of doing this wrong",
            "my track record here is... not great",
            "calling myself out rn",
            "why am i like this lol"
        ],

        'dark': [
            "at least we're all suffering together",
            "misery loves company i guess",
            "laughing through the pain rn",
            "this is fine [dog in fire meme energy]",
            "we're all just out here struggling huh",
            "welcome to the club of people who can't figure this out"
        ],

        'wholesome': [
            "we love to see it!",
            "character development!",
            "look at us, problem-solving and stuff",
            "this is why i love this community",
            "proud of us tbh",
            "we did it reddit!"
        ],

        'dry': [
            "the irony is not lost on me",
            "this reads like a sitcom script",
            "couldn't make this up if i tried",
            "fascinating how predictable this is",
            "ah yes, the classic problem",
            "tale as old as time"
        ],

        'sarcastic': [
            "oh great, another thing that doesn't work",
            "because that's exactly what we needed",
            "perfect, just perfect",
            "couldn't possibly go wrong",
            "what could go wrong, right?",
            "sounds foolproof"
        ]
    };

    const options = templates[type] || templates['self-deprecating'];
    return options[Math.floor(Math.random() * options.length)];
}

/**
 * Add humor context to prompt
 */
export function injectHumorContext(
    basePrompt: string,
    opportunity: HumorOpportunity,
    persona: EnhancedPersona
): string {
    const contextDescription = getHumorContextDescription(opportunity, persona);

    return `${basePrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
😄 HUMOR OPPORTUNITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${contextDescription}

This is natural for you - you use ${opportunity.type} humor.

${opportunity.appropriateness < 0.6 ? '⚠️  Your timing is usually a bit off, so the humor might land awkwardly (that\'s ok - it\'s authentic to you)' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

/**
 * Get humor context description
 */
function getHumorContextDescription(
    opportunity: HumorOpportunity,
    persona: EnhancedPersona
): string {
    const typeDescriptions: Record<HumorOpportunity['type'], string> = {
        'self-deprecating': 'Make a self-deprecating joke about your own struggles with this.',
        'dark': 'Use dark/gallows humor to cope with the frustration.',
        'wholesome': 'Add a wholesome, supportive joke celebrating progress.',
        'dry': 'Make a dry, ironic observation about the situation.',
        'sarcastic': 'Use sarcasm to express frustration with the situation.'
    };

    return `You could add ${opportunity.type} humor here:
• What: ${typeDescriptions[opportunity.type]}
• Setup: ${opportunity.setup}
• Appropriateness: ${(opportunity.appropriateness * 100).toFixed(0)}% (${opportunity.appropriateness > 0.7 ? 'good timing' : opportunity.appropriateness > 0.5 ? 'okay timing' : 'bad timing but you do it anyway'})

Examples of ${opportunity.type} humor:
${generateHumorLine(opportunity.type, persona)}`;
}

// UTILITY FUNCTIONS

/**
 * Get conversation phase
 */
function getConversationPhase(
    index: number,
    totalComments: number
): 'initiation' | 'development' | 'resolution' {
    const progress = index / totalComments;

    if (progress < 0.3) return 'initiation';
    if (progress < 0.7) return 'development';
    return 'resolution';
}

/**
 * Check if there was humor recently
 */
function hasRecentHumor(
    opportunities: HumorOpportunity[],
    currentIndex: number
): boolean {
    // Check if any humor in last 2 comments
    return opportunities.some(opp =>
        opp.commentIndex >= currentIndex - 2 &&
        opp.commentIndex < currentIndex
    );
}

/**
 * Filter opportunities by frequency setting
 */
function filterByFrequency(
    opportunities: HumorOpportunity[],
    frequency: 'rare' | 'occasional' | 'frequent'
): HumorOpportunity[] {
    const maxOpportunities = {
        'rare': 1,
        'occasional': 2,
        'frequent': 4
    }[frequency];

    // Return top N most appropriate opportunities
    return opportunities
        .sort((a, b) => b.appropriateness - a.appropriateness)
        .slice(0, maxOpportunities);
}

/**
 * Check if humor is appropriate for subreddit
 */
export function isHumorAppropriate(
    humorType: HumorOpportunity['type'],
    subredditFormality: number
): boolean {
    // Dry humor works everywhere
    if (humorType === 'dry') return true;

    // Wholesome humor works in most places
    if (humorType === 'wholesome' && subredditFormality < 0.8) return true;

    // Self-deprecating works in casual/moderate
    if (humorType === 'self-deprecating' && subredditFormality < 0.6) return true;

    // Dark/sarcastic only in casual
    if ((humorType === 'dark' || humorType === 'sarcastic') && subredditFormality < 0.4) return true;

    return false;
}

/**
 * Get humor summary for debugging
 */
export function getHumorSummary(opportunities: HumorOpportunity[]): string {
    if (opportunities.length === 0) return 'No humor opportunities';

    return opportunities.map((opp, i) =>
        `Humor ${i + 1}: ${opp.type} at comment ${opp.commentIndex} (${(opp.appropriateness * 100).toFixed(0)}% appropriate)`
    ).join('\n');
}

/**
 * Adjust humor for persona confidence
 */
export function adjustHumorForConfidence(
    baseAppropriateness: number,
    persona: EnhancedPersona
): number {
    // Personas with bad timing get lower appropriateness
    if (persona.humorStyle.timing === 'inappropriate') {
        return baseAppropriateness * 0.7;
    }

    // Personas with perfect timing get bonus
    if (persona.humorStyle.timing === 'perfect') {
        return Math.min(1, baseAppropriateness * 1.15);
    }

    return baseAppropriateness;
}
