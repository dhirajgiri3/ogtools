import { Persona, SubredditContext, CompanyContext, PostTemplate, CommentTemplate, ReplyTemplate } from '@/core/types';
import { generateWithOpenAI } from '@/shared/lib/api/openai-client';
import {
    buildPostPrompt,
    buildCommentPrompt,
    buildReplyPrompt,
    wrapWithSystemPrompt
} from '../conversation/prompt-builder';

export interface GenerationContext {
    emotion: string;
    subreddit: SubredditContext;
    company: CompanyContext;
    keywords: string[];
    template?: PostTemplate | CommentTemplate | ReplyTemplate;
    postContent?: string;
    posterName?: string;
    parentCommentContent?: string;
    commentId?: string;
    isOP?: boolean;
}

export interface MultiPassResult {
    finalContent: string;
    passes: {
        pass1_raw: string;
        pass2_authentic: string;
        pass3_validated: boolean;
    };
    qualityScore: number;
    metadata: {
        temperature: number;
        attempts: number;
        duration: number;
        passedValidation: boolean;
    };
}

export interface GenerationPass {
    passNumber: 1 | 2 | 3;
    purpose: 'raw_content' | 'authenticity_layer' | 'quality_check';
    prompt: string;
    temperature: number;
    maxTokens: number;
}

/**
 * Generates content using a 3-pass refinement strategy.
 *
 * @param contentType - Type of content to generate
 * @param persona - Persona authoring the content
 * @param context - Generation context
 * @param maxAttempts - Maximum regeneration attempts
 * @returns Multi-pass result with final content and metadata
 */
export async function generateWithMultiPass(
    contentType: 'post' | 'comment' | 'reply',
    persona: Persona,
    context: GenerationContext,
    maxAttempts: number = 2
): Promise<MultiPassResult> {
    const startTime = Date.now();
    let attempts = 0;
    let bestResult: MultiPassResult | null = null;
    let bestScore = 0;

    while (attempts < maxAttempts) {
        attempts++;

        try {
            // PASS 1: Raw Emotional Content (High Temperature)
            const pass1Prompt = buildPass1Prompt(contentType, persona, context);
            const rawContent = await generateWithOpenAI(
                wrapWithSystemPrompt(pass1Prompt),
                {
                    temperature: 1.2, // High creativity
                    maxTokens: contentType === 'post' ? 200 : contentType === 'comment' ? 150 : 50,
                    frequencyPenalty: 1.5,
                    presencePenalty: 0.8
                }
            );

            if (!rawContent || rawContent.trim().length === 0) {
                console.warn(`Pass 1 returned empty content (attempt ${attempts})`);
                continue;
            }

            // PASS 2: Authenticity Enhancement (Moderate Temperature)
            const pass2Prompt = buildPass2Prompt(rawContent, persona, context, contentType);
            const authenticContent = await generateWithOpenAI(
                wrapWithSystemPrompt(pass2Prompt),
                {
                    temperature: 0.9, // Moderate
                    maxTokens: contentType === 'post' ? 200 : contentType === 'comment' ? 150 : 50,
                    frequencyPenalty: 1.2,
                    presencePenalty: 0.6
                }
            );

            if (!authenticContent || authenticContent.trim().length === 0) {
                console.warn(`Pass 2 returned empty content (attempt ${attempts})`);
                continue;
            }

            // PASS 3: Quality Validation (Low Temperature, Analytical)
            const pass3Prompt = buildPass3Prompt(authenticContent, persona, context, contentType);
            const validationResponse = await generateWithOpenAI(
                pass3Prompt,
                {
                    temperature: 0.3, // Low, analytical
                    maxTokens: 150
                }
            );

            // Parse validation result
            const validation = parseValidationResult(validationResponse);

            const result: MultiPassResult = {
                finalContent: authenticContent,
                passes: {
                    pass1_raw: rawContent,
                    pass2_authentic: authenticContent,
                    pass3_validated: validation.passed
                },
                qualityScore: validation.score,
                metadata: {
                    temperature: 0.9,
                    attempts,
                    duration: Date.now() - startTime,
                    passedValidation: validation.passed
                }
            };

            // If validation passed, return immediately
            if (validation.passed && validation.score >= 70) {
                return result;
            }

            // Track best attempt
            if (validation.score > bestScore) {
                bestScore = validation.score;
                bestResult = result;
            }

        } catch (error) {
            console.error(`Multi-pass generation error (attempt ${attempts}):`, error);
            // Continue to next attempt
        }
    }

    // If all attempts failed, return best attempt or fallback
    if (bestResult) {
        console.warn(`Multi-pass: Used best attempt (score: ${bestScore}) after ${attempts} tries`);
        return bestResult;
    }

    // Ultimate fallback
    return createFallbackResult(contentType, attempts, Date.now() - startTime);
}

