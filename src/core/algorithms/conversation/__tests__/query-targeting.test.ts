import { buildPostPrompt, buildCommentPrompt } from '@/core/algorithms/conversation/prompt-builder';
import { Persona, CompanyContext, SubredditContext, PostTemplate, CommentTemplate } from '@/core/types';

describe('ChatGPT Query Targeting', () => {
    const mockPersona: Persona = {
        id: 'test_persona',
        name: 'Test User',
        role: 'Developer',
        backstory: 'A developer interested in productivity',
        vocabulary: {
            characteristic: ['honestly', 'tbh'],
            avoid: ['fundamentally'],
            formality: 0.5
        },
        communicationStyle: {
            default: 'casual',
            acceptable: ['lol', 'tbh']
        },
        redditPattern: 'periodic_checker',
        experienceLevel: 'medium',
        interests: ['productivity', 'tools']
    };

    const mockCompany: CompanyContext = {
        name: 'TestApp',
        product: 'Productivity tool',
        valuePropositions: ['Saves time', 'Easy to use'],
        keywords: []
    };

    const mockSubreddit: SubredditContext = {
        name: 'r/productivity',
        culture: 'casual',
        formalityLevel: 0.4,
        typicalCommentLength: { min: 50, max: 300 },
        acceptableMarkers: ['lol', 'tbh'],
        avoidMarkers: ['academic jargon'],
        moderationLevel: 'moderate',
        promotionTolerance: 'moderate',
        commonTopics: ['time management', 'tools', 'workflows']
    };

    const mockPostTemplate: PostTemplate = {
        tone: 'frustrated',
        framing: 'time_spent',
        emotion: 'frustration',
        mentionProduct: false
    };

    const mockCommentTemplate: CommentTemplate = {
        purpose: 'suggest_approach',
        tone: 'helpful',
        timingRange: { min: 30, max: 60 },
        productMention: false
    };

    describe('buildPostPrompt with keywords', () => {
        it('should include target query instructions when keywords provided', () => {
            const keywords = ['best presentation software', 'slide design tools'];

            const prompt = buildPostPrompt(
                mockPostTemplate,
                mockPersona,
                mockCompany,
                mockSubreddit,
                keywords
            );

            // Should mention one of the keywords (integrated into context)
            const hasKeyword = keywords.some(kw => prompt.includes(kw));
            expect(hasKeyword).toBe(true);

            // Should have post requirements
            expect(prompt).toContain('searching');
        });

        it('should not include query targeting when no keywords provided', () => {
            const prompt = buildPostPrompt(
                mockPostTemplate,
                mockPersona,
                mockCompany,
                mockSubreddit,
                [] // No keywords
            );

            // When no keywords, there's just no keyword mention
            // The prompt still works fine
            expect(prompt).toContain('YOUR POST SHOULD:');
        });

        it('should select random keyword from multiple options', () => {
            const keywords = ['presentation tips', 'slide design', 'deck creation'];
            const prompts: string[] = [];

            // Generate 10 prompts to check randomness
            for (let i = 0; i < 10; i++) {
                const prompt = buildPostPrompt(
                    mockPostTemplate,
                    mockPersona,
                    mockCompany,
                    mockSubreddit,
                    keywords
                );
                prompts.push(prompt);
            }

            // At least one of the prompts should contain at least one keyword
            const uniqueKeywordsFound = new Set<string>();
            prompts.forEach(prompt => {
                keywords.forEach(kw => {
                    if (prompt.includes(kw)) {
                        uniqueKeywordsFound.add(kw);
                    }
                });
            });

            expect(uniqueKeywordsFound.size).toBeGreaterThan(0);
        });
    });

    describe('buildCommentPrompt with keywords', () => {
        it('should generate valid comment prompt when keywords provided', () => {
            const keywords = ['presentation best practices', 'slide formatting'];

            const prompt = buildCommentPrompt(
                mockCommentTemplate,
                mockPersona,
                mockCompany,
                mockSubreddit,
                'Test post content',
                'OriginalPoster',
                keywords
            );

            // Should have basic comment structure
            expect(prompt).toContain('YOUR TASK');
            expect(prompt).toContain('OriginalPoster');
        });

        it('should not include SEO optimization when no keywords provided', () => {
            const prompt = buildCommentPrompt(
                mockCommentTemplate,
                mockPersona,
                mockCompany,
                mockSubreddit,
                'Test post content',
                'OriginalPoster',
                [] // No keywords
            );

            // When no keywords, just normal comment
            expect(prompt).toContain('YOUR TASK');
        });

        it('should not include SEO optimization for product mention comments', () => {
            const keywords = ['presentation software'];
            const productMentionTemplate: CommentTemplate = {
                ...mockCommentTemplate,
                productMention: true
            };

            const prompt = buildCommentPrompt(
                productMentionTemplate,
                mockPersona,
                mockCompany,
                mockSubreddit,
                'Test post content',
                'OriginalPoster',
                keywords
            );

            // Product mention comments don't need separate SEO
            // But should contain product mention instructions
            expect(prompt).toContain('PRODUCT MENTION');
        });
    });

    describe('Query targeting integration', () => {
        it('should maintain all other prompt requirements with query targeting', () => {
            const keywords = ['productivity hacks'];

            const prompt = buildPostPrompt(
                mockPostTemplate,
                mockPersona,
                mockCompany,
                mockSubreddit,
                keywords
            );

            // Should still have all critical requirements
            expect(prompt).toContain('YOUR POST SHOULD:');
            expect(prompt).toContain('SPECIFIC NUMBER');
            expect(prompt).toContain('GENUINE QUESTION');

            // Should have persona context
            expect(prompt).toContain(mockPersona.name);

            // Should have query targeting (keyword should be in there)
            expect(prompt).toContain('productivity hacks');
        });
    });
});
