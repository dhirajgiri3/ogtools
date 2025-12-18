import { NextRequest, NextResponse } from 'next/server';
import {
    GenerationInput,
    WeekCalendar,
    ConversationThread
} from '@/core/types';
import { generateConversationWithPersona } from '@/core/algorithms/conversation/designer';
import { injectAuthenticity } from '@/core/algorithms/authenticity/engine';
import { predictQuality } from '@/core/algorithms/quality/predictor';
import { generateSchedule, applyScheduleToConversation } from '@/core/algorithms/timing/engine';
import { validateSafety } from '@/core/algorithms/safety/validator';
import { GENERATION_LIMITS } from '@/config/constants';
import {
    ValidationError,
    toErrorResponse,
    FrequencyLimitError
} from '@/core/errors';
import { extractWeekContext, selectDiverseSubreddit } from '@/core/algorithms/timing/week-context';
import { extractCompanyActivities } from '@/core/algorithms/company/activity-extractor';
import { generateRateLimiter, getClientIdentifier, formatResetTime } from '@/shared/lib/rate-limit';

/**
 * POST /api/generate
 * 
 * Main generation endpoint for creating Reddit content calendars.
 * Rate limited to 10 requests per hour per client.
 */

export async function POST(req: NextRequest) {
    try {
        // Apply rate limiting
        const clientId = getClientIdentifier(req);
        const rateLimitResult = generateRateLimiter.check(clientId);

        if (!rateLimitResult.allowed) {
            const resetIn = formatResetTime(rateLimitResult.resetTime);
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded',
                    message: `You have exceeded the maximum of 10 generation requests per hour. Please try again in ${resetIn}.`,
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
                    resetTime: new Date(rateLimitResult.resetTime).toISOString(),
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': '10',
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
                        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
                    },
                }
            );
        }

        // Add rate limit headers to successful responses
        const rateLimitHeaders = {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        };

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

        // If activities are missing (first time setup), extract them

        if (!input.company.activities || input.company.activities.length === 0) {

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

        // Initialize simple usage tracking
        const {
            createUsageTracker,
            selectBalancedPersona,
            selectBalancedSubreddit,
            trackUsage,
            getDistributionMetrics
        } = await import('@/core/algorithms/timing/engine');

        const usage = createUsageTracker();

        // Track recently used
        const recentPersonas: string[] = [];
        const recentSubreddits: string[] = [];

        // Create all generation promises with quality-gated regeneration
        const generationPromises = Array.from({ length: input.postsPerWeek }, async (_, i) => {
            const arcType = arcTypes[i % arcTypes.length];

            // Select using simple least-used logic
            const selectedPersona = selectBalancedPersona(
                input.personas,
                usage,
                i,
                recentPersonas.slice(-2)
            );

            const subreddit = selectBalancedSubreddit(
                input.subreddits,
                usage,
                selectedPersona.id,
                recentSubreddits.slice(-2)
            );

            // Track usage
            trackUsage(usage, selectedPersona.id, subreddit, i);

            // Update recent usage
            recentPersonas.push(selectedPersona.id);
            recentSubreddits.push(subreddit);
            if (recentPersonas.length > 3) recentPersonas.shift();
            if (recentSubreddits.length > 3) recentSubreddits.shift();

            console.log(`📝 Post ${i + 1}: ${selectedPersona.name} → r/${subreddit} (${arcType})`);


            let bestConversation: ConversationThread | null = null;
            let bestScore = 0;

            // Try up to MAX_REGENERATION_ATTEMPTS times to get high quality
            for (let attempt = 0; attempt <= MAX_REGENERATION_ATTEMPTS; attempt++) {
                try {
                    // Generate base conversation with selected persona as poster
                    const baseConversation = await generateConversationWithPersona(
                        arcType,
                        selectedPersona,
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

        // Get simple distribution metrics
        const distributionMetrics = getDistributionMetrics(usage, conversations.length);

        console.log(`📊 Distribution metrics:`, {
            diversityScore: distributionMetrics.diversityScore.toFixed(2),
            combinationDiversity: distributionMetrics.combinationDiversity.toFixed(2),
            personaBalance: distributionMetrics.personaBalance,
            subredditBalance: distributionMetrics.subredditBalance
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
                subredditDistribution: subredditDistObj as any,
                personaUsage: personaUsageObj as any,
                distributionMetrics
            }
        };

        return NextResponse.json(calendar, {
            headers: rateLimitHeaders,
        });

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
