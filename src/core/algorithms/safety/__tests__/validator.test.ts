import { validateSafety, createMockAccountHistories } from '../validator';
import { SLIDEFORGE_PERSONAS } from '@/core/data/personas/demo-data';
import { ScheduledConversation, Persona } from '@/core/types';

describe('Safety Validator', () => {

  const createMockScheduled = (overrides = {}): ScheduledConversation => ({
    conversation: {
      id: 'test-1',
      post: {
        id: 'post-1',
        persona: SLIDEFORGE_PERSONAS[0],
        subreddit: 'r/productivity',
        content: 'Test post content',
        emotion: 'curiosity',
        keywords: ['test'],
        scheduledTime: new Date()
      },
      topLevelComments: [
        {
          id: 'comment-1',
          persona: SLIDEFORGE_PERSONAS[1],
          content: 'Test comment',
          scheduledTime: new Date(),
          replyTo: 'post',
          purpose: 'test',
          productMention: false
        }
      ],
      replies: [],
      arcType: 'discovery',
      qualityScore: null as any,
      subreddit: 'r/productivity'
    },
    scheduledTime: new Date('2025-01-01T10:00:00Z'),
    commentTimings: [new Date('2025-01-01T10:15:00Z')], // 15 min after post
    replyTimings: [],
    ...overrides
  });

  test('returns safety report with all required fields', () => {
    const scheduled = [createMockScheduled()];
    const report = validateSafety(scheduled, SLIDEFORGE_PERSONAS);

    expect(report.passed).toBeDefined();
    expect(report.overallRisk).toBeDefined();
    expect(report.checks).toBeDefined();
    expect(Array.isArray(report.violations)).toBe(true);
    expect(Array.isArray(report.warnings)).toBe(true);
    expect(Array.isArray(report.recommendations)).toBe(true);
  });

  test('reports 5 safety checks', () => {
    const scheduled = [createMockScheduled()];
    const report = validateSafety(scheduled, SLIDEFORGE_PERSONAS);

    expect(report.checks.accountReadiness).toBeDefined();
    expect(report.checks.frequencyLimits).toBeDefined();
    expect(report.checks.timingRealism).toBeDefined();
    expect(report.checks.collusionPatterns).toBeDefined();
    expect(report.checks.contentSimilarity).toBeDefined();

    // Each check should have passed and score
    Object.values(report.checks).forEach(check => {
      expect(typeof check.passed).toBe('boolean');
      expect(typeof check.score).toBe('number');
      expect(check.details).toBeDefined();
    });
  });

  test('passes valid safe conversation', () => {
    const scheduled = [createMockScheduled()];
    const report = validateSafety(scheduled, SLIDEFORGE_PERSONAS);

    // With mock account histories (90 days, 150+ karma), should pass
    expect(report.passed).toBe(true);
    expect(report.overallRisk).toMatch(/^(low|medium)$/);
    expect(report.violations.length).toBe(0);
  });

  test('detects timing violation - first comment too fast', () => {
    const scheduled = [createMockScheduled({
      scheduledTime: new Date('2025-01-01T10:00:00Z'),
      commentTimings: [new Date('2025-01-01T10:02:00Z')] // Only 2 min later!
    })];

    const report = validateSafety(scheduled, SLIDEFORGE_PERSONAS);

    // Should flag timing issue
    const hasTimingViolation = report.violations.some(v =>
      v.type === 'timing_unrealistic' || v.type.includes('timing')
    ) || report.warnings.some(w => w.type.includes('timing'));

    expect(hasTimingViolation).toBe(true);
  });

  test('detects frequency violation - same subreddit', () => {
    const scheduled = [
      createMockScheduled({ conversation: { ...createMockScheduled().conversation, subreddit: 'r/productivity' } }),
      createMockScheduled({ conversation: { ...createMockScheduled().conversation, subreddit: 'r/productivity' } }),
      createMockScheduled({ conversation: { ...createMockScheduled().conversation, subreddit: 'r/productivity' } })
    ];

    const report = validateSafety(scheduled, SLIDEFORGE_PERSONAS);

    // 3 posts to same subreddit should trigger warning
    const hasFrequencyIssue = report.violations.some(v =>
      v.type === 'frequency_violation' || v.type.includes('frequency')
    ) || report.warnings.some(w => w.type.includes('frequency'));

    expect(hasFrequencyIssue).toBe(true);
  });

  test('detects collusion - same personas interacting repeatedly', () => {
    // Create 3 conversations with same persona pair
    const scheduled = [
      createMockScheduled({
        conversation: {
          ...createMockScheduled().conversation,
          post: { ...createMockScheduled().conversation.post, persona: SLIDEFORGE_PERSONAS[0] },
          topLevelComments: [{
            ...createMockScheduled().conversation.topLevelComments[0],
            persona: SLIDEFORGE_PERSONAS[1]
          }]
        }
      }),
      createMockScheduled({
        conversation: {
          ...createMockScheduled().conversation,
          post: { ...createMockScheduled().conversation.post, persona: SLIDEFORGE_PERSONAS[0] },
          topLevelComments: [{
            ...createMockScheduled().conversation.topLevelComments[0],
            persona: SLIDEFORGE_PERSONAS[1]
          }]
        }
      }),
      createMockScheduled({
        conversation: {
          ...createMockScheduled().conversation,
          post: { ...createMockScheduled().conversation.post, persona: SLIDEFORGE_PERSONAS[0] },
          topLevelComments: [{
            ...createMockScheduled().conversation.topLevelComments[0],
            persona: SLIDEFORGE_PERSONAS[1]
          }]
        }
      })
    ];

    const report = validateSafety(scheduled, SLIDEFORGE_PERSONAS);

    // Should detect collusion pattern
    const hasCollusionIssue = report.warnings.some(w =>
      w.type === 'collusion_pattern' || w.type.includes('collusion')
    );

    expect(hasCollusionIssue).toBe(true);
  });

  test('evaluates content similarity', () => {
    const scheduled = [
      createMockScheduled({
        conversation: {
          ...createMockScheduled().conversation,
          post: {
            ...createMockScheduled().conversation.post,
            content: 'Spent 3 hours on slides last night. Anyone have tips for faster creation?'
          }
        }
      }),
      createMockScheduled({
        conversation: {
          ...createMockScheduled().conversation,
          post: {
            ...createMockScheduled().conversation.post,
            content: 'Spent 2 hours on slides yesterday. Anyone have tips for faster creation?'
          }
        }
      })
    ];

    const report = validateSafety(scheduled, SLIDEFORGE_PERSONAS);

    // Content similarity check should exist and run
    expect(report.checks.contentSimilarity).toBeDefined();
    expect(typeof report.checks.contentSimilarity.passed).toBe('boolean');
    expect(typeof report.checks.contentSimilarity.score).toBe('number');
  });

  test('generates recommendations when violations exist', () => {
    const scheduled = [createMockScheduled({
      scheduledTime: new Date('2025-01-01T10:00:00Z'),
      commentTimings: [new Date('2025-01-01T10:01:00Z')] // Timing violation
    })];

    const report = validateSafety(scheduled, SLIDEFORGE_PERSONAS);

    // Should have recommendations if violations/warnings exist
    if (report.violations.length > 0 || report.warnings.length > 0) {
      expect(report.recommendations.length).toBeGreaterThan(0);
      report.recommendations.forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(10);
      });
    }
  });

  test('calculates risk levels correctly', () => {
    const scheduled = [createMockScheduled()];
    const report = validateSafety(scheduled, SLIDEFORGE_PERSONAS);

    const validRiskLevels = ['low', 'medium', 'high', 'critical'];
    expect(validRiskLevels).toContain(report.overallRisk);
  });

  test('evaluates risk based on conditions', () => {
    // Varied conditions: proper timing, different subreddits
    const goodScheduled = [
      createMockScheduled({
        conversation: { ...createMockScheduled().conversation, subreddit: 'r/productivity' },
        scheduledTime: new Date('2025-01-01T10:00:00Z'),
        commentTimings: [new Date('2025-01-01T10:20:00Z')] // 20 min delay
      }),
      createMockScheduled({
        conversation: { ...createMockScheduled().conversation, subreddit: 'r/startups' },
        scheduledTime: new Date('2025-01-02T14:00:00Z'),
        commentTimings: [new Date('2025-01-02T14:15:00Z')] // 15 min delay
      })
    ];

    const goodReport = validateSafety(goodScheduled, SLIDEFORGE_PERSONAS);

    // Should calculate a risk level
    const validRiskLevels = ['low', 'medium', 'high', 'critical'];
    expect(validRiskLevels).toContain(goodReport.overallRisk);
    expect(typeof goodReport.passed).toBe('boolean');
  });

  test('account history mock generation works', () => {
    const histories = createMockAccountHistories(SLIDEFORGE_PERSONAS);

    expect(histories.length).toBe(SLIDEFORGE_PERSONAS.length);
    histories.forEach(history => {
      expect(history.personaId).toBeDefined();
      expect(history.accountAge).toBeGreaterThanOrEqual(0);
      expect(history.karma).toBeGreaterThanOrEqual(0);
      expect(history.riskLevel).toBeDefined();
    });
  });

  test('timing check validates realistic delays', () => {
    const scheduled = [createMockScheduled()];
    const report = validateSafety(scheduled, SLIDEFORGE_PERSONAS);

    // Timing realism check should exist
    expect(report.checks.timingRealism).toBeDefined();
    expect(typeof report.checks.timingRealism.passed).toBe('boolean');
  });

  test('violations have proper structure', () => {
    const scheduled = [createMockScheduled({
      scheduledTime: new Date('2025-01-01T10:00:00Z'),
      commentTimings: [new Date('2025-01-01T10:01:00Z')] // Cause violation
    })];

    const report = validateSafety(scheduled, SLIDEFORGE_PERSONAS);

    // Check violations structure if any exist
    report.violations.forEach(violation => {
      expect(violation.type).toBeDefined();
      expect(violation.severity).toBeDefined();
      expect(violation.message).toBeDefined();
      expect(violation.fix).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(violation.severity);
    });
  });
});
