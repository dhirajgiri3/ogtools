import { generateWithOpenAI } from '@/shared/lib/api/openai-client';
import { EnhancedPersona } from '@/core/data/personas/persona-library';
import { SubredditContext } from '@/core/types';

// TYPE DEFINITIONS

export interface ValidationResult {
    passed: boolean;
    overallScore: number; // 0-100
    dimensions: {
        aiPatternScore: number; // 0-100 (higher = fewer AI patterns)
        humanMarkerScore: number; // 0-100 (higher = more human markers)
        emotionalAuthenticityScore: number; // 0-100
        personaFitScore: number; // 0-100
        subredditFitScore: number; // 0-100
        threadCoherenceScore?: number; // 0-100 (only for threads)
    };
    issues: ValidationIssue[];
    strengths: string[];
    feedback: string;
    confidence: number; // 0-1 (validator's confidence in assessment)
}

export interface ValidationIssue {
    type: 'ai_pattern' | 'persona_mismatch' | 'subreddit_mismatch' | 'emotional_inconsistency' | 'coherence_issue';
    severity: 'critical' | 'moderate' | 'minor';
    description: string;
    location?: string; // Which part of content
    suggestion?: string; // How to fix
}

export interface ValidationContext {
    contentType: 'post' | 'comment' | 'reply' | 'thread';
    persona: EnhancedPersona;
    subreddit: SubredditContext;
    expectedEmotion?: string;
    conversationContext?: string; // For replies/comments
}

// MAIN VALIDATION FUNCTION

/**
 * Validate single piece of content using AI
 *
 * @param content - Content to validate
 * @param context - Validation context
 * @returns Detailed validation result
 */
export async function validateContentWithAI(
    content: string,
    context: ValidationContext
): Promise<ValidationResult> {
    const prompt = buildValidationPrompt(content, context);

    // Note: Using existing generateWithOpenAI which has fixed params
    // For validation, we'd ideally use lower temperature (0.3) but using existing function
    const response = await generateWithOpenAI(prompt);

    return parseValidationResponse(response);
}

/**
 * Validate entire thread (post + comments + replies)
 *
 * @param thread - Array of content pieces in order
 * @param context - Validation context
 * @returns Thread-level validation result
 */
export async function validateThreadWithAI(
    thread: string[],
    context: ValidationContext
): Promise<ValidationResult> {
    const threadContent = thread.map((content, i) =>
        `[Message ${i + 1}]\n${content}`
    ).join('\n\n---\n\n');

    const prompt = buildThreadValidationPrompt(threadContent, context);

    // Note: Using existing generateWithOpenAI which has fixed params
    const response = await generateWithOpenAI(prompt);

    return parseValidationResponse(response);
}

// PROMPT BUILDING

/**
 * Build validation prompt for single content
 */
