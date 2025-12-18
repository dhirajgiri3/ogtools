import { generateWithMultiPass, MultiPassResult } from '../generation/multi-pass-generator';
import { Persona, CompanyContext, SubredditContext, ConversationThread, PostTemplate } from '@/core/types';
import { EnhancedPersona } from '@/core/data/personas/persona-library';
import { generateEmotionalArc, EmotionalArc, ArcType } from '../persona/emotional-state-engine';
import { generateFrustrationCurve, FrustrationCurve, getFrustrationAtTime, adjustReplyForFrustrationLevel } from '../emotion/frustration-curves';
import { identifyVulnerabilityMoments, VulnerabilityMoment, injectVulnerabilityContext } from '../emotion/vulnerability-engine';
import { identifyHumorOpportunities, HumorOpportunity, injectHumorContext } from '../emotion/humor-timing';
import { validateContentWithAI, validateThreadWithAI, ValidationResult } from '../validation/ai-quality-validator';
import {
    buildPostPrompt,
    buildCommentPrompt,
    buildReplyPrompt
} from '../conversation/prompt-builder';

export interface ContentGenerationRequest {
    contentType: 'post' | 'comment' | 'reply';
    persona: EnhancedPersona;
    company: CompanyContext;
    subreddit: SubredditContext;
    template?: PostTemplate;
    keywords?: string[];
    conversationContext?: ConversationContext;
}

export interface ConversationContext {
    previousMessages: string[];
    currentTopic: string;
    emotionalPhase: 'initiation' | 'development' | 'resolution';
    timeElapsedMinutes?: number;
}

export interface EnhancedGenerationResult {
    content: string;
    metadata: {
        passes: {
            pass1_raw: string;
            pass2_authentic: string;
            pass3_validated: boolean;
        };
        attempts: number;
        finalQualityScore: number;
        emotionalArc?: EmotionalArc;
        frustrationCurve?: FrustrationCurve;
        currentEmotionalState?: string;
        currentFrustrationLevel?: number;
        vulnerabilityMoments?: VulnerabilityMoment[];
        humorOpportunities?: HumorOpportunity[];
        personalityInjections: string[];
        validation: ValidationResult;
        qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
        generationTimeMs: number;
        estimatedCost: number;
    };
    warnings: string[];
    recommendations: string[];
}

export interface ThreadGenerationRequest {
    persona: EnhancedPersona;
    company: CompanyContext;
    subreddit: SubredditContext;
    postTemplate: PostTemplate;
    keywords: string[];
    expectedReplies: number;
    arcType: ArcType;
}

export interface ThreadGenerationResult {
    post: EnhancedGenerationResult;
    comments: EnhancedGenerationResult[];
    replies: EnhancedGenerationResult[];
    threadMetadata: {
        emotionalArc: EmotionalArc;
        frustrationCurve: FrustrationCurve;
        vulnerabilityMoments: VulnerabilityMoment[];
        humorOpportunities: HumorOpportunity[];
        threadValidation: ValidationResult;
        overallQuality: number;
        estimatedTotalCost: number;
    };
}

/**
 * Generate single piece of content with full emotional intelligence
 *
 * This is the main entry point for generating posts, comments, or replies
 * with all Sprint 1-3 enhancements.
 */
