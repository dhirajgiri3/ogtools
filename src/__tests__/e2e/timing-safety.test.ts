import { generateSchedule } from '@/core/algorithms/timing/engine';
import { validateSafety } from '@/core/algorithms/safety/validator';
import { SLIDEFORGE_PERSONAS } from '@/core/data/personas/slideforge';

describe('Timing + Safety Integration', () => {

    test('realistic timing passes safety checks', () => {
        // Create conversations with proper timing
        const conversations = Array(5).fill(null).map((_, i) => ({
            id: `test-${i}`,
            post: {
                id: `post-${i}`,
                persona: SLIDEFORGE_PERSONAS[i % SLIDEFORGE_PERSONAS.length],
                subreddit: 'r/productivity',
                content: 'Test post',
                emotion: 'curiosity' as const,
                keywords: ['test'],
                scheduledTime: new Date()
            },
            topLevelComments: [
                {
                    id: `comment-${i}-1`,
                    persona: SLIDEFORGE_PERSONAS[(i + 1) % SLIDEFORGE_PERSONAS.length],
                    content: 'Test comment',
                    scheduledTime: new Date(),
                    replyTo: 'post' as const,
                    purpose: 'test',
                    productMention: false
                }
            ],
            replies: [],
            arcType: 'discovery' as const,
            qualityScore: null!,
            subreddit: 'r/productivity'
        }));

        // Start date in future to ensure clean scheduling
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(10, 0, 0, 0);

        const scheduled = generateSchedule(conversations, SLIDEFORGE_PERSONAS, startDate, 3);

        // Helper to create safe history
        const createSafeHistory = (id: string, overrides = {}) => ({
            personaId: id,
            accountAge: 90,
            karma: 150,
            commentHistory: [],
            postHistory: [],
            subredditActivity: new Map<string, number>(), // Fixed: explicitly typed Map
            productMentions: 0,
            lastProductMention: null,
            riskLevel: 'trusted' as const,
            ...overrides
        });

        const histories = SLIDEFORGE_PERSONAS.map(p => createSafeHistory(p.id));

        const report = validateSafety(scheduled, SLIDEFORGE_PERSONAS, histories);

        // Should pass timing checks
        if (report.violations.some(v => v.type.includes('timing'))) {
            console.log('Timing violations:', report.violations.filter(v => v.type.includes('timing')));
        }

        // We specifically check that timing realism passed
        // Note: If other checks fail (like product mention frequency), that's fine for this specific test
        // but the test in the guide expects 0 timing violations.
        expect(report.violations.filter(v => v.type.includes('timing')).length).toBe(0);
    });

    test('unrealistic timing fails safety checks', () => {
        const postTime = new Date('2025-01-01T10:00:00Z');
        const tooFastCommentTime = new Date('2025-01-01T10:01:00Z'); // 1 min later!

        const scheduled = [{
            conversation: {
                id: 'test',
                post: {
                    id: 'p1',
                    persona: SLIDEFORGE_PERSONAS[0],
                    subreddit: 'r/productivity',
                    content: 'Test',
                    emotion: 'curiosity' as const,
                    keywords: [],
                    scheduledTime: postTime
                },
                topLevelComments: [{
                    id: 'c1',
                    persona: SLIDEFORGE_PERSONAS[1],
                    content: 'Test',
                    scheduledTime: tooFastCommentTime,
                    replyTo: 'post' as const,
                    purpose: 'test',
                    productMention: false
                }],
                replies: [],
                arcType: 'discovery' as const,
                qualityScore: null!,
                subreddit: 'r/productivity'
            },
            scheduledTime: postTime,
            commentTimings: [tooFastCommentTime],
            replyTimings: []
        }];

        const histories = [{
            personaId: 'riley_ops',
            accountAge: 90,
            karma: 150,
            commentHistory: [],
            postHistory: [],
            subredditActivity: new Map(),
            productMentions: 0,
            lastProductMention: null,
            riskLevel: 'trusted' as const
        }];

        // Note: validateSafety iterates over personas. 
        // If we only pass 1 history but multiple personas exist in SLIDEFORGE_PERSONAS, it might default others?
        // The implementation iterates `personas`.
        // "checkAccountReadiness(accountHistories)" iterates the histories passed.
        // So if we pass 1 history, it checks 1 account.

        const report = validateSafety(scheduled, SLIDEFORGE_PERSONAS, histories);

        // Should fail timing check
        expect(report.violations.some(v => v.type === 'timing_unrealistic')).toBe(true);
        // Optional: check details contains the specific reason
        const timingViolation = report.violations.find(v => v.type === 'timing_unrealistic');
        expect(timingViolation?.fix).toContain('too fast');
    });
});