function buildValidationPrompt(
    content: string,
    context: ValidationContext
): string {
    const { persona, subreddit, expectedEmotion, contentType } = context;

    return `You are an expert Reddit authenticity validator. Your job is to analyze content and determine if it feels authentically human or AI-generated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT TO VALIDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPECTED CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Content Type: ${contentType}
Subreddit: r/${subreddit.name} (${subreddit.formalityLevel > 0.7 ? 'Professional/Formal' : subreddit.formalityLevel > 0.4 ? 'Moderate' : 'Very Casual'})
Expected Emotion: ${expectedEmotion || 'Not specified'}

Persona Profile:
• Communication Style: ${persona.vocabulary.formality > 0.7 ? 'Professional' : persona.vocabulary.formality > 0.4 ? 'Moderate' : 'Very Casual'}
• Typical Vocabulary: ${persona.dynamicVocabulary?.casualContext?.slice(0, 5).join(', ') || 'standard vocabulary'}
• Humor Style: ${persona.humorStyle?.type || 'none'} (${persona.humorStyle?.frequency || 'rare'})
• Vulnerability: ${persona.emotionalProfile?.vulnerability.willingnessToAdmit > 0.7 ? 'High' : persona.emotionalProfile?.vulnerability.willingnessToAdmit > 0.4 ? 'Moderate' : 'Low'} willingness to admit struggles

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDATION CRITERIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyze this content across 5 dimensions:

1. AI PATTERN DETECTION (Score 0-100, higher = fewer AI patterns)
   ❌ AI Patterns to Flag:
   • Formal transitions: "Furthermore", "Additionally", "Moreover", "However"
   • Corporate speak: "comprehensive", "leverage", "utilize", "facilitate"
   • Perfect grammar and punctuation (no real human types perfectly)
   • Overly helpful/positive tone ("I'd be happy to help!")
   • Numbered/bulleted lists in casual contexts
   • Structured paragraphs with clear topic sentences
   • Emoji overuse or perfectly placed emojis
   • Generic platitudes: "Hope this helps!", "Best of luck!"

2. HUMAN MARKER PRESENCE (Score 0-100, higher = more human markers)
   ✅ Human Markers to Look For:
   • lowercase "i" (real people often don't capitalize)
   • Missing punctuation at end of sentences
   • Casual markers: "lol", "tbh", "ngl", "rn", "fr"
   • Typos and natural mistakes
   • Run-on sentences or fragments
   • Stream-of-consciousness feel
   • Conversational asides (parenthetical thoughts)
   • Context-specific slang

3. EMOTIONAL AUTHENTICITY (Score 0-100)
   Evaluate if emotion feels GENUINE:
   • Does frustration feel real or performed?
   • Is excitement genuine or forced?
   • Does vulnerability feel authentic?
   • Are emotional expressions appropriate for context?
   • Does emotion match the situation described?

4. PERSONA FIT (Score 0-100)
   Does this match the persona's profile?
   • Formality level matches persona
   • Vocabulary matches persona's typical words
   • Humor style (if present) matches persona
   • Vulnerability level matches persona's willingness
   • Overall voice sounds like THIS person

5. SUBREDDIT FIT (Score 0-100)
   Does this match subreddit culture?
   • Formality matches subreddit (r/${subreddit.name})
   • Tone appropriate for community
   • Length appropriate (casual = shorter, professional = moderate)
   • Cultural norms respected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide your analysis in this EXACT format:

OVERALL_SCORE: [0-100]
PASSED: [YES/NO] (YES if score >= 70)
CONFIDENCE: [0-100] (how confident are you in this assessment)

DIMENSION_SCORES:
AI_PATTERN: [0-100]
HUMAN_MARKER: [0-100]
EMOTIONAL_AUTHENTICITY: [0-100]
PERSONA_FIT: [0-100]
SUBREDDIT_FIT: [0-100]

ISSUES:
[If any issues found, list as:]
- TYPE: [ai_pattern/persona_mismatch/subreddit_mismatch/emotional_inconsistency]
- SEVERITY: [critical/moderate/minor]
- DESCRIPTION: [what's wrong]
- LOCATION: [where in content]
- SUGGESTION: [how to fix]

[Repeat for each issue]

STRENGTHS:
- [What this content does well]
- [Another strength]

FEEDBACK:
[2-3 sentence summary of overall authenticity]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Be analytical and precise. Your goal is to catch AI patterns that humans would notice.`;
}

/**
 * Build validation prompt for entire thread
 */