export async function generateEnhancedContent(
    request: ContentGenerationRequest
): Promise<EnhancedGenerationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const personalityInjections: string[] = [];

    // STEP 1: Emotional Modeling (Sprint 2)
    let emotionalArc: EmotionalArc | undefined;
    let frustrationCurve: FrustrationCurve | undefined;
    let currentEmotionalState: string | undefined;
    let currentFrustrationLevel: number | undefined;

    if (request.contentType === 'post' && request.template) {
        // Generate emotional arc for post
        // Since PostTemplate doesn't have arc/problem, we'll use defaults or derive from emotion
        const arcType: ArcType = 'problemSolver'; // Default arc type
        const problemDescription = `issue with ${request.company.product}`;

        emotionalArc = generateEmotionalArc(
            request.persona,
            arcType,
            problemDescription
        );
        currentEmotionalState = emotionalArc.startState.primaryEmotion;

        // Generate frustration curve if emotion involves frustration
        if (request.template.emotion === 'frustration' || currentEmotionalState === 'frustration') {
            frustrationCurve = generateFrustrationCurve(
                request.persona,
                problemDescription,
                arcType
            );
            currentFrustrationLevel = frustrationCurve.timeline[0].frustrationLevel;
            personalityInjections.push('Frustration curve applied');
        }
    } else if (request.conversationContext) {
        // For comments/replies, estimate emotional state from context
        const { emotionalPhase, timeElapsedMinutes } = request.conversationContext;

        // Use simplified emotional estimation
        if (timeElapsedMinutes && frustrationCurve) {
            currentFrustrationLevel = getFrustrationAtTime(frustrationCurve, timeElapsedMinutes);
        }
    }

    // STEP 2: Identify Vulnerability & Humor Opportunities (Sprint 2)
    let vulnerabilityMoments: VulnerabilityMoment[] = [];
    let humorOpportunities: HumorOpportunity[] = [];

    if (request.conversationContext) {
        // Check for vulnerability triggers in conversation
        vulnerabilityMoments = identifyVulnerabilityMoments(
            request.conversationContext.previousMessages,
            request.persona
        );

        if (vulnerabilityMoments.length > 0) {
            personalityInjections.push(`Vulnerability moment identified: ${vulnerabilityMoments[0].type}`);
        }

        // Check for humor opportunities
        if (emotionalArc) {
            humorOpportunities = identifyHumorOpportunities(
                emotionalArc.progression,
                request.persona,
                request.subreddit.formalityLevel
            );

            if (humorOpportunities.length > 0) {
                personalityInjections.push(`Humor opportunity: ${humorOpportunities[0].type}`);
            }
        }
    }

    // STEP 3: Build Enhanced Prompt (Sprint 1)
    let basePrompt: string;

    if (request.contentType === 'post' && request.template) {
        basePrompt = buildPostPrompt(
            request.template,
            request.persona,
            request.company,
            request.subreddit,
            request.keywords || []
        );
    } else if (request.contentType === 'comment') {
        basePrompt = buildCommentPrompt(
            {
                purpose: 'helpful',
                tone: 'natural',
                timingRange: { min: 30, max: 120 },
                productMention: false
            },
            request.persona,
            request.company,
            request.subreddit,
            request.conversationContext?.previousMessages[0] || '',
            'OP',
            request.keywords || []
        );
    } else {
        basePrompt = buildReplyPrompt(
            {
                replyType: 'op_followup',
                purpose: 'clarify',
                tone: 'grateful'
            },
            request.persona,
            request.subreddit,
            request.conversationContext?.previousMessages[0] || '',
            request.conversationContext?.previousMessages[request.conversationContext.previousMessages.length - 1] || '',
            true // Assume OP
        );
    }

    // STEP 4: Inject Personality Context (Sprint 2)
    // Add vulnerability context if applicable
    if (vulnerabilityMoments.length > 0 && vulnerabilityMoments[0]) {
        basePrompt = injectVulnerabilityContext(
            basePrompt,
            vulnerabilityMoments[0],
            request.persona
        );
    }

    // Add humor context if applicable
    if (humorOpportunities.length > 0 && humorOpportunities[0]) {
        basePrompt = injectHumorContext(
            basePrompt,
            humorOpportunities[0],
            request.persona
        );
    }

    // STEP 5: Generate Content with Multi-Pass (Sprint 1)
    const generationContext = {
        emotion: currentEmotionalState || 'neutral',
        subreddit: request.subreddit,
        company: request.company,
        keywords: request.keywords || [],
        template: request.template
    };

    const multiPassResult: MultiPassResult = await generateWithMultiPass(
        request.contentType,
        request.persona,
        generationContext
    );

    let finalContent = multiPassResult.finalContent;

    // STEP 6: Adjust for Frustration Level (Sprint 2)
    if (currentFrustrationLevel !== undefined) {
        finalContent = adjustReplyForFrustrationLevel(
            finalContent,
            currentFrustrationLevel,
            request.persona
        );
        personalityInjections.push('Frustration-adjusted content');
    }

    // STEP 7: Validate with AI (Sprint 3)
    const validation = await validateContentWithAI(finalContent, {
        contentType: request.contentType,
        persona: request.persona,
        subreddit: request.subreddit,
        expectedEmotion: currentEmotionalState
    });

    // STEP 8: Quality Check & Warnings
    if (!validation.passed) {
        warnings.push(`Content did not pass validation (score: ${validation.overallScore}/100)`);
        recommendations.push('Consider regenerating with stricter parameters');
    }

    if (validation.dimensions.aiPatternScore < 70) {
        warnings.push('AI patterns detected - may not feel authentic');
    }

    if (validation.dimensions.humanMarkerScore < 70) {
        warnings.push('Insufficient human markers - add more imperfections');
    }

    // Estimate cost (GPT-4o-mini: ~$0.005 per generation + ~$0.001 per validation)
    const estimatedCost = (multiPassResult.passes.pass1_raw ? 0.002 : 0) +
        (multiPassResult.passes.pass2_authentic ? 0.002 : 0) +
        (multiPassResult.passes.pass3_validated ? 0.001 : 0) +
        0.001; // Validation cost

    const generationTimeMs = Date.now() - startTime;

    return {
        content: finalContent,
        metadata: {
            passes: multiPassResult.passes,
            attempts: multiPassResult.metadata.attempts,
            finalQualityScore: validation.overallScore,
            emotionalArc,
            frustrationCurve,
            currentEmotionalState,
            currentFrustrationLevel,
            vulnerabilityMoments,
            humorOpportunities,
            personalityInjections,
            validation,
            qualityGrade: getQualityGrade(validation.overallScore),
            generationTimeMs,
            estimatedCost
        },
        warnings,
        recommendations
    };
}

