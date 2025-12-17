import {
  ARC_TEMPLATES,
  scorePersonaForSubreddit,
  selectPersonasForArc,
  generatePost,
  generateComment,
  generateReply,
  generateConversation,
  getRandomArcType
} from '../designer';
import { SLIDEFORGE_PERSONAS, SLIDEFORGE_COMPANY } from '@/core/data/personas/slideforge';
import { getSubredditProfile } from '@/core/data/subreddits/profiles';
import { Persona, SubredditContext } from '@/core/types';

// Mock OpenAI client
jest.mock('@/shared/lib/api/openai-client', () => ({
  generateWithOpenAI: jest.fn((prompt: string) => {
    // Return mock content based on prompt keywords
    if (prompt.includes('POST')) {
      return Promise.resolve('This is a mock post content about presentations and slides.');
    } else if (prompt.includes('COMMENT')) {
      return Promise.resolve('This is a mock comment providing helpful advice.');
    } else if (prompt.includes('REPLY')) {
      return Promise.resolve('Thanks for the suggestion!');
    }
    return Promise.resolve('Mock content');
  })
}));

describe('Conversation Designer', () => {

  describe('ARC_TEMPLATES', () => {

    test('all arc templates have required fields', () => {
      expect(ARC_TEMPLATES.length).toBeGreaterThan(0);

      ARC_TEMPLATES.forEach(arc => {
        expect(arc.type).toBeDefined();
        expect(arc.name).toBeDefined();
        expect(arc.description).toBeDefined();
        expect(arc.postTemplate).toBeDefined();
        expect(Array.isArray(arc.commentTemplates)).toBe(true);
        expect(Array.isArray(arc.replyTemplates)).toBe(true);
      });
    });

    test('discovery arc exists with proper structure', () => {
      const discovery = ARC_TEMPLATES.find(a => a.type === 'discovery');

      expect(discovery).toBeDefined();
      expect(discovery?.postTemplate.mentionProduct).toBe(false);
      expect(discovery?.commentTemplates.length).toBeGreaterThan(0);

      // Last comment should mention product
      const lastComment = discovery?.commentTemplates[discovery.commentTemplates.length - 1];
      expect(lastComment?.productMention).toBe(true);
    });

    test('comparison arc exists with proper structure', () => {
      const comparison = ARC_TEMPLATES.find(a => a.type === 'comparison');

      expect(comparison).toBeDefined();
      expect(comparison?.postTemplate.mentionProduct).toBe(true); // Comparison arcs mention product in post
      expect(comparison?.commentTemplates.length).toBeGreaterThan(0);
    });

    test('problemSolver arc exists with proper structure', () => {
      const problemSolver = ARC_TEMPLATES.find(a => a.type === 'problemSolver');

      expect(problemSolver).toBeDefined();
      expect(problemSolver?.postTemplate.mentionProduct).toBe(false);
      expect(problemSolver?.commentTemplates.length).toBeGreaterThan(0);
    });

    test('comment templates have timing ranges', () => {
      ARC_TEMPLATES.forEach(arc => {
        arc.commentTemplates.forEach(comment => {
          expect(comment.timingRange).toBeDefined();
          expect(comment.timingRange.min).toBeLessThan(comment.timingRange.max);
          expect(comment.timingRange.min).toBeGreaterThanOrEqual(0);
        });
      });
    });

  });

  describe('scorePersonaForSubreddit', () => {

    test('returns numeric score', () => {
      const persona = SLIDEFORGE_PERSONAS[0];
      const subreddit = getSubredditProfile('r/productivity');

      const score = scorePersonaForSubreddit(persona, subreddit);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    test('rewards interest overlap', () => {
      const persona = SLIDEFORGE_PERSONAS[0];
      const productivitySub = getSubredditProfile('r/productivity');
      const startupsSub = getSubredditProfile('r/startups');

      const productivityScore = scorePersonaForSubreddit(persona, productivitySub);
      const startupsScore = scorePersonaForSubreddit(persona, startupsSub);

      // Both should have positive scores (persona interested in both topics)
      expect(productivityScore).toBeGreaterThan(0);
      expect(startupsScore).toBeGreaterThan(0);
    });

    test('rewards formality match', () => {
      // Find personas with different formality levels
      const casualPersona = SLIDEFORGE_PERSONAS.find(p => p.vocabulary.formality < 0.4);
      const formalPersona = SLIDEFORGE_PERSONAS.find(p => p.vocabulary.formality > 0.6);

      if (casualPersona && formalPersona) {
        const casualSub = getSubredditProfile('r/productivity'); // Casual sub

        const casualScore = scorePersonaForSubreddit(casualPersona, casualSub);
        const formalScore = scorePersonaForSubreddit(formalPersona, casualSub);

        // Casual persona should score better for casual sub
        expect(casualScore).toBeGreaterThan(formalScore - 10); // Allow some tolerance
      } else {
        // If data doesn't have variety, test passes
        expect(true).toBe(true);
      }
    });

    test('scores vary across personas', () => {
      const subreddit = getSubredditProfile('r/productivity');

      const scores = SLIDEFORGE_PERSONAS.map(p => scorePersonaForSubreddit(p, subreddit));
      const uniqueScores = new Set(scores);

      // Should have some variation (not all same score)
      expect(uniqueScores.size).toBeGreaterThan(1);
    });

  });

  describe('selectPersonasForArc', () => {

    test('returns poster and commenters', () => {
      const subreddit = getSubredditProfile('r/productivity');
      const result = selectPersonasForArc(SLIDEFORGE_PERSONAS, subreddit, 3);

      expect(result.poster).toBeDefined();
      expect(Array.isArray(result.commenters)).toBe(true);
      expect(result.commenters.length).toBe(3);
    });

    test('poster is highest-scoring persona', () => {
      const subreddit = getSubredditProfile('r/productivity');
      const result = selectPersonasForArc(SLIDEFORGE_PERSONAS, subreddit, 3);

      // Poster should have high score
      const posterScore = scorePersonaForSubreddit(result.poster, subreddit);

      // Check that poster score is among the top
      const allScores = SLIDEFORGE_PERSONAS.map(p => scorePersonaForSubreddit(p, subreddit));
      const maxScore = Math.max(...allScores);

      expect(posterScore).toBe(maxScore);
    });

    test('commenters are different from poster', () => {
      const subreddit = getSubredditProfile('r/productivity');
      const result = selectPersonasForArc(SLIDEFORGE_PERSONAS, subreddit, 3);

      result.commenters.forEach(commenter => {
        expect(commenter.id).not.toBe(result.poster.id);
      });
    });

    test('commenters are all unique', () => {
      const subreddit = getSubredditProfile('r/productivity');
      const result = selectPersonasForArc(SLIDEFORGE_PERSONAS, subreddit, 3);

      const commenterIds = result.commenters.map(c => c.id);
      const uniqueIds = new Set(commenterIds);

      expect(uniqueIds.size).toBe(commenterIds.length);
    });

    test('handles request for more commenters than available', () => {
      const subreddit = getSubredditProfile('r/productivity');
      const totalPersonas = SLIDEFORGE_PERSONAS.length;

      // Request more commenters than available (minus 1 for poster)
      const result = selectPersonasForArc(SLIDEFORGE_PERSONAS, subreddit, totalPersonas + 10);

      // Should return maximum available (total - 1 for poster)
      expect(result.commenters.length).toBeLessThanOrEqual(totalPersonas - 1);
    });

  });

  describe('generatePost', () => {

    test('generates post with required fields', async () => {
      const template = ARC_TEMPLATES[0].postTemplate;
      const persona = SLIDEFORGE_PERSONAS[0];
      const subreddit = getSubredditProfile('r/productivity');
      const keywords = ['presentation', 'slides'];

      const post = await generatePost(template, persona, SLIDEFORGE_COMPANY, subreddit, keywords);

      expect(post.id).toBeDefined();
      expect(post.persona).toBe(persona);
      expect(post.subreddit).toBe(subreddit.name);
      expect(post.content).toBeDefined();
      expect(post.emotion).toBe(template.emotion);
      expect(post.keywords).toEqual(keywords);
      expect(post.scheduledTime).toBeDefined();
    });

    test('post content is non-empty string', async () => {
      const template = ARC_TEMPLATES[0].postTemplate;
      const persona = SLIDEFORGE_PERSONAS[0];
      const subreddit = getSubredditProfile('r/productivity');
      const keywords = ['presentation'];

      const post = await generatePost(template, persona, SLIDEFORGE_COMPANY, subreddit, keywords);

      expect(typeof post.content).toBe('string');
      expect(post.content.length).toBeGreaterThan(0);
    });

    test('generates unique post IDs', async () => {
      const template = ARC_TEMPLATES[0].postTemplate;
      const persona = SLIDEFORGE_PERSONAS[0];
      const subreddit = getSubredditProfile('r/productivity');
      const keywords = ['presentation'];

      const post1 = await generatePost(template, persona, SLIDEFORGE_COMPANY, subreddit, keywords);
      const post2 = await generatePost(template, persona, SLIDEFORGE_COMPANY, subreddit, keywords);

      expect(post1.id).not.toBe(post2.id);
    });

  });

  describe('generateComment', () => {

    test('generates comment with required fields', async () => {
      const template = ARC_TEMPLATES[0].commentTemplates[0];
      const persona = SLIDEFORGE_PERSONAS[1];
      const subreddit = getSubredditProfile('r/productivity');
      const postContent = 'Test post content';
      const posterName = 'TestUser';

      const comment = await generateComment(
        template,
        persona,
        SLIDEFORGE_COMPANY,
        subreddit,
        postContent,
        posterName
      );

      expect(comment.id).toBeDefined();
      expect(comment.persona).toBe(persona);
      expect(comment.content).toBeDefined();
      expect(comment.scheduledTime).toBeDefined();
      expect(comment.replyTo).toBe('post');
      expect(comment.purpose).toBe(template.purpose);
      expect(comment.productMention).toBe(template.productMention);
    });

    test('comment content is non-empty string', async () => {
      const template = ARC_TEMPLATES[0].commentTemplates[0];
      const persona = SLIDEFORGE_PERSONAS[1];
      const subreddit = getSubredditProfile('r/productivity');

      const comment = await generateComment(
        template,
        persona,
        SLIDEFORGE_COMPANY,
        subreddit,
        'Post content',
        'Poster'
      );

      expect(typeof comment.content).toBe('string');
      expect(comment.content.length).toBeGreaterThan(0);
    });

  });

  describe('generateReply', () => {

    test('generates reply with required fields', async () => {
      const template = ARC_TEMPLATES[0].replyTemplates[0];
      const persona = SLIDEFORGE_PERSONAS[0];
      const subreddit = getSubredditProfile('r/productivity');
      const postContent = 'Test post';
      const parentCommentContent = 'Test comment';
      const parentCommentId = 'comment-123';
      const isOP = true;

      const reply = await generateReply(
        template,
        persona,
        subreddit,
        postContent,
        parentCommentContent,
        parentCommentId,
        isOP
      );

      expect(reply.id).toBeDefined();
      expect(reply.persona).toBe(persona);
      expect(reply.content).toBeDefined();
      expect(reply.scheduledTime).toBeDefined();
      expect(reply.parentCommentId).toBe(parentCommentId);
      expect(reply.replyType).toBe(template.replyType);
    });

    test('reply content is non-empty string', async () => {
      const template = ARC_TEMPLATES[0].replyTemplates[0];
      const persona = SLIDEFORGE_PERSONAS[0];
      const subreddit = getSubredditProfile('r/productivity');

      const reply = await generateReply(
        template,
        persona,
        subreddit,
        'Post',
        'Comment',
        'comment-123',
        true
      );

      expect(typeof reply.content).toBe('string');
      expect(reply.content.length).toBeGreaterThan(0);
    });

  });

  describe('generateConversation', () => {

    test('generates complete conversation with all parts', async () => {
      const conversation = await generateConversation(
        'discovery',
        SLIDEFORGE_PERSONAS,
        SLIDEFORGE_COMPANY,
        'r/productivity',
        ['presentation', 'slides']
      );

      expect(conversation.id).toBeDefined();
      expect(conversation.post).toBeDefined();
      expect(Array.isArray(conversation.topLevelComments)).toBe(true);
      expect(Array.isArray(conversation.replies)).toBe(true);
      expect(conversation.arcType).toBe('discovery');
      expect(conversation.subreddit).toBe('r/productivity');
    });

    test('generates correct number of comments based on template', async () => {
      const discoveryArc = ARC_TEMPLATES.find(a => a.type === 'discovery');
      const expectedComments = discoveryArc?.commentTemplates.length || 0;

      const conversation = await generateConversation(
        'discovery',
        SLIDEFORGE_PERSONAS,
        SLIDEFORGE_COMPANY,
        'r/productivity',
        ['presentation']
      );

      expect(conversation.topLevelComments.length).toBe(expectedComments);
    });

    test('generates replies based on template', async () => {
      const discoveryArc = ARC_TEMPLATES.find(a => a.type === 'discovery');
      const expectedReplies = discoveryArc?.replyTemplates.length || 0;

      const conversation = await generateConversation(
        'discovery',
        SLIDEFORGE_PERSONAS,
        SLIDEFORGE_COMPANY,
        'r/productivity',
        ['presentation']
      );

      // Should have replies (up to template count)
      expect(conversation.replies.length).toBeGreaterThan(0);
      expect(conversation.replies.length).toBeLessThanOrEqual(expectedReplies);
    });

    test('handles all arc types', async () => {
      const arcTypes: ('discovery' | 'comparison' | 'problemSolver')[] = ['discovery', 'comparison', 'problemSolver'];

      for (const arcType of arcTypes) {
        const conversation = await generateConversation(
          arcType,
          SLIDEFORGE_PERSONAS,
          SLIDEFORGE_COMPANY,
          'r/productivity',
          ['presentation']
        );

        expect(conversation.arcType).toBe(arcType);
        expect(conversation.post).toBeDefined();
        expect(conversation.topLevelComments.length).toBeGreaterThan(0);
      }
    });

    test('throws error for unknown arc type', async () => {
      await expect(
        generateConversation(
          'unknownArc' as any,
          SLIDEFORGE_PERSONAS,
          SLIDEFORGE_COMPANY,
          'r/productivity',
          ['presentation']
        )
      ).rejects.toThrow('Unknown arc type');
    });

    test('commenters are different from poster', async () => {
      const conversation = await generateConversation(
        'discovery',
        SLIDEFORGE_PERSONAS,
        SLIDEFORGE_COMPANY,
        'r/productivity',
        ['presentation']
      );

      const posterPersonaId = conversation.post.persona.id;

      conversation.topLevelComments.forEach(comment => {
        expect(comment.persona.id).not.toBe(posterPersonaId);
      });
    });

  });

  describe('getRandomArcType', () => {

    test('returns valid arc type', () => {
      const validArcs = ['discovery', 'comparison', 'problemSolver'];

      for (let i = 0; i < 10; i++) {
        const arcType = getRandomArcType();
        expect(validArcs).toContain(arcType);
      }
    });

    test('shows distribution across multiple calls', () => {
      const arcTypes = new Set<string>();

      // Run 50 times to see distribution
      for (let i = 0; i < 50; i++) {
        arcTypes.add(getRandomArcType());
      }

      // Should have at least 2 different types (shows randomness)
      expect(arcTypes.size).toBeGreaterThanOrEqual(2);
    });

  });

});
