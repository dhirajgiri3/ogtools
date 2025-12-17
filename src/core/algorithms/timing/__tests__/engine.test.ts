import {
  selectRealisticPostTime,
  generateCommentTimings,
  generateReplyTimings,
  generateSchedule
} from '../engine';
import { SLIDEFORGE_PERSONAS } from '@/core/data/personas/slideforge';
import { Persona, ConversationThread } from '@/core/types';
import { getHour, isWeekend, getStartOfWeek } from '@/core/algorithms/timing/utils';
import { getPersonaTiming } from '@/core/data/personas/timing';

describe('Timing Engine', () => {

  const createMockConversation = (overrides = {}): Omit<ConversationThread, 'qualityScore'> & { qualityScore: any } => ({
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
    replies: [
      {
        id: 'reply-1',
        persona: SLIDEFORGE_PERSONAS[0],
        content: 'Test reply',
        scheduledTime: new Date(),
        parentCommentId: 'comment-1',
        replyType: 'op_followup'
      }
    ],
    arcType: 'discovery',
    qualityScore: null as any,
    subreddit: 'r/productivity',
    ...overrides
  });

  describe('selectRealisticPostTime', () => {

    test('returns date within the specified week', () => {
      const weekStart = new Date('2025-01-06T00:00:00Z'); // Monday
      const persona = SLIDEFORGE_PERSONAS[0];

      // Test multiple times since there's randomness
      for (let i = 0; i < 10; i++) {
        const postTime = selectRealisticPostTime(persona, weekStart);

        // Should be within same week (7 days)
        expect(postTime.getTime()).toBeGreaterThanOrEqual(weekStart.getTime());
        expect(postTime.getTime()).toBeLessThan(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
    });

    test('respects persona active hours', () => {
      const weekStart = new Date('2025-01-06T00:00:00Z');
      const persona = SLIDEFORGE_PERSONAS[0];
      const timing = getPersonaTiming(persona.id);

      // Test multiple times to check pattern
      for (let i = 0; i < 10; i++) {
        const postTime = selectRealisticPostTime(persona, weekStart);
        const hour = getHour(postTime);

        // Check hour is within active windows
        const isInActiveWindow = timing.activeHours.some(window => {
          if (window.end > 24) {
            return hour >= window.start || hour < (window.end - 24);
          }
          return hour >= window.start && hour < window.end;
        });

        expect(isInActiveWindow).toBe(true);
      }
    });

    test('handles weekend patterns (offline personas avoid weekends)', () => {
      const weekStart = new Date('2025-01-06T00:00:00Z'); // Monday

      // Find persona with offline weekend pattern
      const offlinePersona = SLIDEFORGE_PERSONAS.find(p => {
        const timing = getPersonaTiming(p.id);
        return timing.weekendPattern === 'offline';
      });

      if (offlinePersona) {
        // Test multiple times
        for (let i = 0; i < 10; i++) {
          const postTime = selectRealisticPostTime(offlinePersona, weekStart);

          // Should NOT be on weekend
          expect(isWeekend(postTime)).toBe(false);
        }
      } else {
        // If no offline persona, test passes (data-dependent)
        expect(true).toBe(true);
      }
    });

    test('shows variation across multiple runs (not deterministic)', () => {
      const weekStart = new Date('2025-01-06T00:00:00Z');
      const persona = SLIDEFORGE_PERSONAS[0];

      const times = new Set<number>();
      for (let i = 0; i < 10; i++) {
        const postTime = selectRealisticPostTime(persona, weekStart);
        times.add(postTime.getTime());
      }

      // Should have at least 3 unique times (showing randomness)
      expect(times.size).toBeGreaterThanOrEqual(3);
    });

  });

  describe('generateCommentTimings', () => {

    test('generates correct number of timings', () => {
      const postTime = new Date('2025-01-06T10:00:00Z');
      const templates = [
        { timingRange: { min: 15, max: 45 } },
        { timingRange: { min: 30, max: 90 } },
        { timingRange: { min: 45, max: 135 } }
      ];
      const personas = [
        SLIDEFORGE_PERSONAS[0],
        SLIDEFORGE_PERSONAS[1],
        SLIDEFORGE_PERSONAS[2]
      ];

      const timings = generateCommentTimings(postTime, templates, personas);

      expect(timings.length).toBe(3);
    });

    test('first comment is at least 5 minutes after post', () => {
      const postTime = new Date('2025-01-06T10:00:00Z');
      const templates = [
        { timingRange: { min: 1, max: 3 } } // Very short range to test minimum
      ];
      const personas = [SLIDEFORGE_PERSONAS[0]];

      // Test multiple times since there's randomness
      for (let i = 0; i < 10; i++) {
        const timings = generateCommentTimings(postTime, templates, personas);
        const firstCommentTime = timings[0];

        const delayMinutes = (firstCommentTime.getTime() - postTime.getTime()) / (1000 * 60);
        expect(delayMinutes).toBeGreaterThanOrEqual(5);
      }
    });

    test('comment timings increase over time', () => {
      const postTime = new Date('2025-01-06T10:00:00Z');
      const templates = [
        { timingRange: { min: 15, max: 45 } },
        { timingRange: { min: 30, max: 90 } },
        { timingRange: { min: 45, max: 135 } }
      ];
      const personas = [
        SLIDEFORGE_PERSONAS[0],
        SLIDEFORGE_PERSONAS[1],
        SLIDEFORGE_PERSONAS[2]
      ];

      const timings = generateCommentTimings(postTime, templates, personas);

      // Each timing should be after the previous one
      for (let i = 1; i < timings.length; i++) {
        expect(timings[i].getTime()).toBeGreaterThan(timings[i - 1].getTime());
      }
    });

    test('respects commenter persona active hours', () => {
      const postTime = new Date('2025-01-06T10:00:00Z');
      const templates = [{ timingRange: { min: 15, max: 45 } }];
      const persona = SLIDEFORGE_PERSONAS[0];
      const timing = getPersonaTiming(persona.id);

      // Test multiple times
      for (let i = 0; i < 5; i++) {
        const timings = generateCommentTimings(postTime, templates, [persona]);
        const commentTime = timings[0];
        const hour = getHour(commentTime);

        // Check hour is within active windows
        const isInActiveWindow = timing.activeHours.some(window => {
          if (window.end > 24) {
            return hour >= window.start || hour < (window.end - 24);
          }
          return hour >= window.start && hour < window.end;
        });

        expect(isInActiveWindow).toBe(true);
      }
    });

    test('shows timing variance across runs', () => {
      const postTime = new Date('2025-01-06T10:00:00Z');
      const templates = [{ timingRange: { min: 15, max: 45 } }];
      const persona = SLIDEFORGE_PERSONAS[0];

      const delays = new Set<number>();
      for (let i = 0; i < 10; i++) {
        const timings = generateCommentTimings(postTime, templates, [persona]);
        const delay = timings[0].getTime() - postTime.getTime();
        delays.add(delay);
      }

      // Should have at least 3 unique delays (showing variance)
      expect(delays.size).toBeGreaterThanOrEqual(3);
    });

  });

  describe('generateReplyTimings', () => {

    test('generates correct number of timings', () => {
      const templates = [
        { replyType: 'op_followup' as const },
        { replyType: 'commenter_elaboration' as const }
      ];
      const personas = [SLIDEFORGE_PERSONAS[0], SLIDEFORGE_PERSONAS[1]];
      const parentTimes = [
        new Date('2025-01-06T10:15:00Z'),
        new Date('2025-01-06T10:30:00Z')
      ];

      const timings = generateReplyTimings(templates, personas, parentTimes);

      expect(timings.length).toBe(2);
    });

    test('reply timings are at least 5 minutes after parent comment', () => {
      const templates = [{ replyType: 'op_followup' as const }];
      const personas = [SLIDEFORGE_PERSONAS[0]];
      const parentTimes = [new Date('2025-01-06T10:15:00Z')];

      // Test multiple times
      for (let i = 0; i < 10; i++) {
        const timings = generateReplyTimings(templates, personas, parentTimes);
        const replyTime = timings[0];

        const delayMinutes = (replyTime.getTime() - parentTimes[0].getTime()) / (1000 * 60);
        expect(delayMinutes).toBeGreaterThanOrEqual(5);
      }
    });

    test('OP replies faster than other commenters (on average)', () => {
      const opTemplate = [{ replyType: 'op_followup' as const }];
      const commenterTemplate = [{ replyType: 'commenter_elaboration' as const }];
      const persona = SLIDEFORGE_PERSONAS[0];
      const parentTime = [new Date('2025-01-06T10:15:00Z')];

      // Collect multiple samples
      const opDelays: number[] = [];
      const commenterDelays: number[] = [];

      for (let i = 0; i < 20; i++) {
        const opTimings = generateReplyTimings(opTemplate, [persona], parentTime);
        const opDelay = (opTimings[0].getTime() - parentTime[0].getTime()) / (1000 * 60);
        opDelays.push(opDelay);

        const commenterTimings = generateReplyTimings(commenterTemplate, [persona], parentTime);
        const commenterDelay = (commenterTimings[0].getTime() - parentTime[0].getTime()) / (1000 * 60);
        commenterDelays.push(commenterDelay);
      }

      // Calculate averages
      const avgOPDelay = opDelays.reduce((a, b) => a + b, 0) / opDelays.length;
      const avgCommenterDelay = commenterDelays.reduce((a, b) => a + b, 0) / commenterDelays.length;

      // OP should be faster on average
      expect(avgOPDelay).toBeLessThan(avgCommenterDelay);
    });

    test('respects persona active hours', () => {
      const templates = [{ replyType: 'op_followup' as const }];
      const persona = SLIDEFORGE_PERSONAS[0];
      const timing = getPersonaTiming(persona.id);
      const parentTimes = [new Date('2025-01-06T10:15:00Z')];

      // Test multiple times
      for (let i = 0; i < 5; i++) {
        const timings = generateReplyTimings(templates, [persona], parentTimes);
        const replyTime = timings[0];
        const hour = getHour(replyTime);

        // Check hour is within active windows
        const isInActiveWindow = timing.activeHours.some(window => {
          if (window.end > 24) {
            return hour >= window.start || hour < (window.end - 24);
          }
          return hour >= window.start && hour < window.end;
        });

        expect(isInActiveWindow).toBe(true);
      }
    });

  });

  describe('generateSchedule', () => {

    test('generates schedule for all conversations', () => {
      const conversations = [
        createMockConversation(),
        createMockConversation(),
        createMockConversation()
      ];
      const startDate = new Date('2025-01-06T00:00:00Z');
      const postsPerWeek = 3;

      const scheduled = generateSchedule(conversations, SLIDEFORGE_PERSONAS, startDate, postsPerWeek);

      expect(scheduled.length).toBe(3);
    });

    test('each scheduled conversation has required fields', () => {
      const conversations = [createMockConversation()];
      const startDate = new Date('2025-01-06T00:00:00Z');
      const postsPerWeek = 1;

      const scheduled = generateSchedule(conversations, SLIDEFORGE_PERSONAS, startDate, postsPerWeek);

      expect(scheduled[0].conversation).toBeDefined();
      expect(scheduled[0].scheduledTime).toBeDefined();
      expect(Array.isArray(scheduled[0].commentTimings)).toBe(true);
      expect(Array.isArray(scheduled[0].replyTimings)).toBe(true);
    });

    test('comment timings match number of comments', () => {
      const conversations = [createMockConversation({
        topLevelComments: [
          {
            id: 'comment-1',
            persona: SLIDEFORGE_PERSONAS[1],
            content: 'Test comment 1',
            scheduledTime: new Date(),
            replyTo: 'post',
            purpose: 'test',
            productMention: false
          },
          {
            id: 'comment-2',
            persona: SLIDEFORGE_PERSONAS[2],
            content: 'Test comment 2',
            scheduledTime: new Date(),
            replyTo: 'post',
            purpose: 'test',
            productMention: false
          }
        ]
      })];
      const startDate = new Date('2025-01-06T00:00:00Z');
      const postsPerWeek = 1;

      const scheduled = generateSchedule(conversations, SLIDEFORGE_PERSONAS, startDate, postsPerWeek);

      expect(scheduled[0].commentTimings.length).toBe(2);
    });

    test('reply timings match number of replies', () => {
      const conversations = [createMockConversation({
        topLevelComments: [
          {
            id: 'comment-1',
            persona: SLIDEFORGE_PERSONAS[1],
            content: 'Test comment 1',
            scheduledTime: new Date(),
            replyTo: 'post',
            purpose: 'test',
            productMention: false
          },
          {
            id: 'comment-2',
            persona: SLIDEFORGE_PERSONAS[2],
            content: 'Test comment 2',
            scheduledTime: new Date(),
            replyTo: 'post',
            purpose: 'test',
            productMention: false
          }
        ],
        replies: [
          {
            id: 'reply-1',
            persona: SLIDEFORGE_PERSONAS[0],
            content: 'Test reply 1',
            scheduledTime: new Date(),
            parentCommentId: 'comment-1',
            replyType: 'op_followup'
          },
          {
            id: 'reply-2',
            persona: SLIDEFORGE_PERSONAS[1],
            content: 'Test reply 2',
            scheduledTime: new Date(),
            parentCommentId: 'comment-2',
            replyType: 'commenter_elaboration'
          }
        ]
      })];
      const startDate = new Date('2025-01-06T00:00:00Z');
      const postsPerWeek = 1;

      const scheduled = generateSchedule(conversations, SLIDEFORGE_PERSONAS, startDate, postsPerWeek);

      expect(scheduled[0].replyTimings.length).toBe(2);
    });

    test('scheduled times are sorted chronologically', () => {
      const conversations = [
        createMockConversation(),
        createMockConversation(),
        createMockConversation()
      ];
      const startDate = new Date('2025-01-06T00:00:00Z');
      const postsPerWeek = 3;

      const scheduled = generateSchedule(conversations, SLIDEFORGE_PERSONAS, startDate, postsPerWeek);

      // Check that scheduled times are in ascending order
      for (let i = 1; i < scheduled.length; i++) {
        expect(scheduled[i].scheduledTime.getTime()).toBeGreaterThanOrEqual(
          scheduled[i - 1].scheduledTime.getTime()
        );
      }
    });

    test('post times are distributed across the week (not clustered)', () => {
      const conversations = Array(5).fill(null).map(() => createMockConversation());
      const startDate = new Date('2025-01-06T00:00:00Z'); // Monday
      const postsPerWeek = 5;

      const scheduled = generateSchedule(conversations, SLIDEFORGE_PERSONAS, startDate, postsPerWeek);

      // Extract days of week
      const days = scheduled.map(s => s.scheduledTime.getDay());
      const uniqueDays = new Set(days);

      // Should use at least 3 different days (not all on same day)
      expect(uniqueDays.size).toBeGreaterThanOrEqual(3);
    });

    test('all timings are within reasonable bounds', () => {
      const conversations = [createMockConversation()];
      const startDate = new Date('2025-01-06T00:00:00Z');
      const postsPerWeek = 1;

      const scheduled = generateSchedule(conversations, SLIDEFORGE_PERSONAS, startDate, postsPerWeek);

      const postTime = scheduled[0].scheduledTime;
      const commentTimes = scheduled[0].commentTimings;
      const replyTimes = scheduled[0].replyTimings;

      // Comments should be after post
      commentTimes.forEach(commentTime => {
        expect(commentTime.getTime()).toBeGreaterThan(postTime.getTime());
      });

      // Replies should be after comments (at least after first comment)
      if (replyTimes.length > 0 && commentTimes.length > 0) {
        replyTimes.forEach(replyTime => {
          expect(replyTime.getTime()).toBeGreaterThan(commentTimes[0].getTime());
        });
      }
    });

    test('handles different postsPerWeek values', () => {
      const testCases = [1, 3, 5, 7, 10];

      testCases.forEach(postsPerWeek => {
        const conversations = Array(postsPerWeek).fill(null).map(() => createMockConversation());
        const startDate = new Date('2025-01-06T00:00:00Z');

        const scheduled = generateSchedule(conversations, SLIDEFORGE_PERSONAS, startDate, postsPerWeek);

        expect(scheduled.length).toBe(postsPerWeek);
        // Should all be Date objects
        scheduled.forEach(s => {
          expect(s.scheduledTime instanceof Date).toBe(true);
        });
      });
    });

  });

});