/**
 * Generate entire conversation thread with emotional progression
 *
 * This generates a complete thread (post + comments + replies) with:
 * - Emotional arc progression
 * - Frustration curve evolution
 * - Vulnerability moments at appropriate times
 * - Humor timing based on emotional state
 * - Thread-level validation
 */
export async function generateEnhancedThread(
    request: ThreadGenerationRequest
): Promise<ThreadGenerationResult> {
    const startTime = Date.now();

    // STEP 1: Generate Emotional Arc & Frustration Curve
    const arcType: ArcType = request.arcType;
    const problemDescription = `issue with ${request.company.product}`;

    // Map arcType to frustration curve arc type (which only accepts 3 types)
    const frustrationArcType: 'discovery' | 'problemSolver' | 'warStory' =
        arcType === 'discovery' ? 'discovery' :
            arcType === 'warStory' ? 'warStory' :
                'problemSolver'; // Default for comparison, debate, selfDiscovery, veteranHelpsNewbie

    const emotionalArc = generateEmotionalArc(
        request.persona,
        arcType,
        problemDescription
    );

    const frustrationCurve = generateFrustrationCurve(
        request.persona,
        problemDescription,
        frustrationArcType
    );

    // STEP 2: Identify Vulnerability & Humor Opportunities
    // For thread, we'll identify these across the entire conversation
    const threadMessages: string[] = [];

    // STEP 3: Generate Post
    const postResult = await generateEnhancedContent({
        contentType: 'post',
        persona: request.persona,
        company: request.company,
        subreddit: request.subreddit,
        template: request.postTemplate,
        keywords: request.keywords
    });

    threadMessages.push(postResult.content);

    // STEP 4: Generate Comments & Replies based on emotional progression
    const comments: EnhancedGenerationResult[] = [];
    const replies: EnhancedGenerationResult[] = [];

    const emotionalStates = emotionalArc.progression;
    const commentsToGenerate = Math.min(request.expectedReplies, emotionalStates.length);

    for (let i = 0; i < commentsToGenerate; i++) {
        const emotionalState = emotionalStates[i];
        const timeElapsed = (i + 1) * 30; // Assume 30 minutes between comments
        const frustrationLevel = getFrustrationAtTime(frustrationCurve, timeElapsed);

        // Simulate a helpful comment from community
        const simulatedComment = `[Simulated community response based on emotional state: ${emotionalState.primaryEmotion}]`;
        threadMessages.push(simulatedComment);

        // Generate OP's reply
        const replyResult = await generateEnhancedContent({
            contentType: 'reply',
            persona: request.persona,
            company: request.company,
            subreddit: request.subreddit,
            conversationContext: {
                previousMessages: [...threadMessages],
                currentTopic: problemDescription,
                emotionalPhase: i < commentsToGenerate * 0.3 ? 'initiation' :
                    i < commentsToGenerate * 0.7 ? 'development' :
                        'resolution',
                timeElapsedMinutes: timeElapsed
            }
        });

        replies.push(replyResult);
        threadMessages.push(replyResult.content);
    }

    // STEP 5: Identify Vulnerability & Humor across thread
    const vulnerabilityMoments = identifyVulnerabilityMoments(
        threadMessages,
        request.persona
    );

    const humorOpportunities = identifyHumorOpportunities(
        emotionalArc.progression,
        request.persona,
        request.subreddit.formalityLevel
    );

    // STEP 6: Validate entire thread
    const threadValidation = await validateThreadWithAI(
        threadMessages.filter(msg => !msg.startsWith('[Simulated')), // Remove simulated messages
        {
            contentType: 'thread',
            persona: request.persona,
            subreddit: request.subreddit
        }
    );

    // STEP 7: Calculate overall quality & cost
    const allResults = [postResult, ...replies];
    const overallQuality = allResults.reduce((sum, r) => sum + r.metadata.finalQualityScore, 0) / allResults.length;
    const estimatedTotalCost = allResults.reduce((sum, r) => sum + r.metadata.estimatedCost, 0) +
        0.001; // Thread validation cost

    return {
        post: postResult,
        comments,
        replies,
        threadMetadata: {
            emotionalArc,
            frustrationCurve,
            vulnerabilityMoments,
            humorOpportunities,
            threadValidation,
            overallQuality,
            estimatedTotalCost
        }
    };
}