function buildPass1Prompt(
    contentType: 'post' | 'comment' | 'reply',
    persona: Persona,
    context: GenerationContext
): string {
    if (contentType === 'post') {
        return buildPostPrompt(
            context.template as PostTemplate,
            persona,
            context.company,
            context.subreddit,
            context.keywords
        );
    } else if (contentType === 'comment') {
        return buildCommentPrompt(
            context.template as CommentTemplate,
            persona,
            context.company,
            context.subreddit,
            context.postContent || '',
            context.posterName || 'OP',
            context.keywords
        );
    } else {
        return buildReplyPrompt(
            context.template as ReplyTemplate,
            persona,
            context.subreddit,
            context.postContent || '',
            context.parentCommentContent || '',
            context.isOP || false
        );
    }
}

function buildPass2Prompt(
    rawContent: string,
    persona: Persona,
    context: GenerationContext,
    contentType: 'post' | 'comment' | 'reply'
): string {
    const formalityLevel = context.subreddit.formalityLevel;
    const isCasual = formalityLevel < 0.5;

    return `You just typed this on Reddit:

"${rawContent}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TASK: Make it MORE AUTHENTICALLY HUMAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're ${persona.name}. You type like a real person, not an AI.

THINK ABOUT:

1. IMPERFECTIONS (Real people don't type perfectly):
   ${isCasual ? '→ Drop ending punctuation? YES' : '→ Drop ending punctuation? MAYBE'}
   ${isCasual && persona.vocabulary.formality < 0.5 ? '→ Lowercase "i"? YES' : '→ Lowercase "i"? NO'}
   ${isCasual ? '→ Small typo? MAYBE (25% chance)' : '→ Small typo? NO'}
   → Make it feel TYPED, not WRITTEN

2. REDDIT VIBES (casual subreddit-appropriate language):
   ${isCasual ? `→ Add casual marker at end? (${context.subreddit.acceptableMarkers.slice(0, 3).join(', ')}) - 40% chance` : '→ Keep professional tone'}
   → Make it more conversational
   ${isCasual ? '→ Maybe add "..." for trailing thought?' : ''}

3. PERSONALITY (inject YOUR voice):
   → You say things like: ${persona.vocabulary.characteristic.slice(0, 3).join(', ')}
   → You NEVER say: ${persona.vocabulary.avoid.slice(0, 2).join(', ')}
   → Sound like YOU, not a generic AI

4. BREVITY (especially for ${contentType}):
   ${contentType === 'reply' ? '→ KEEP IT SHORT! Replies are 5-20 words max' : ''}
   ${contentType === 'comment' ? '→ 30-60 words is plenty' : ''}
   ${contentType === 'post' ? '→ 60-100 words, no more' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ DON'T OVER-CHANGE IT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Keep the MEANING exactly the same.
Just make it sound MORE human.
Think: adding spice, not rewriting from scratch.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OUTPUT ONLY THE REVISED TEXT (no explanation):`;
}

function buildPass3Prompt(
    content: string,
    persona: Persona,
    context: GenerationContext,
    contentType: 'post' | 'comment' | 'reply'
): string {
    return `You are a Reddit authenticity detector. Rate this ${contentType}:

"${content}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Subreddit: r/${context.subreddit.name}
• Formality: ${context.subreddit.formalityLevel} (${context.subreddit.formalityLevel > 0.6 ? 'professional' : context.subreddit.formalityLevel < 0.4 ? 'casual' : 'moderate'})
• Author: ${persona.name} (formality: ${persona.vocabulary.formality})
• Type: ${contentType}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK FOR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. AI PATTERNS (red flags):
   ✗ Numbered lists (1. 2. 3.)
   ✗ Words like: "furthermore", "certainly", "comprehensive", "moreover"
   ✗ Overly helpful tone
   ✗ Perfect grammar with no imperfections
   ✗ "Hope this helps" or "Feel free to"

2. HUMAN MARKERS (good signs):
   ✓ Lowercase "i" (in casual contexts)
   ✓ Missing punctuation
   ✓ Casual markers (lol, tbh, ngl, honestly)
   ✓ Sentence fragments
   ✓ Natural imperfections

3. PERSONA FIT:
   Does it match ${persona.name}'s voice?
   Uses their vocabulary? (${persona.vocabulary.characteristic.slice(0, 3).join(', ')})
   Avoids their anti-words? (${persona.vocabulary.avoid.slice(0, 2).join(', ')})

4. SUBREDDIT FIT:
   Matches r/${context.subreddit.name} culture?
   Appropriate formality level?

5. EMOTIONAL AUTHENTICITY:
   Does it feel genuinely ${context.emotion}?
   Natural expression of emotion?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT (be strict!):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PASS: YES/NO
SCORE: [0-100]
AI_PATTERNS: [list any detected, or "none"]
HUMAN_MARKERS: [list detected]
ISSUES: [list problems, or "none"]

Example:
PASS: YES
SCORE: 85
AI_PATTERNS: none
HUMAN_MARKERS: lowercase i, missing punctuation, casual marker "lol"
ISSUES: none`;
}

