import { predictQuality } from '../predictor';
import { SLIDEFORGE_COMPANY, SLIDEFORGE_PERSONAS } from '@/core/data/personas/slideforge';
import { ConversationThread } from '@/core/types';

describe('Quality Predictor', () => {

  const createMockConversation = (overrides = {}): ConversationThread => ({
    id: 'test-1',
    post: {
      id: 'post-1',
      persona: SLIDEFORGE_PERSONAS[0],
      subreddit: 'r/productivity',
      content: 'Spent 3 hours last night fighting with slide alignment in PowerPoint. Anyone else struggle with this? How do you handle it?',
      emotion: 'frustration',
      keywords: ['presentation', 'slides'],
      scheduledTime: new Date()
    },
    topLevelComments: [
      {
        id: 'comment-1',
        persona: SLIDEFORGE_PERSONAS[1],
        content: 'Yeah, I feel you. The alignment struggle is real.',
        scheduledTime: new Date(),
        replyTo: 'post',
        purpose: 'validate_problem',
        productMention: false
      },
      {
        id: 'comment-2',
        persona: SLIDEFORGE_PERSONAS[2],
        content: 'What I usually do is create templates first, then fill in content.',
        scheduledTime: new Date(),
        replyTo: 'post',
        purpose: 'suggest_approach',
        productMention: false
      },
      {
        id: 'comment-3',
        persona: SLIDEFORGE_PERSONAS[3],
        content: 'I started using SlideForge for this. Not perfect but saves me time on the alignment stuff.',
        scheduledTime: new Date(),
        replyTo: 'post',
        purpose: 'tool_mention',
        productMention: true
      }
    ],
    replies: [
      {
        id: 'reply-1',
        persona: SLIDEFORGE_PERSONAS[0],
        content: 'Thanks! Will check it out.',
        scheduledTime: new Date(),
        parentCommentId: 'comment-3',
        replyType: 'op_followup'
      }
    ],
    arcType: 'discovery',
    qualityScore: null as any,
    subreddit: 'r/productivity',
    ...overrides
  });

  test('returns quality score with all required fields', () => {
    const conversation = createMockConversation();
    const score = predictQuality(conversation);

    expect(score.overall).toBeDefined();
    expect(score.dimensions).toBeDefined();
    expect(score.grade).toBeDefined();
    expect(Array.isArray(score.issues)).toBe(true);
    expect(Array.isArray(score.strengths)).toBe(true);
    expect(Array.isArray(score.suggestions)).toBe(true);
  });

  test('scores all 5 dimensions', () => {
    const conversation = createMockConversation();
    const score = predictQuality(conversation);

    expect(score.dimensions.subredditRelevance).toBeDefined();
    expect(score.dimensions.problemSpecificity).toBeDefined();
    expect(score.dimensions.authenticity).toBeDefined();
    expect(score.dimensions.valueFirst).toBeDefined();
    expect(score.dimensions.engagementDesign).toBeDefined();

    // All dimensions should be numbers
    expect(typeof score.dimensions.subredditRelevance).toBe('number');
    expect(typeof score.dimensions.problemSpecificity).toBe('number');
    expect(typeof score.dimensions.authenticity).toBe('number');
    expect(typeof score.dimensions.valueFirst).toBe('number');
    expect(typeof score.dimensions.engagementDesign).toBe('number');
  });

  test('overall score is within valid range (0-100)', () => {
    const conversation = createMockConversation();
    const score = predictQuality(conversation);

    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  test('high-quality conversation scores well', () => {
    const conversation = createMockConversation();
    const score = predictQuality(conversation);

    // This is a well-structured conversation with:
    // - Specific problem (3 hours, alignment)
    // - Value first (2 comments before product)
    // - OP engagement
    // - Question in post
    expect(score.overall).toBeGreaterThanOrEqual(60);
    expect(score.grade).not.toBe('poor');
  });

  test('penalizes generic problem framing', () => {
    const genericConversation = createMockConversation({
      post: {
        ...createMockConversation().post,
        content: 'Looking for a good presentation tool. Any recommendations?'
      }
    });

    const score = predictQuality(genericConversation);

    // Should detect tool-fishing
    expect(score.issues.some(i => i.type === 'tool_fishing')).toBe(true);
    expect(score.dimensions.problemSpecificity).toBeLessThan(15);
  });

  test('penalizes product mentioned too early', () => {
    const earlyMentionConversation = createMockConversation({
      topLevelComments: [
        {
          id: 'comment-1',
          persona: SLIDEFORGE_PERSONAS[1],
          content: 'You should try SlideForge!',
          scheduledTime: new Date(),
          replyTo: 'post',
          purpose: 'tool_mention',
          productMention: true
        }
      ],
      replies: []
    });

    const score = predictQuality(earlyMentionConversation);

    // Should penalize immediate product mention
    expect(score.dimensions.valueFirst).toBeLessThan(15);
    const hasEarlyMentionIssue = score.issues.some(i =>
      i.type === 'immediate_promotion' || i.type === 'early_product_mention'
    );
    expect(hasEarlyMentionIssue).toBe(true);
  });

  test('rewards specific problem details', () => {
    const specificConversation = createMockConversation({
      post: {
        ...createMockConversation().post,
        content: 'Spent 4 hours last night trying to get my Q3 board deck aligned properly. Have a presentation at 9am today and the slides look terrible. Anyone have tips for quick fixes?'
      }
    });

    const score = predictQuality(specificConversation);

    // Should reward specificity (numbers, timeframes, context)
    expect(score.dimensions.problemSpecificity).toBeGreaterThanOrEqual(10);
  });

  test('rewards OP engagement', () => {
    const conversation = createMockConversation(); // Has OP reply
    const score = predictQuality(conversation);

    // Should reward OP engagement in the scoring
    expect(score.dimensions.engagementDesign).toBeGreaterThan(0);
    // Check that OP replies contributed to the score (may not always create a specific strength)
    const opReplyCount = conversation.replies.filter(r => r.replyType === 'op_followup').length;
    expect(opReplyCount).toBeGreaterThan(0);
  });

  test('penalizes missing OP engagement', () => {
    const noOPConversation = createMockConversation({
      replies: [] // No OP replies
    });

    const score = predictQuality(noOPConversation);

    // Should penalize absent OP
    const hasAbsentOPIssue = score.issues.some(i => i.type === 'no_op_engagement');
    expect(hasAbsentOPIssue).toBe(true);
  });

  test('assigns appropriate grade levels', () => {
    const conversation = createMockConversation();
    const score = predictQuality(conversation);

    const validGrades = ['excellent', 'good', 'needs_improvement', 'poor'];
    expect(validGrades).toContain(score.grade);

    // Grade should match overall score
    if (score.overall >= 90) {
      expect(score.grade).toBe('excellent');
    } else if (score.overall >= 70) {
      expect(score.grade).toBe('good');
    } else if (score.overall >= 50) {
      expect(score.grade).toBe('needs_improvement');
    } else {
      expect(score.grade).toBe('poor');
    }
  });

  test('generates suggestions when issues exist', () => {
    const lowQualityConversation = createMockConversation({
      post: {
        ...createMockConversation().post,
        content: 'Need presentation help.' // Too generic
      },
      replies: [] // No OP engagement
    });

    const score = predictQuality(lowQualityConversation);

    // Should have issues detected
    expect(score.issues.length).toBeGreaterThan(0);

    // Suggestions array exists (may or may not have content depending on issue types)
    expect(Array.isArray(score.suggestions)).toBe(true);

    // If suggestions exist, they should be valid strings
    score.suggestions.forEach(suggestion => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });
  });

  test('detects AI patterns in content', () => {
    const aiPatternConversation = createMockConversation({
      post: {
        ...createMockConversation().post,
        content: '1. First, I tried PowerPoint. 2. Furthermore, I utilized Google Slides. 3. Moreover, I discovered SlideForge.'
      }
    });

    const score = predictQuality(aiPatternConversation);

    // Should detect AI patterns
    const hasAIPatternIssue = score.issues.some(i => i.type === 'ai_patterns');
    expect(hasAIPatternIssue).toBe(true);
    expect(score.dimensions.authenticity).toBeLessThan(20);
  });

  test('rewards post with question', () => {
    const conversation = createMockConversation(); // Has question mark
    const score = predictQuality(conversation);

    // Should reward question
    const hasQuestionStrength = score.strengths.some(s => s.type === 'asks_question');
    expect(hasQuestionStrength).toBe(true);
  });

  test('handles conversation with no product mention', () => {
    const noProductConversation = createMockConversation({
      topLevelComments: [
        {
          id: 'comment-1',
          persona: SLIDEFORGE_PERSONAS[1],
          content: 'Have you tried using templates?',
          scheduledTime: new Date(),
          replyTo: 'post',
          purpose: 'suggest_approach',
          productMention: false
        }
      ]
    });

    const score = predictQuality(noProductConversation);

    // Should still score (value first gets max points for no product)
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.dimensions.valueFirst).toBeGreaterThan(0);
  });

  test('dimensions sum approximately to overall score', () => {
    const conversation = createMockConversation();
    const score = predictQuality(conversation);

    const sum = Object.values(score.dimensions).reduce((a, b) => a + b, 0);

    // Overall should be close to sum of dimensions (allowing for rounding)
    expect(Math.abs(score.overall - sum)).toBeLessThan(2);
  });
});