// QUALITY ASSESSMENT

function getQualityGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

// BATCH GENERATION

/**
 * Generate multiple pieces of content in batch
 *
 * Useful for generating entire content calendar
 */
export async function generateContentBatch(
    requests: ContentGenerationRequest[]
): Promise<EnhancedGenerationResult[]> {
    // Generate in parallel for efficiency
    const results = await Promise.all(
        requests.map(request => generateEnhancedContent(request))
    );

    return results;
}

/**
 * Generate multiple threads in batch
 */
export async function generateThreadBatch(
    requests: ThreadGenerationRequest[]
): Promise<ThreadGenerationResult[]> {
    // For threads, generate sequentially to avoid rate limits
    const results: ThreadGenerationResult[] = [];

    for (const request of requests) {
        const result = await generateEnhancedThread(request);
        results.push(result);

        // Small delay between threads to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
}

// QUALITY REPORTING

/**
 * Generate quality report for batch results
 */
export function generateBatchQualityReport(
    results: EnhancedGenerationResult[]
): {
    summary: {
        totalGenerated: number;
        averageQuality: number;
        passRate: number;
        totalCost: number;
        averageGenerationTime: number;
    };
    gradeDistribution: Record<string, number>;
    commonIssues: Array<{ issue: string; count: number }>;
    recommendations: string[];
} {
    const totalGenerated = results.length;
    const averageQuality = results.reduce((sum, r) => sum + r.metadata.finalQualityScore, 0) / totalGenerated;
    const passRate = results.filter(r => r.metadata.validation.passed).length / totalGenerated;
    const totalCost = results.reduce((sum, r) => sum + r.metadata.estimatedCost, 0);
    const averageGenerationTime = results.reduce((sum, r) => sum + r.metadata.generationTimeMs, 0) / totalGenerated;

    // Grade distribution
    const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    results.forEach(r => {
        gradeDistribution[r.metadata.qualityGrade]++;
    });

    // Common issues
    const issueMap = new Map<string, number>();
    results.forEach(r => {
        r.metadata.validation.issues.forEach(issue => {
            const count = issueMap.get(issue.description) || 0;
            issueMap.set(issue.description, count + 1);
        });
    });

    const commonIssues = Array.from(issueMap.entries())
        .map(([issue, count]) => ({ issue, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Recommendations
    const recommendations: string[] = [];

    if (passRate < 0.7) {
        recommendations.push('Pass rate is low (<70%). Consider adjusting persona profiles or prompt templates.');
    }

    if (averageQuality < 75) {
        recommendations.push('Average quality is below target. Review AI pattern detection scores.');
    }

    if (gradeDistribution.F > totalGenerated * 0.1) {
        recommendations.push('More than 10% of content received F grade. Review generation parameters.');
    }

    return {
        summary: {
            totalGenerated,
            averageQuality,
            passRate,
            totalCost,
            averageGenerationTime
        },
        gradeDistribution,
        commonIssues,
        recommendations
    };
}

/**
 * Generate detailed thread quality report
 */
export function generateThreadQualityReport(
    thread: ThreadGenerationResult
): string {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THREAD QUALITY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Thread Quality: ${thread.threadMetadata.overallQuality.toFixed(1)}/100
Thread Validation Score: ${thread.threadMetadata.threadValidation.overallScore}/100
Thread Passed: ${thread.threadMetadata.threadValidation.passed ? '✅ YES' : '❌ NO'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMOTIONAL PROGRESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Arc Type: ${(thread.threadMetadata.emotionalArc as any).arcType || 'N/A'}
Start Emotion: ${thread.threadMetadata.emotionalArc.startState.primaryEmotion} (${(thread.threadMetadata.emotionalArc.startState.intensity * 100).toFixed(0)}%)
End Emotion: ${thread.threadMetadata.emotionalArc.endState.primaryEmotion} (${(thread.threadMetadata.emotionalArc.endState.intensity * 100).toFixed(0)}%)

Frustration Curve:
• Peak: ${(thread.threadMetadata.frustrationCurve.peak.level * 100).toFixed(0)}% at ${thread.threadMetadata.frustrationCurve.peak.time} minutes
• Resolution: ${(thread.threadMetadata.frustrationCurve.resolution.level * 100).toFixed(0)}% at ${thread.threadMetadata.frustrationCurve.resolution.time} minutes
• Recovery Speed: ${thread.threadMetadata.frustrationCurve.recoverySpeed}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSONALITY FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vulnerability Moments: ${thread.threadMetadata.vulnerabilityMoments.length}
${thread.threadMetadata.vulnerabilityMoments.map(v => `• ${v.type} (${v.style}) at comment ${v.triggerComment}`).join('\n')}

Humor Opportunities: ${thread.threadMetadata.humorOpportunities.length}
${thread.threadMetadata.humorOpportunities.map(h => `• ${h.type} at comment ${h.commentIndex} (${(h.appropriateness * 100).toFixed(0)}% appropriate)`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INDIVIDUAL CONTENT QUALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Post: ${thread.post.metadata.qualityGrade} (${thread.post.metadata.finalQualityScore}/100)

Replies:
${thread.replies.map((r, i) => `Reply ${i + 1}: ${r.metadata.qualityGrade} (${r.metadata.finalQualityScore}/100)`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COST & PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Cost: $${thread.threadMetadata.estimatedTotalCost.toFixed(4)}
Average Generation Time: ${((thread.post.metadata.generationTimeMs + thread.replies.reduce((sum, r) => sum + r.metadata.generationTimeMs, 0)) / (1 + thread.replies.length) / 1000).toFixed(2)}s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

// UTILITY FUNCTIONS

/**
 * Get best result from multiple generations
 */
export function selectBestResult(
    results: EnhancedGenerationResult[]
): EnhancedGenerationResult {
    return results.reduce((best, current) =>
        current.metadata.finalQualityScore > best.metadata.finalQualityScore ? current : best
    );
}

/**
 * Filter results by minimum quality threshold
 */
export function filterByQuality(
    results: EnhancedGenerationResult[],
    minimumScore: number = 70
): EnhancedGenerationResult[] {
    return results.filter(r => r.metadata.finalQualityScore >= minimumScore);
}

/**
 * Sort results by quality
 */
export function sortByQuality(
    results: EnhancedGenerationResult[],
    descending: boolean = true
): EnhancedGenerationResult[] {
    return [...results].sort((a, b) =>
        descending
            ? b.metadata.finalQualityScore - a.metadata.finalQualityScore
            : a.metadata.finalQualityScore - b.metadata.finalQualityScore
    );
}
