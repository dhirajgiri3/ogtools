import { NextRequest, NextResponse } from 'next/server';
import {
    WeekCalendar,
    ConversationThread,
    ScheduledConversation,
    Persona,
} from '@/core/types';
import { generateConversation } from '@/core/algorithms/conversation/designer';
import { injectAuthenticity } from '@/core/algorithms/authenticity/engine';
import { predictQuality } from '@/core/algorithms/quality/predictor';
import { generateSchedule, applyScheduleToConversation } from '@/core/algorithms/timing/engine';
import { validateSafety } from '@/core/algorithms/safety/validator';

/**
 * POST /api/regenerate
 *
 * Regeneration endpoint with three modes:
 * 1. conversation: Regenerate a single conversation
 * 2. week: Regenerate entire week with same parameters
 * 3. week-modified: Regenerate week with modified parameters
 */

interface RegenerateRequest {
    mode: 'conversation' | 'week' | 'week-modified';
    conversationId?: string;
    weekIndex?: number;
    context: {
        currentWeek?: WeekCalendar;
        previousWeeks?: WeekCalendar[];
    };
    modifiedParams?: {
        personas?: Persona[];
        subreddits?: string[];
        keywords?: string[];
        postsPerWeek?: number;
        qualityThreshold?: number;
    };
}

