import { Persona, SubredditContext } from '@/core/types';
import { getSubredditProfile } from '@/core/data/subreddits/profiles';

/**
 * Authenticity Engine
 * 
 * Transforms generated text into natural, human-like Reddit conversations using multiple transformation layers:
 * Subreddit Calibration, Human Imperfections, Personality Markers, Reddit Culture, and Structure Breaking.
 */

const CASUAL_MARKERS = ['mic', 'lmao', 'ngl', 'tbh', 'fr'];

const TYPO_MAP: Record<string, string> = {
    ' the ': ' teh ',
    ' and ': ' adn ',
    ' have ': ' ahve ',
    ' with ': ' wiht ',
    ' that ': ' taht ',
    ' what ': ' waht ',
    ' really ': ' realy ',
    ' totally ': ' totaly '
};

const CONTRACTION_MAP: Record<string, string> = {
    "don't": "dont",
    "can't": "cant",
    "won't": "wont",
    "doesn't": "doesnt",
    "isn't": "isnt"
};

const INTERJECTION_MARKERS = ['honestly', 'tbh', 'ngl', 'fr'];
const QUALIFIERS = ['kinda', 'pretty', 'sort of', 'basically'];
const ADJECTIVES = ['good', 'great', 'solid', 'nice', 'useful', 'helpful'];
const EMPHASIS_WORDS = ['never', 'so', 'really', 'way', 'super'];




/**
 * Calibrate content for subreddit formality and culture
 */
function calibrateForSubreddit(
    content: string,
    subreddit: SubredditContext
): string {
    let result = content;

    // For technical/professional subs (formality > 0.6)
    if (subreddit.formalityLevel > 0.6) {
        // Remove casual markers
        // Remove casual markers
        CASUAL_MARKERS.forEach(marker => {
            const regex = new RegExp(`\\b${marker}\\b`, 'gi');
            result = result.replace(regex, '');
        });

        // Clean up double spaces from removals
        result = result.replace(/\s+/g, ' ').trim();
    }

    // For casual subs (formality < 0.4)
    // Keep casual markers - they're appropriate

    return result;
}



/**
 * Add realistic human imperfections
 * AGGRESSIVE MODE: More natural mistakes for 90+ authenticity
 */
function addHumanImperfections(
    content: string,
    subreddit: SubredditContext
): string {
    let result = content;

    // Much higher imperfection rates for authenticity
    const imperfectionRate = subreddit.formalityLevel > 0.6 ? 0.3 : 0.8;

    // 1. Lowercase "i" (60% chance in casual subs)
    if (Math.random() < imperfectionRate * 0.75 && subreddit.formalityLevel < 0.7) {
        result = result.replace(/\bI\b/g, (match) => {
            return Math.random() < 0.6 ? 'i' : match;
        });
        result = result.replace(/\bI'm\b/g, (match) => {
            return Math.random() < 0.5 ? 'im' : match;
        });
    }

    // 2. Missing punctuation at end (50% chance)
    if (Math.random() < imperfectionRate * 0.65 && result.match(/[.!?]$/)) {
        result = result.slice(0, -1);
    }

    // 3. Lowercase sentence start (40% chance)
    if (Math.random() < imperfectionRate * 0.5 && subreddit.formalityLevel < 0.7) {
        const firstChar = result.charAt(0);
        if (firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) {
            result = firstChar.toLowerCase() + result.slice(1);
        }
    }

    // 4. More diverse typos (25% chance)
    if (Math.random() < imperfectionRate * 0.35) {
        const typoKeys = Object.keys(TYPO_MAP);
        const randomTypo = typoKeys[Math.floor(Math.random() * typoKeys.length)];

        if (result.includes(randomTypo)) {
            result = result.replace(randomTypo, TYPO_MAP[randomTypo]);
        }
    }

    // 5. Missing apostrophes (30% chance in casual)
    if (Math.random() < imperfectionRate * 0.4 && subreddit.formalityLevel < 0.6) {
        Object.entries(CONTRACTION_MAP).forEach(([correct, incorrect]) => {
            if (Math.random() < 0.3) {
                result = result.replace(new RegExp(correct, 'g'), incorrect);
            }
        });
    }

    // 6. Double spaces or missing spaces (15% chance)
    if (Math.random() < imperfectionRate * 0.2) {
        // Randomly add or remove space
        const sentences = result.split('. ');
        if (sentences.length > 1 && Math.random() < 0.5) {
            result = sentences.join('.  '); // Double space
        }
    }

    // 7. Remove accidental repeated words
    result = result.replace(/\b(\w+)\s+\1\b/gi, '$1');

    return result;
}



/**
 * Inject persona-specific vocabulary and phrases
 */
