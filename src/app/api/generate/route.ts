import { NextRequest, NextResponse } from 'next/server';
import {
    GenerationInput,
    WeekCalendar,
    ConversationThread,
    ScheduledConversation
} from '@/core/types';
import { generateConversation, getRandomArcType, generateConversationWithPersona } from '@/core/algorithms/conversation/designer';
import { injectAuthenticity } from '@/core/algorithms/authenticity/engine';
import { predictQuality } from '@/core/algorithms/quality/predictor';
import { generateSchedule, applyScheduleToConversation } from '@/core/algorithms/timing/engine';
import { validateSafety } from '@/core/algorithms/safety/validator';
import { Comment, Reply } from '@/core/types';
import { GENERATION_LIMITS, LLM_CONFIG } from '@/config/constants';
import {
    ValidationError,
    GenerationError,
    toErrorResponse,
    APIKeyError,
    FrequencyLimitError
} from '@/core/errors';
import { extractWeekContext, selectDiverseSubreddit } from '@/core/algorithms/timing/week-context';
import { extractCompanyActivities } from '@/core/algorithms/company/activity-extractor';

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

        // Validate required fields
        if (!input.company?.name || !input.company?.product) {
            throw new ValidationError(
                'Company name and product description are required',
                'company'
            );
        }

        if (!input.personas || input.personas.length < GENERATION_LIMITS.MIN_PERSONAS_REQUIRED) {
            throw new ValidationError(
                `At least ${GENERATION_LIMITS.MIN_PERSONAS_REQUIRED} persona required`,
                'personas',
                { provided: input.personas?.length || 0, required: GENERATION_LIMITS.MIN_PERSONAS_REQUIRED }
            );
        }

        if (!input.subreddits || input.subreddits.length < GENERATION_LIMITS.MIN_SUBREDDITS_REQUIRED) {
            throw new ValidationError(
                `At least ${GENERATION_LIMITS.MIN_SUBREDDITS_REQUIRED} subreddit required`,
                'subreddits',
                { provided: input.subreddits?.length || 0, required: GENERATION_LIMITS.MIN_SUBREDDITS_REQUIRED }
            );
        }

        if (!input.keywords || input.keywords.length < GENERATION_LIMITS.MIN_KEYWORDS_REQUIRED) {
            throw new ValidationError(
                `At least ${GENERATION_LIMITS.MIN_KEYWORDS_REQUIRED} keywords required`,
                'keywords',
                { provided: input.keywords?.length || 0, required: GENERATION_LIMITS.MIN_KEYWORDS_REQUIRED }
            );
        }

        // INTELLIGENT ACTIVITY EXTRACTION (Step 1 of Refinement Plan)
        // If activities are missing (first time setup), extract them using AI
        if (!input.company.activities || input.company.activities.length === 0) {
            console.log('🧠 Extracting intelligent activities for company...');
            try {
                input.company.activities = await extractCompanyActivities(input.company);
            } catch (err) {
                console.warn('Activity extraction failed, falling back to keywords', err);
                // Fallback will happen in prompt-builder
            }
        }

        // Validate posts per week range
        if (input.postsPerWeek < GENERATION_LIMITS.MIN_POSTS_PER_WEEK ||
            input.postsPerWeek > GENERATION_LIMITS.MAX_POSTS_PER_WEEK) {
            throw new ValidationError(
                `Posts per week must be between ${GENERATION_LIMITS.MIN_POSTS_PER_WEEK} and ${GENERATION_LIMITS.MAX_POSTS_PER_WEEK}`,
                'postsPerWeek',
                {
                    provided: input.postsPerWeek,
                    min: GENERATION_LIMITS.MIN_POSTS_PER_WEEK,
                    max: GENERATION_LIMITS.MAX_POSTS_PER_WEEK
                }
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

        // Pre-validate frequency limits using centralized config
        const maxPostsPerSubreddit = GENERATION_LIMITS.MAX_POSTS_PER_SUBREDDIT;
        const maxPostsPerPersona = GENERATION_LIMITS.MAX_POSTS_PER_PERSONA;

        const postsPerSubreddit = Math.ceil(input.postsPerWeek / input.subreddits.length);
        const postsPerPersona = Math.ceil(input.postsPerWeek / input.personas.length);

        if (postsPerSubreddit > maxPostsPerSubreddit) {
            throw new FrequencyLimitError(
                `Too many posts per subreddit: ${postsPerSubreddit} (max: ${maxPostsPerSubreddit})`,
                maxPostsPerSubreddit,
                postsPerSubreddit,
                'subreddit'
            );
        }

        if (postsPerPersona > maxPostsPerPersona) {
            throw new FrequencyLimitError(
                `Too many posts per persona: ${postsPerPersona} (max: ${maxPostsPerPersona})`,
                maxPostsPerPersona,
                postsPerPersona,
                'persona'
            );
        }

        // Generate conversations in PARALLEL for speed
        const arcTypes = ['discovery', 'comparison', 'problemSolver'] as const;
        const MIN_QUALITY_THRESHOLD = 70; // Minimum acceptable quality (lowered from 75)
        const MAX_REGENERATION_ATTEMPTS = 1; // Reduced from 2 to 1 for speed

        console.log(`⚡ Starting parallel generation of ${input.postsPerWeek} conversations...`);
        console.log(`📋 Personas received (${input.personas.length}):`, input.personas.map(p => p.id));
        const startTime = Date.now();

        // PRE-ASSIGN personas for each conversation to ensure proper rotation
        // This avoids race conditions from parallel generation
        const personaAssignments: string[] = [];
        for (let i = 0; i < input.postsPerWeek; i++) {
            const personaIndex = i % input.personas.length;
            personaAssignments.push(input.personas[personaIndex].id);
        }
        console.log(`🎭 Persona assignments for ${input.postsPerWeek} posts:`, personaAssignments);

        // Create all generation promises with quality-gated regeneration
        const generationPromises = Array.from({ length: input.postsPerWeek }, async (_, i) => {
            const arcType = arcTypes[i % arcTypes.length];

            // Use diverse subreddit selection if we have context
            const subreddit = weekContext
                ? selectDiverseSubreddit(input.subreddits, weekContext)
                : input.subreddits[i % input.subreddits.length];

            // Get pre-assigned persona for this conversation
            const assignedPersonaId = personaAssignments[i];
            const assignedPersona = input.personas.find(p => p.id === assignedPersonaId)!;

            let bestConversation: ConversationThread | null = null;
            let bestScore = 0;

            // Try up to MAX_REGENERATION_ATTEMPTS times to get high quality
            for (let attempt = 0; attempt <= MAX_REGENERATION_ATTEMPTS; attempt++) {
                try {
                    // Generate base conversation with assigned persona as poster
                    const baseConversation = await generateConversationWithPersona(
                        arcType,
                        assignedPersona,
                        input.personas,
                        input.company,
                        subreddit,
                        input.keywords
                    );

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
                    const qualityScore = predictQuality(baseConversation as ConversationThread, input.company);

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

        console.error('Generation error:', error);

        // Use custom error response formatter
        const errorResponse = toErrorResponse(error);

        return NextResponse.json(
            errorResponse,
            { status: errorResponse.statusCode }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        {
            message: 'POST to this endpoint with GenerationInput to generate calendars',
            documentation: '/api/docs'
        },
        { status: 200 }
    );
}