export async function POST(req: NextRequest) {
    try {
        const input: RegenerateRequest = await req.json();

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'Missing OPENAI_API_KEY environment variable' },
                { status: 500 }
            );
        }

        // Route to appropriate handler based on mode
        switch (input.mode) {
            case 'conversation':
                return await regenerateSingleConversation(input);
            case 'week':
                return await regenerateWeek(input);
            case 'week-modified':
                return await regenerateWeekWithModifications(input);
            default:
                return NextResponse.json(
                    { error: 'Invalid mode. Use: conversation, week, or week-modified' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Regeneration error:', error);
        return NextResponse.json(
            { error: 'Regeneration failed', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

/**
 * Mode 1: Regenerate a single conversation
 */
async function regenerateSingleConversation(input: RegenerateRequest): Promise<NextResponse> {
    if (!input.conversationId || !input.context.currentWeek) {
        return NextResponse.json(
            { error: 'Missing conversationId or currentWeek in context' },
            { status: 400 }
        );
    }

    const week = input.context.currentWeek;
    const originalConv = week.conversations.find(
        c => c.conversation.id === input.conversationId
    );

    if (!originalConv) {
        return NextResponse.json(
            { error: 'Conversation not found in current week' },
            { status: 404 }
        );
    }

    console.log(`⚡ Regenerating conversation ${input.conversationId}...`);

    // Get original generation parameters from the conversation
    const persona = originalConv.conversation.post.persona;
    const subreddit = originalConv.conversation.subreddit;
    const arcType = originalConv.conversation.arcType;

    // Extract personas and company from week metadata (approximate from first conversation)
    const personas = week.conversations.map(c => c.conversation.post.persona);
    const uniquePersonas = personas.filter((p, index, self) =>
        index === self.findIndex(t => t.id === p.id)
    );

    // Reconstruct company context from original conversation
    const company = {
        name: '', // Will be inferred from conversation content
        product: '',
        valuePropositions: [],
        keywords: []
    };

    // Extract keywords from conversation
    const keywords = originalConv.conversation.post.keywords || [];

    const MIN_QUALITY_THRESHOLD = 70;
    const MAX_ATTEMPTS = 2;

    let bestConversation: ConversationThread | null = null;
    let bestScore = 0;

    // Try up to MAX_ATTEMPTS to get high quality
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
            // Generate new conversation with same arc type and persona
            const baseConversation = await generateConversation(
                arcType,
                [persona], // Use same persona
                company,
                subreddit,
                keywords,
                new Set()
            );

            // Apply authenticity transformations (parallel)
            const postAuthPromise = injectAuthenticity(
                baseConversation.post.content,
                baseConversation.post.persona,
                subreddit,
                'post'
            );

            const commentAuthPromises = baseConversation.topLevelComments.map(async (comment) => {
                const newContent = await injectAuthenticity(
                    comment.content,
                    comment.persona,
                    subreddit,
                    'comment'
                );
                comment.content = newContent;
            });

            const replyAuthPromises = baseConversation.replies.map(async (reply) => {
                const newContent = await injectAuthenticity(
                    reply.content,
                    reply.persona,
                    subreddit,
                    'reply'
                );
                reply.content = newContent;
            });

            const [newPostContent] = await Promise.all([
                postAuthPromise,
                ...commentAuthPromises,
                ...replyAuthPromises
            ]);

            baseConversation.post.content = newPostContent;

            // Score quality
            const qualityScore = predictQuality(baseConversation as ConversationThread);

            if (qualityScore.overall > bestScore) {
                bestScore = qualityScore.overall;
                bestConversation = {
                    ...baseConversation,
                    id: originalConv.conversation.id, // Keep same ID
                    qualityScore
                } as ConversationThread;
            }

            if (qualityScore.overall >= MIN_QUALITY_THRESHOLD) {
                console.log(`✓ Regenerated: ${qualityScore.overall}/100 - PASS`);
                break;
            } else {
                console.log(`⟳ Attempt ${attempt + 1}: ${qualityScore.overall}/100 - retrying...`);
            }
        } catch (error) {
            console.error(`✗ Regeneration attempt ${attempt + 1} failed:`, error);
            if (attempt === MAX_ATTEMPTS - 1) {
                throw error;
            }
        }
    }

    if (!bestConversation) {
        return NextResponse.json(
            { error: 'Failed to generate acceptable conversation after retries' },
            { status: 500 }
        );
    }

    // Create scheduled conversation with original timing
    const scheduled: ScheduledConversation = {
        conversation: bestConversation,
        scheduledTime: originalConv.scheduledTime,
        commentTimings: originalConv.commentTimings,
        replyTimings: originalConv.replyTimings,
    };

    return NextResponse.json({ scheduled, conversation: bestConversation });
}

/**
 * Mode 2: Regenerate entire week with same parameters
 */
async function regenerateWeek(input: RegenerateRequest): Promise<NextResponse> {
    if (!input.context.currentWeek) {
        return NextResponse.json(
            { error: 'Missing currentWeek in context' },
            { status: 400 }
        );
    }

    const week = input.context.currentWeek;

    // Extract parameters from existing week
    const personas = week.conversations.map(c => c.conversation.post.persona);
    const uniquePersonas = personas.filter((p, index, self) =>
        index === self.findIndex(t => t.id === p.id)
    );

    const subreddits = [...new Set(week.conversations.map(c => c.conversation.subreddit))];
    const postsPerWeek = week.conversations.length;

    console.log(`⚡ Regenerating week ${week.weekNumber} with ${postsPerWeek} conversations...`);

    // Generate conversations (similar to generate endpoint)
    const arcTypes = ['discovery', 'comparison', 'problemSolver'] as const;
    const MIN_QUALITY_THRESHOLD = 70;

    const generationPromises = Array.from({ length: postsPerWeek }, async (_, i) => {
        const arcType = arcTypes[i % arcTypes.length];
        const subreddit = subreddits[i % subreddits.length];

        try {
            const baseConversation = await generateConversation(
                arcType,
                uniquePersonas,
                { name: '', product: '', valuePropositions: [], keywords: [] },
                subreddit,
                [],
                new Set()
            );

            // Apply authenticity
            const postAuthPromise = injectAuthenticity(
                baseConversation.post.content,
                baseConversation.post.persona,
                subreddit,
                'post'
            );

            const commentAuthPromises = baseConversation.topLevelComments.map(async (comment) => {
                const newContent = await injectAuthenticity(
                    comment.content,
                    comment.persona,
                    subreddit,
                    'comment'
                );
                comment.content = newContent;
            });

            const replyAuthPromises = baseConversation.replies.map(async (reply) => {
                const newContent = await injectAuthenticity(
                    reply.content,
                    reply.persona,
                    subreddit,
                    'reply'
                );
                reply.content = newContent;
            });

            const [newPostContent] = await Promise.all([
                postAuthPromise,
                ...commentAuthPromises,
                ...replyAuthPromises
            ]);

            baseConversation.post.content = newPostContent;

            const qualityScore = predictQuality(baseConversation as ConversationThread);

            return {
                ...baseConversation,
                qualityScore
            } as ConversationThread;
        } catch (error) {
            console.error(`Failed to generate conversation ${i}:`, error);
            return null;
        }
    });

    const results = await Promise.all(generationPromises);
    const conversations = results.filter((c): c is ConversationThread => c !== null);

    // Generate schedule
    const scheduledConversations = generateSchedule(
        conversations,
        uniquePersonas,
        new Date(week.conversations[0].scheduledTime),
        postsPerWeek
    );

    scheduledConversations.forEach(sc => {
        applyScheduleToConversation(sc.conversation, sc);
    });

    // Validate safety
    const safetyReport = validateSafety(scheduledConversations, uniquePersonas);

    // Calculate average quality
    const averageQuality = conversations.length > 0
        ? conversations.reduce((sum, c) => sum + c.qualityScore.overall, 0) / conversations.length
        : 0;

    // Build new calendar
    const newCalendar: WeekCalendar = {
        weekNumber: week.weekNumber,
        conversations: scheduledConversations,
        averageQuality,
        safetyReport,
        metadata: {
            generatedAt: new Date(),
            totalConversations: scheduledConversations.length,
            subredditDistribution: subreddits.reduce((acc, sub) => {
                acc[sub] = scheduledConversations.filter(c => c.conversation.subreddit === sub).length;
                return acc;
            }, {} as Record<string, number>),
            personaUsage: {}
        }
    };

    return NextResponse.json({ calendar: newCalendar });
}

/**
 * Mode 3: Regenerate week with modified parameters
 */
async function regenerateWeekWithModifications(input: RegenerateRequest): Promise<NextResponse> {
    // This mode would be implemented similar to regenerateWeek
    // but with modified parameters from input.modifiedParams
    // For now, return not implemented
    return NextResponse.json(
        { error: 'Mode week-modified not yet implemented' },
        { status: 501 }
    );
}
