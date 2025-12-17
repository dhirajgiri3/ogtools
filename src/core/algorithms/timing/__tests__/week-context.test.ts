import {
    extractWeekContext,
    selectDiversePersonas,
    selectDiverseSubreddit,
    isTopicTooSimilar,
    hasReachedProductMentionLimit
} from '@/core/algorithms/timing/week-context';
import { WeekCalendar, Persona } from '@/core/types';

describe('Week Context Utility', () => {
    const mockPersona1: Persona = {
        id: 'riley_ops',
        name: 'Riley Hart',
        role: 'Head of Operations',
        backstory: 'Test backstory',
        vocabulary: {
            characteristic: ['honestly', 'literally'],
            avoid: ['fundamentally'],
            formality: 0.4
        },
        communicationStyle: {
            default: 'casual',
            acceptable: ['lol', 'tbh']
        },
        redditPattern: 'periodic_checker',
        experienceLevel: 'medium',
        interests: ['productivity', 'operations']
    };

    const mockPersona2: Persona = {
        id: 'jordan_brooks',
        name: 'Jordan Brooks',
        role: 'Consultant',
        backstory: 'Test backstory',
        vocabulary: {
            characteristic: ['in my experience'],
            avoid: ['basically'],
            formality: 0.6
        },
        communicationStyle: {
            default: 'professional',
            acceptable: ['IMO']
        },
        redditPattern: 'always_online',
        experienceLevel: 'high',
        interests: ['consulting', 'strategy']
    };

    const mockWeek1: WeekCalendar = {
        weekNumber: 1,
        conversations: [
            {
                conversation: {
                    id: 'conv1',
                    post: {
                        id: 'post1',
                        persona: mockPersona1,
                        subreddit: 'r/productivity',
                        content: 'I spent 4 hours yesterday working on presentation slides and it was so frustrating',
                        emotion: 'frustration',
                        keywords: ['presentation', 'slides'],
                        scheduledTime: new Date()
                    },
                    topLevelComments: [
                        {
                            id: 'comment1',
                            persona: mockPersona2,
                            content: 'I feel this',
                            scheduledTime: new Date(),
                            replyTo: 'post',
                            purpose: 'validate_problem',
                            productMention: false
                        },
                        {
                            id: 'comment2',
                            persona: mockPersona2,
                            content: 'I started using SlideForge for this',
                            scheduledTime: new Date(),
                            replyTo: 'post',
                            purpose: 'tool_mention',
                            productMention: true
                        }
                    ],
                    replies: [],
                    arcType: 'discovery',
                    qualityScore: {
                        overall: 85,
                        dimensions: {
                            subredditRelevance: 18,
                            problemSpecificity: 17,
                            authenticity: 22,
                            valueFirst: 16,
                            engagementDesign: 12
                        },
                        grade: 'good',
                        issues: [],
                        strengths: [],
                        suggestions: []
                    },
                    subreddit: 'r/productivity'
                },
                scheduledTime: new Date(),
                commentTimings: [new Date(), new Date()],
                replyTimings: []
            }
        ],
        averageQuality: 85,
        safetyReport: {
            passed: true,
            overallRisk: 'low',
            checks: {
                accountReadiness: { passed: true, score: 1, details: 'OK' },
                frequencyLimits: { passed: true, score: 1, details: 'OK' },
                timingRealism: { passed: true, score: 1, details: 'OK' },
                collusionPatterns: { passed: true, score: 1, details: 'OK' },
                contentSimilarity: { passed: true, score: 1, details: 'OK' }
            },
            violations: [],
            warnings: [],
            recommendations: []
        },
        metadata: {
            generatedAt: new Date(),
            totalConversations: 1,
            subredditDistribution: new Map([['r/productivity', 1]]),
            personaUsage: new Map([['riley_ops', 1]])
        }
    };

    describe('extractWeekContext', () => {
        it('should extract topics from previous weeks', () => {
            const context = extractWeekContext([mockWeek1]);

            expect(context.usedTopics.length).toBeGreaterThan(0);
            expect(context.recentPosts).toContain(mockWeek1.conversations[0].conversation.post.content);
        });

        it('should track persona usage', () => {
            const context = extractWeekContext([mockWeek1]);

            expect(context.personaUsage.get('riley_ops')).toBe(1);
        });

        it('should track subreddit usage', () => {
            const context = extractWeekContext([mockWeek1]);

            expect(context.subredditUsage.get('r/productivity')).toBe(1);
        });

        it('should track product mentions by persona', () => {
            const context = extractWeekContext([mockWeek1]);

            expect(context.productMentionsByPersona.get('jordan_brooks')).toBe(1);
        });

        it('should handle empty previous weeks', () => {
            const context = extractWeekContext([]);

            expect(context.usedTopics).toEqual([]);
            expect(context.personaUsage.size).toBe(0);
            expect(context.subredditUsage.size).toBe(0);
        });
    });

    describe('selectDiversePersonas', () => {
        it('should prefer underused personas', () => {
            const context = extractWeekContext([mockWeek1]);
            const personas = [mockPersona1, mockPersona2];

            const selected = selectDiversePersonas(personas, context, 1);

            // Both personas used equally (1 post, 0 product mentions counted for persona1; 0 posts for persona2)
            // The function sorts by usage - persona2 has 0 posts so comes first
            expect(selected).toHaveLength(1);
            expect(selected[0].id).toBe('jordan_brooks');
        });

        it('should return requested count', () => {
            const context = extractWeekContext([mockWeek1]);
            const personas = [mockPersona1, mockPersona2];

            const selected = selectDiversePersonas(personas, context, 2);

            expect(selected).toHaveLength(2);
        });
    });

    describe('selectDiverseSubreddit', () => {
        it('should prefer underused subreddits', () => {
            const context = extractWeekContext([mockWeek1]);
            const subreddits = ['r/productivity', 'r/consulting'];

            const selected = selectDiverseSubreddit(subreddits, context);

            // r/consulting was not used, so it should be selected
            expect(selected).toBe('r/consulting');
        });
    });

    describe('isTopicTooSimilar', () => {
        it('should detect similar topics with word overlap', () => {
            // Manually create context with known topic
            const context = {
                usedTopics: ['working on presentation slides'],
                personaUsage: new Map(),
                subredditUsage: new Map(),
                recentPosts: [],
                productMentionsByPersona: new Map()
            };

            // Test with similar topic (word overlap)
            const similar = isTopicTooSimilar('working on presentation deck', context, 0.5);

            // Should be similar - "working", "on", "presentation" overlap (3/5 = 0.6 > 0.5)
            expect(similar).toBe(true);
        });

        it('should allow different topics', () => {
            const context = extractWeekContext([mockWeek1]);

            const similar = isTopicTooSimilar('database optimization strategies', context);

            expect(similar).toBe(false);
        });
    });

    describe('hasReachedProductMentionLimit', () => {
        it('should detect when limit is reached', () => {
            const context = extractWeekContext([mockWeek1]);

            const reached = hasReachedProductMentionLimit('jordan_brooks', context, 1);

            expect(reached).toBe(true);
        });

        it('should allow mentions when under limit', () => {
            const context = extractWeekContext([mockWeek1]);

            const reached = hasReachedProductMentionLimit('riley_ops', context, 1);

            expect(reached).toBe(false);
        });
    });
});