function injectPersonalityMarkers(
    content: string,
    persona: Persona,
    subreddit: SubredditContext
): string {
    let result = content;

    // Only inject in appropriate formality contexts
    if (subreddit.formalityLevel > 0.7) {
        return result; // Too formal for personality injection
    }

    const { characteristic } = persona.vocabulary;

    // 1. Interjection at start (40% chance - increased for more personality)
    if (Math.random() < 0.4 && result.length > 0) {
        const interjections = characteristic.filter(word =>
            INTERJECTION_MARKERS.includes(word.toLowerCase())
        );

        if (interjections.length > 0) {
            const interjection = interjections[Math.floor(Math.random() * interjections.length)];
            result = `${interjection}, ${result.charAt(0).toLowerCase()}${result.slice(1)}`;
        }
    }

    // 2. Mid-sentence qualifiers (30% chance)
    if (Math.random() < 0.3) {
        const qualifier = QUALIFIERS[Math.floor(Math.random() * QUALIFIERS.length)];

        // Add before adjectives
        ADJECTIVES.forEach(adj => {
            const regex = new RegExp(`\\b${adj}\\b`, 'i');
            if (regex.test(result) && Math.random() < 0.5) {
                result = result.replace(regex, `${qualifier} ${adj}`);
            }
        });
    }

    return result;
}



/**
 * Add Reddit-specific language patterns
 * Only for casual/moderate subs
 */
function addRedditCulture(
    content: string,
    subreddit: SubredditContext
): string {
    let result = content;

    // Only apply in casual/moderate subs
    if (subreddit.formalityLevel > 0.6) {
        return result;
    }

    // 1. Casual interjections (50% chance - increased for casual subs)
    if (Math.random() < 0.5) {
        const redditMarkers = subreddit.acceptableMarkers.filter(m =>
            ['lol', 'lmao', 'tbh', 'ngl', 'fr'].includes(m.toLowerCase())
        );

        if (redditMarkers.length > 0) {
            const marker = redditMarkers[Math.floor(Math.random() * redditMarkers.length)];

            // Add at end
            if (!result.endsWith(marker) && Math.random() < 0.7) {
                result = `${result} ${marker}`;
            }
        }
    }

    // 2. Emphasis with caps (15% chance)
    if (Math.random() < 0.15) {
        EMPHASIS_WORDS.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            if (regex.test(result) && Math.random() < 0.4) {
                result = result.replace(regex, word.toUpperCase());
            }
        });
    }

    // 3. Trailing thoughts (15% chance)
    if (Math.random() < 0.15 && result.endsWith('.')) {
        result = result.slice(0, -1) + '...';
    }

    return result;
}



/**
 * Break perfect AI structure patterns
 * Different transformations based on content type for maximum authenticity
 */
function breakPerfectStructure(
    content: string,
    contentType: 'post' | 'comment' | 'reply'
): string {
    let result = content;

    // 1. Convert numbered lists to more natural format
    // AI loves numbered lists - humans use them less
    result = result.replace(/^\d+\.\s+/gm, '- ');
    result = result.replace(/\n-\s+/g, '\n\n');

    // 2. Content-type specific transformations
    if (contentType === 'post') {
        // Posts: Break long paragraphs (if > 200 chars) for readability
        if (result.length > 200 && !result.includes('\n\n')) {
            const midpoint = result.length / 2;
            const nearestPeriod = result.indexOf('.', midpoint);

            if (nearestPeriod > 0 && nearestPeriod < result.length - 20) {
                result = result.slice(0, nearestPeriod + 1) + '\n\n' + result.slice(nearestPeriod + 2);
            }
        }
    } else if (contentType === 'reply') {
        // Replies: Keep them super short and punchy - cut if too long
        if (result.length > 80) {
            const sentences = result.split('. ');
            if (sentences.length > 1) {
                result = sentences[0]; // Just keep first sentence for brevity
            }
        }
    }
    // Comments: No special length handling - let them flow naturally

    // 3. Merge very short sentences to create natural flow (all types)
    result = result.replace(/\.\s+([A-Z][a-z]{2,6})\s+/g, (match, word) => {
        // Merge coordinating conjunctions
        if (['Then', 'And', 'But', 'Also'].includes(word)) {
            return `, ${word.toLowerCase()} `;
        }
        return match;
    });

    return result;
}



/**
 * Apply all authenticity transformations
 * 
 * @param content - Original AI-generated content
 * @param persona - Persona who wrote this
 * @param subreddit - Target subreddit
 * @param contentType - Type of content (post/comment/reply)
 * @returns Transformed, authentic-sounding content
 */
export async function injectAuthenticity(
    content: string,
    persona: Persona,
    subreddit: string,
    contentType: 'post' | 'comment' | 'reply'
): Promise<string> {
    const subredditProfile = getSubredditProfile(subreddit);

    let result = content;

    // Apply transformations in order
    // Each layer builds on the previous
    result = calibrateForSubreddit(result, subredditProfile);
    result = injectPersonalityMarkers(result, persona, subredditProfile);
    result = addRedditCulture(result, subredditProfile);
    result = addHumanImperfections(result, subredditProfile);
    result = breakPerfectStructure(result, contentType);

    // Final cleanup
    result = result.replace(/\s+/g, ' ').trim();
    result = result.replace(/\s+([.,!?])/g, '$1'); // Remove spaces before punctuation

    return result;
}