function buildThreadValidationPrompt(
    threadContent: string,
    context: ValidationContext
): string {
    const { persona, subreddit } = context;

    return `You are an expert Reddit authenticity validator. Your job is to analyze an entire conversation thread and determine if it feels like a natural human conversation or AI-generated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THREAD TO VALIDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${threadContent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPECTED CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subreddit: r/${subreddit.name}
Persona: ${persona.name} (${persona.vocabulary.formality > 0.5 ? 'Professional' : 'Casual'})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THREAD-SPECIFIC VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In addition to the standard 5 dimensions, also evaluate:

6. THREAD COHERENCE (Score 0-100)
   • Does emotional progression make sense?
   • Are replies actually responding to previous comments?
   • Does frustration naturally decrease over time (if applicable)?
   • Are there natural conversation elements (acknowledgment, follow-up questions)?
   • Does the OP's voice stay consistent across messages?
   • Are there appropriate delays/timing patterns?
   • Does vulnerability emerge naturally (not forced)?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OVERALL_SCORE: [0-100]
PASSED: [YES/NO]
CONFIDENCE: [0-100]

DIMENSION_SCORES:
AI_PATTERN: [0-100]
HUMAN_MARKER: [0-100]
EMOTIONAL_AUTHENTICITY: [0-100]
PERSONA_FIT: [0-100]
SUBREDDIT_FIT: [0-100]
THREAD_COHERENCE: [0-100]

ISSUES:
[List issues as before, plus add coherence_issue type]

STRENGTHS:
[What works well in this thread]

FEEDBACK:
[Overall assessment of thread authenticity]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// RESPONSE PARSING

/**
 * Parse AI validation response into structured result
 */
function parseValidationResponse(response: string): ValidationResult {
    const result: ValidationResult = {
        passed: false,
        overallScore: 0,
        dimensions: {
            aiPatternScore: 0,
            humanMarkerScore: 0,
            emotionalAuthenticityScore: 0,
            personaFitScore: 0,
            subredditFitScore: 0
        },
        issues: [],
        strengths: [],
        feedback: '',
        confidence: 0.5
    };

    try {
        // Parse overall score
        const scoreMatch = response.match(/OVERALL_SCORE:\s*(\d+)/);
        if (scoreMatch) {
            result.overallScore = parseInt(scoreMatch[1]);
        }

        // Parse passed status
        const passedMatch = response.match(/PASSED:\s*(YES|NO)/);
        if (passedMatch) {
            result.passed = passedMatch[1] === 'YES';
        }

        // Parse confidence
        const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/);
        if (confidenceMatch) {
            result.confidence = parseInt(confidenceMatch[1]) / 100;
        }

        // Parse dimension scores
        const aiPatternMatch = response.match(/AI_PATTERN:\s*(\d+)/);
        if (aiPatternMatch) {
            result.dimensions.aiPatternScore = parseInt(aiPatternMatch[1]);
        }

        const humanMarkerMatch = response.match(/HUMAN_MARKER:\s*(\d+)/);
        if (humanMarkerMatch) {
            result.dimensions.humanMarkerScore = parseInt(humanMarkerMatch[1]);
        }

        const emotionalMatch = response.match(/EMOTIONAL_AUTHENTICITY:\s*(\d+)/);
        if (emotionalMatch) {
            result.dimensions.emotionalAuthenticityScore = parseInt(emotionalMatch[1]);
        }

        const personaMatch = response.match(/PERSONA_FIT:\s*(\d+)/);
        if (personaMatch) {
            result.dimensions.personaFitScore = parseInt(personaMatch[1]);
        }

        const subredditMatch = response.match(/SUBREDDIT_FIT:\s*(\d+)/);
        if (subredditMatch) {
            result.dimensions.subredditFitScore = parseInt(subredditMatch[1]);
        }

        const coherenceMatch = response.match(/THREAD_COHERENCE:\s*(\d+)/);
        if (coherenceMatch) {
            result.dimensions.threadCoherenceScore = parseInt(coherenceMatch[1]);
        }

        // Parse issues (using multiline regex instead of /s flag)
        const issuesSection = response.match(/ISSUES:([\s\S]*?)(?=STRENGTHS:|$)/);
        if (issuesSection) {
            const issueBlocks = issuesSection[1].split(/- TYPE:/).slice(1);
            issueBlocks.forEach(block => {
                const typeMatch = block.match(/([^\n]+)/);
                const severityMatch = block.match(/SEVERITY:\s*([^\n]+)/);
                const descMatch = block.match(/DESCRIPTION:\s*([^\n]+)/);
                const locationMatch = block.match(/LOCATION:\s*([^\n]+)/);
                const suggestionMatch = block.match(/SUGGESTION:\s*([^\n]+)/);

                if (typeMatch && severityMatch && descMatch) {
                    result.issues.push({
                        type: typeMatch[1].trim() as ValidationIssue['type'],
                        severity: severityMatch[1].trim() as ValidationIssue['severity'],
                        description: descMatch[1].trim(),
                        location: locationMatch?.[1].trim(),
                        suggestion: suggestionMatch?.[1].trim()
                    });
                }
            });
        }

        // Parse strengths (using multiline regex instead of /s flag)
        const strengthsSection = response.match(/STRENGTHS:([\s\S]*?)(?=FEEDBACK:|$)/);
        if (strengthsSection) {
            const strengthLines = strengthsSection[1]
                .split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.replace(/^-\s*/, '').trim());
            result.strengths = strengthLines;
        }

        // Parse feedback (using multiline regex instead of /s flag)
        const feedbackMatch = response.match(/FEEDBACK:([\s\S]*?)$/);
        if (feedbackMatch) {
            result.feedback = feedbackMatch[1].trim();
        }

    } catch (error) {
        console.error('Error parsing validation response:', error);
        // Return default result on parse error
    }

    return result;
}

// BATCH VALIDATION

/**
 * Validate multiple pieces of content in batch
 *
 * @param contents - Array of content to validate
 * @param contexts - Corresponding contexts
 * @returns Array of validation results
 */
export async function validateBatch(
    contents: string[],
    contexts: ValidationContext[]
): Promise<ValidationResult[]> {
    if (contents.length !== contexts.length) {
        throw new Error('Contents and contexts must have same length');
    }

    // Validate in parallel for efficiency
    const validationPromises = contents.map((content, i) =>
        validateContentWithAI(content, contexts[i])
    );

    return Promise.all(validationPromises);
}

// QUALITY SCORING

/**
 * Get overall quality assessment from validation result
 */
export function getQualityAssessment(result: ValidationResult): {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    label: string;
    recommendation: string;
} {
    const score = result.overallScore;

    if (score >= 90) {
        return {
            grade: 'A',
            label: 'Excellent - Indistinguishable from human',
            recommendation: 'Use as-is'
        };
    } else if (score >= 80) {
        return {
            grade: 'B',
            label: 'Good - Very authentic',
            recommendation: 'Minor improvements optional'
        };
    } else if (score >= 70) {
        return {
            grade: 'C',
            label: 'Acceptable - Passes but could be better',
            recommendation: 'Review issues and consider regenerating'
        };
    } else if (score >= 60) {
        return {
            grade: 'D',
            label: 'Needs Improvement - Too AI-like',
            recommendation: 'Regenerate with fixes'
        };
    } else {
        return {
            grade: 'F',
            label: 'Poor - Obviously AI-generated',
            recommendation: 'Must regenerate'
        };
    }
}

/**
 * Get dimension-specific feedback
 */
export function getDimensionFeedback(result: ValidationResult): string[] {
    const feedback: string[] = [];
    const dims = result.dimensions;

    // AI Patterns
    if (dims.aiPatternScore < 70) {
        feedback.push(`⚠️  Too many AI patterns detected (score: ${dims.aiPatternScore}/100). Remove formal language and corporate speak.`);
    } else if (dims.aiPatternScore >= 90) {
        feedback.push(`✅ Excellent - Very few AI patterns (score: ${dims.aiPatternScore}/100)`);
    }

    // Human Markers
    if (dims.humanMarkerScore < 70) {
        feedback.push(`⚠️  Not enough human markers (score: ${dims.humanMarkerScore}/100). Add lowercase i, casual markers, natural imperfections.`);
    } else if (dims.humanMarkerScore >= 90) {
        feedback.push(`✅ Great human markers present (score: ${dims.humanMarkerScore}/100)`);
    }

    // Emotional Authenticity
    if (dims.emotionalAuthenticityScore < 70) {
        feedback.push(`⚠️  Emotion feels forced or inauthentic (score: ${dims.emotionalAuthenticityScore}/100). Make emotional expression more genuine.`);
    } else if (dims.emotionalAuthenticityScore >= 90) {
        feedback.push(`✅ Emotion feels very authentic (score: ${dims.emotionalAuthenticityScore}/100)`);
    }

    // Persona Fit
    if (dims.personaFitScore < 70) {
        feedback.push(`⚠️  Doesn't match persona voice (score: ${dims.personaFitScore}/100). Adjust vocabulary and style to match persona.`);
    } else if (dims.personaFitScore >= 90) {
        feedback.push(`✅ Perfect persona fit (score: ${dims.personaFitScore}/100)`);
    }

    // Subreddit Fit
    if (dims.subredditFitScore < 70) {
        feedback.push(`⚠️  Doesn't match subreddit culture (score: ${dims.subredditFitScore}/100). Adjust formality and tone.`);
    } else if (dims.subredditFitScore >= 90) {
        feedback.push(`✅ Great subreddit fit (score: ${dims.subredditFitScore}/100)`);
    }

    // Thread Coherence
    if (dims.threadCoherenceScore !== undefined) {
        if (dims.threadCoherenceScore < 70) {
            feedback.push(`⚠️  Conversation flow seems unnatural (score: ${dims.threadCoherenceScore}/100). Improve emotional progression and responses.`);
        } else if (dims.threadCoherenceScore >= 90) {
            feedback.push(`✅ Excellent conversation flow (score: ${dims.threadCoherenceScore}/100)`);
        }
    }

    return feedback;
}