interface ValidationResult {
    passed: boolean;
    score: number;
    aiPatterns: string[];
    humanMarkers: string[];
    issues: string[];
}

/**
 * Parse validation response from Pass 3
 */
function parseValidationResult(response: string): ValidationResult {
    try {
        const lines = response.split('\n');

        let passed = false;
        let score = 50;
        const aiPatterns: string[] = [];
        const humanMarkers: string[] = [];
        const issues: string[] = [];

        lines.forEach(line => {
            const trimmed = line.trim();

            if (trimmed.startsWith('PASS:')) {
                passed = trimmed.toLowerCase().includes('yes');
            } else if (trimmed.startsWith('SCORE:')) {
                const scoreMatch = trimmed.match(/\d+/);
                if (scoreMatch) {
                    score = parseInt(scoreMatch[0]);
                }
            } else if (trimmed.startsWith('AI_PATTERNS:')) {
                const patterns = trimmed.replace('AI_PATTERNS:', '').trim();
                if (patterns.toLowerCase() !== 'none') {
                    aiPatterns.push(...patterns.split(',').map(p => p.trim()));
                }
            } else if (trimmed.startsWith('HUMAN_MARKERS:')) {
                const markers = trimmed.replace('HUMAN_MARKERS:', '').trim();
                if (markers.toLowerCase() !== 'none') {
                    humanMarkers.push(...markers.split(',').map(m => m.trim()));
                }
            } else if (trimmed.startsWith('ISSUES:')) {
                const issuesList = trimmed.replace('ISSUES:', '').trim();
                if (issuesList.toLowerCase() !== 'none') {
                    issues.push(...issuesList.split(',').map(i => i.trim()));
                }
            }
        });

        return {
            passed,
            score: Math.min(100, Math.max(0, score)),
            aiPatterns,
            humanMarkers,
            issues
        };
    } catch (error) {
        console.error('Error parsing validation result:', error);
        return {
            passed: false,
            score: 50,
            aiPatterns: [],
            humanMarkers: [],
            issues: ['Failed to parse validation']
        };
    }
}

function createFallbackResult(
    contentType: 'post' | 'comment' | 'reply',
    attempts: number,
    duration: number
): MultiPassResult {
    const fallbackContent = contentType === 'post'
        ? "been struggling with this lately. anyone else dealing with the same thing?"
        : contentType === 'comment'
            ? "yeah i feel this. been there"
            : "thanks for sharing";

    return {
        finalContent: fallbackContent,
        passes: {
            pass1_raw: fallbackContent,
            pass2_authentic: fallbackContent,
            pass3_validated: false
        },
        qualityScore: 40,
        metadata: {
            temperature: 0.9,
            attempts,
            duration,
            passedValidation: false
        }
    };
}

/**
 * Generates content using a single-pass approach for less critical content.
 * 
 * @param contentType - Type of content
 * @param persona - Author persona
 * @param context - Generation context
 * @returns Generated content string
 */
export async function generateWithSinglePass(
    contentType: 'post' | 'comment' | 'reply',
    persona: Persona,
    context: GenerationContext
): Promise<string> {
    try {
        const prompt = buildPass1Prompt(contentType, persona, context);

        const content = await generateWithOpenAI(
            wrapWithSystemPrompt(prompt),
            {
                temperature: 1.0, // Moderate
                maxTokens: contentType === 'post' ? 200 : contentType === 'comment' ? 150 : 50,
                frequencyPenalty: 1.3,
                presencePenalty: 0.7
            }
        );

        return content || createFallbackResult(contentType, 1, 0).finalContent;
    } catch (error) {
        console.error('Single-pass generation error:', error);
        return createFallbackResult(contentType, 1, 0).finalContent;
    }
}

// ============================================
// UTILITY: Get word count
// ============================================

export function getWordCount(text: string): number {
    return text.trim().split(/\s+/).length;
}

// ============================================
// UTILITY: Validate content length
// ============================================

export function validateContentLength(
    content: string,
    contentType: 'post' | 'comment' | 'reply'
): { valid: boolean; wordCount: number; expected: string } {
    const wordCount = getWordCount(content);

    const ranges = {
        post: { min: 40, max: 120 },
        comment: { min: 20, max: 80 },
        reply: { min: 3, max: 25 }
    };

    const range = ranges[contentType];

    return {
        valid: wordCount >= range.min && wordCount <= range.max,
        wordCount,
        expected: `${range.min}-${range.max} words`
    };
}
