import { NextRequest, NextResponse } from 'next/server';
import {
    GenerationInput,
    WeekCalendar,
    ConversationThread,
    ScheduledConversation
} from '@/core/types';
import { generateConversation, getRandomArcType } from '@/core/algorithms/conversation/designer';
import { injectAuthenticity } from '@/core/algorithms/authenticity/engine';
import { predictQuality } from '@/core/algorithms/quality/predictor';
import { generateSchedule, applyScheduleToConversation } from '@/core/algorithms/timing/engine';
import { validateSafety } from '@/core/algorithms/safety/validator';
import { extractWeekContext, selectDiverseSubreddit } from '@/core/algorithms/timing/week-context';

/**
 * POST /api/generate
 * 
 * Main generation endpoint for creating Reddit content calendars.
 * 
 * Flow:
 * 1. Parse and validate input
 * 2. Initialize Gemini client
 * 3. Generate conversations (with arc rotation)
 * 4. Apply authenticity transformations
 * 5. Score quality (regenerate if below threshold)
 * 6. Generate schedule
 * 7. Validate safety
 * 8. Return complete calendar
 */

export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const input: GenerationInput = await req.json();

        // Validate input
        if (!input.company || !input.personas || !input.subreddits || !input.keywords) {
            return NextResponse.json(
                { error: 'Missing required fields: company, personas, subreddits, keywords' },
                { status: 400 }
            );
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'Missing OPENAI_API_KEY environment variable' },
                { status: 500 }
            );
        }

        // Extract context from previous weeks (if any)
        const weekNumber = input.weekNumber || 1;
        const weekContext = input.previousWeeks && input.previousWeeks.length > 0
            ? extractWeekContext(input.previousWeeks)
            : null;

        console.log(`⚡ Generating Week ${weekNumber} calendar...`);
        if (weekContext) {
            console.log(`📊 Context: ${weekContext.usedTopics.length} topics, ${weekContext.personaUsage.size} personas used`);
        }

        // Pre-validate frequency limits
        const maxPostsPerSubreddit = 2;
        const maxPostsPerPersona = 7;

        if (input.subreddits.length > 0) {
            const postsPerSubreddit = Math.ceil(input.postsPerWeek / input.subreddits.length);
            if (postsPerSubreddit > maxPostsPerSubreddit) {
                return NextResponse.json(
                    {
                        error: 'Frequency limit violation',
                        details: `Requested ${input.postsPerWeek} posts across ${input.subreddits.length} subreddits would result in ${postsPerSubreddit} posts per subreddit (max: ${maxPostsPerSubreddit}). Please add more subreddits or reduce postsPerWeek.`
                    },
                    { status: 400 }
                );
            }
        }

        if (input.personas.length > 0) {
            const postsPerPersona = Math.ceil(input.postsPerWeek / input.personas.length);
            if (postsPerPersona > maxPostsPerPersona) {
                return NextResponse.json(
                    {
                        error: 'Frequency limit violation',
                        details: `Requested ${input.postsPerWeek} posts with ${input.personas.length} personas would result in ${postsPerPersona} posts per persona (max: ${maxPostsPerPersona}). Please add more personas or reduce postsPerWeek.`
                    },
                    { status: 400 }
                );
            }
        }

        // Generate conversations in PARALLEL for speed
        const arcTypes = ['discovery', 'comparison', 'problemSolver'] as const;
        const MIN_QUALITY_THRESHOLD = 70; // Minimum acceptable quality (lowered from 75)
        const MAX_REGENERATION_ATTEMPTS = 1; // Reduced from 2 to 1 for speed

        console.log(`⚡ Starting parallel generation of ${input.postsPerWeek} conversations...`);
        const startTime = Date.now();

        // Track persona usage to ensure rotation
        const usedPosters = new Set<string>();

        // Create all generation promises with quality-gated regeneration
        const generationPromises = Array.from({ length: input.postsPerWeek }, async (_, i) => {
            const arcType = arcTypes[i % arcTypes.length];

            // Use diverse subreddit selection if we have context
            const subreddit = weekContext
                ? selectDiverseSubreddit(input.subreddits, weekContext)
                : input.subreddits[i % input.subreddits.length];

            let bestConversation: ConversationThread | null = null;
            let bestScore = 0;

            // Try up to MAX_REGENERATION_ATTEMPTS times to get high quality
            for (let attempt = 0; attempt <= MAX_REGENERATION_ATTEMPTS; attempt++) {
                try {
                    // Generate base conversation (now tracks persona rotation)
                    const baseConversation = await generateConversation(
                        arcType,
                        input.personas,
                        input.company,
                        subreddit,
                        input.keywords,
                        usedPosters
                    );

                    // Track which persona was used
                    usedPosters.add(baseConversation.post.persona.id);

                    // Reset rotation after all personas used once
                    if (usedPosters.size === input.personas.length) {
                        usedPosters.clear();
                    }

                    // Apply authenticity transformations (PARALLELIZED)
                    // 1. Post Body
                    const postAuthPromise = injectAuthenticity(
                        baseConversation.post.content,
                        baseConversation.post.persona,
                        subreddit,
                        'post'
                    );

                    // 2. Comments (Parallel)
                    const commentAuthPromises = baseConversation.topLevelComments.map(async (comment) => {
                        const newContent = await injectAuthenticity(
                            comment.content,
                            comment.persona,
                            subreddit,
                            'comment'
                        );
                        comment.content = newContent;
                    });

                    // 3. Replies (Parallel)
                    const replyAuthPromises = baseConversation.replies.map(async (reply) => {
                        const newContent = await injectAuthenticity(
                            reply.content,
                            reply.persona,
                            subreddit,
                            'reply'
                        );
                        reply.content = newContent;
                    });

                    // Wait for ALL transformations to complete
                    const [newPostContent] = await Promise.all([
                        postAuthPromise,
                        ...commentAuthPromises,
                        ...replyAuthPromises
                    ]);

                    baseConversation.post.content = newPostContent;

                    // Score quality
                    const qualityScore = predictQuality(baseConversation as ConversationThread);

                    // Keep track of best attempt
                    if (qualityScore.overall > bestScore) {
                        bestScore = qualityScore.overall;
                        bestConversation = {
                            ...baseConversation,
                            qualityScore
                        } as ConversationThread;
                    }

                    // If quality meets threshold, stop regenerating
                    if (qualityScore.overall >= MIN_QUALITY_THRESHOLD) {
                        console.log(`✓ Conv ${i + 1}: ${qualityScore.overall}/100 (${arcType}) - PASS`);
                        break;
                    } else if (attempt < MAX_REGENERATION_ATTEMPTS) {
                        console.log(`⟳ Conv ${i + 1}: ${qualityScore.overall}/100 - regenerating (attempt ${attempt + 2})...`);
                    } else {
                        console.log(`⚠ Conv ${i + 1}: ${qualityScore.overall}/100 - using best attempt (${bestScore}/100)`);
                    }
                } catch (error) {
                    console.error(`✗ Conv ${i + 1} attempt ${attempt + 1} failed:`, error);
                    if (attempt === MAX_REGENERATION_ATTEMPTS) {
                        return null;
                    }
                }
            }

            return bestConversation;
        });

        // Wait for all conversations to complete in parallel
        const results = await Promise.all(generationPromises);

        // Filter out null results AND conversations below minimum threshold
        const conversations = results.filter((c): c is ConversationThread =>
            c !== null && c.qualityScore.overall >= 50 // Allow 50+ but prefer 75+
        );

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const avgQuality = conversations.length > 0
            ? Math.round(conversations.reduce((sum, c) => sum + c.qualityScore.overall, 0) / conversations.length)
            : 0;
        console.log(`⚡ Generated ${conversations.length} conversations in ${elapsed}s (avg quality: ${avgQuality}/100)`);

        // Generate schedule
        console.log('Generating schedule...');
        // Calculate start date based on week number (Week 1 = current week, Week 2 = next week, etc.)
        const baseDate = new Date();
        const weeksToAdd = weekNumber - 1;
        const scheduleStartDate = new Date(baseDate.getTime() + (weeksToAdd * 7 * 24 * 60 * 60 * 1000));

        const scheduledConversations = generateSchedule(
            conversations,
            input.personas,
            scheduleStartDate,
            input.postsPerWeek
        );

        // Apply schedule to conversations
        scheduledConversations.forEach(sc => {
            applyScheduleToConversation(sc.conversation, sc);
        });

        // Validate safety
        console.log('Validating safety...');
        const safetyReport = validateSafety(scheduledConversations, input.personas);

        // Calculate average quality
        const averageQuality = conversations.length > 0
            ? conversations.reduce((sum, c) => sum + c.qualityScore.overall, 0) / conversations.length
            : 0;

        // Build metadata (Convert Maps to Objects for JSON serialization)
        const subredditDistObj: Record<string, number> = {};
        const personaUsageObj: Record<string, number> = {};

        scheduledConversations.forEach(sc => {
            const subreddit = sc.conversation.subreddit;
            subredditDistObj[subreddit] = (subredditDistObj[subreddit] || 0) + 1;

            const personaId = sc.conversation.post.persona.id;
            personaUsageObj[personaId] = (personaUsageObj[personaId] || 0) + 1;
        });

        // Build response
        const calendar: WeekCalendar = {
            weekNumber: weekNumber,
            conversations: scheduledConversations,
            averageQuality,
            safetyReport,
            metadata: {
                generatedAt: new Date(),
                totalConversations: conversations.length,
                subredditDistribution: subredditDistObj as any, // Cast to match type if it expects Map
                personaUsage: personaUsageObj as any
            }
        };

        return NextResponse.json(calendar);

    } catch (error) {
        console.error('=== GENERATION ERROR ===');
        const errorMessage = error instanceof Error ? error.stack || error.message : 'Unknown error';
        console.error('Stack:', errorMessage);

        // Write to error.log for debugging
        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(process.cwd(), 'error.log');
            fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] ${errorMessage}\n`);
        } catch (e) {
            console.error('Failed to write info to log file', e);
        }

        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                error: 'Internal server error during generation',
                details: errorMessage
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { message: 'POST to this endpoint with GenerationInput to generate calendars' },
        { status: 200 }
    );
}