// VALIDATION SUMMARY

/**
 * Generate human-readable validation summary
 */
export function generateValidationSummary(result: ValidationResult): string {
    const assessment = getQualityAssessment(result);
    const dimFeedback = getDimensionFeedback(result);

    let summary = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Score: ${result.overallScore}/100 (Grade: ${assessment.grade})
Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}
Assessment: ${assessment.label}
Recommendation: ${assessment.recommendation}
Confidence: ${(result.confidence * 100).toFixed(0)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSION SCORES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AI Pattern Detection: ${result.dimensions.aiPatternScore}/100
Human Marker Presence: ${result.dimensions.humanMarkerScore}/100
Emotional Authenticity: ${result.dimensions.emotionalAuthenticityScore}/100
Persona Fit: ${result.dimensions.personaFitScore}/100
Subreddit Fit: ${result.dimensions.subredditFitScore}/100
${result.dimensions.threadCoherenceScore !== undefined ? `Thread Coherence: ${result.dimensions.threadCoherenceScore}/100` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSION FEEDBACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${dimFeedback.join('\n')}

${result.issues.length > 0 ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ISSUES FOUND (${result.issues.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${result.issues.map((issue, i) => `
${i + 1}. [${issue.severity.toUpperCase()}] ${issue.type}
   ${issue.description}
   ${issue.location ? `Location: ${issue.location}` : ''}
   ${issue.suggestion ? `Suggestion: ${issue.suggestion}` : ''}
`).join('\n')}
` : ''}

${result.strengths.length > 0 ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRENGTHS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${result.strengths.map(s => `• ${s}`).join('\n')}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI FEEDBACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${result.feedback}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    return summary;
}

// UTILITY FUNCTIONS

/**
 * Check if validation result meets minimum quality threshold
 */
export function meetsQualityThreshold(
    result: ValidationResult,
    threshold: number = 70
): boolean {
    return result.overallScore >= threshold && result.passed;
}

/**
 * Get critical issues (severity = critical)
 */
export function getCriticalIssues(result: ValidationResult): ValidationIssue[] {
    return result.issues.filter(issue => issue.severity === 'critical');
}

/**
 * Calculate weighted score (emphasize certain dimensions)
 */
export function calculateWeightedScore(
    result: ValidationResult,
    weights: {
        aiPattern?: number;
        humanMarker?: number;
        emotionalAuthenticity?: number;
        personaFit?: number;
        subredditFit?: number;
        threadCoherence?: number;
    } = {}
): number {
    const defaultWeights = {
        aiPattern: 0.25,
        humanMarker: 0.25,
        emotionalAuthenticity: 0.20,
        personaFit: 0.15,
        subredditFit: 0.10,
        threadCoherence: 0.05
    };

    const finalWeights = { ...defaultWeights, ...weights };
    const dims = result.dimensions;

    let weightedScore = 0;
    let totalWeight = 0;

    if (dims.aiPatternScore !== undefined) {
        weightedScore += dims.aiPatternScore * finalWeights.aiPattern;
        totalWeight += finalWeights.aiPattern;
    }

    if (dims.humanMarkerScore !== undefined) {
        weightedScore += dims.humanMarkerScore * finalWeights.humanMarker;
        totalWeight += finalWeights.humanMarker;
    }

    if (dims.emotionalAuthenticityScore !== undefined) {
        weightedScore += dims.emotionalAuthenticityScore * finalWeights.emotionalAuthenticity;
        totalWeight += finalWeights.emotionalAuthenticity;
    }

    if (dims.personaFitScore !== undefined) {
        weightedScore += dims.personaFitScore * finalWeights.personaFit;
        totalWeight += finalWeights.personaFit;
    }

    if (dims.subredditFitScore !== undefined) {
        weightedScore += dims.subredditFitScore * finalWeights.subredditFit;
        totalWeight += finalWeights.subredditFit;
    }

    if (dims.threadCoherenceScore !== undefined) {
        weightedScore += dims.threadCoherenceScore * finalWeights.threadCoherence;
        totalWeight += finalWeights.threadCoherence;
    }

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
}

/**
 * Compare two validation results
 */
export function compareValidationResults(
    result1: ValidationResult,
    result2: ValidationResult
): {
    better: 'result1' | 'result2' | 'tie';
    scoreDifference: number;
    dimensionComparison: Record<string, number>;
} {
    const scoreDiff = result1.overallScore - result2.overallScore;

    return {
        better: scoreDiff > 0 ? 'result1' : scoreDiff < 0 ? 'result2' : 'tie',
        scoreDifference: Math.abs(scoreDiff),
        dimensionComparison: {
            aiPattern: result1.dimensions.aiPatternScore - result2.dimensions.aiPatternScore,
            humanMarker: result1.dimensions.humanMarkerScore - result2.dimensions.humanMarkerScore,
            emotionalAuthenticity: result1.dimensions.emotionalAuthenticityScore - result2.dimensions.emotionalAuthenticityScore,
            personaFit: result1.dimensions.personaFitScore - result2.dimensions.personaFitScore,
            subredditFit: result1.dimensions.subredditFitScore - result2.dimensions.subredditFitScore
        }
    };
}
