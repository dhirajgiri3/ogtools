/**
 * Multi-Company Integration Tests
 *
 * Tests that the system works with different company contexts beyond SlideForge
 */

import { buildPostPrompt, buildCommentPrompt } from '@/core/algorithms/conversation/prompt-builder';
import { CompanyContext, Persona, SubredditContext, PostTemplate, CommentTemplate } from '@/core/types';

describe('Multi-Company Integration Tests', () => {
    // Test Persona (reused across companies)
    const testPersona: Persona = {
        id: 'test_user',
        name: 'Alex Johnson',
        role: 'Product Manager',
        backstory: 'Product manager at a tech startup',
        vocabulary: {
            characteristic: ['honestly', 'realistically', 'IMO'],
            avoid: ['synergy', 'leverage'],
            formality: 0.5
        },
        communicationStyle: {
            default: 'professional',
            acceptable: ['IMO', 'tbh']
        },
        redditPattern: 'periodic_checker',
        experienceLevel: 'high',
        interests: ['productivity', 'tools', 'workflow']
    };

    const testSubreddit: SubredditContext = {
        name: 'r/saas',
        culture: 'professional',
        formalityLevel: 0.6,
        typicalCommentLength: { min: 100, max: 400 },
        acceptableMarkers: ['IMO', 'FWIW'],
        avoidMarkers: ['lol', 'lmao'],
        moderationLevel: 'moderate',
        promotionTolerance: 'low',
        commonTopics: ['product management', 'SaaS tools', 'customer feedback']
    };

    const postTemplate: PostTemplate = {
        tone: 'frustrated',
        framing: 'problem',
        emotion: 'frustration',
        mentionProduct: false
    };

    const commentTemplate: CommentTemplate = {
        purpose: 'tool_mention',
        tone: 'helpful',
        timingRange: { min: 60, max: 120 },
        productMention: true,
        productFraming: 'personal_discovery'
    };

    // Company 1: SaaS Analytics Tool
    const analyticsCompany: CompanyContext = {
        name: 'DataPulse',
        product: 'Real-time analytics dashboard for SaaS companies',
        valuePropositions: [
            'Track user behavior in real-time',
            'Predict churn before it happens',
            'Identify power users automatically',
            'Integrate with your existing stack'
        ],
        icp: ['SaaS founders', 'Product managers', 'Growth teams'],
        keywords: ['analytics tool', 'user tracking', 'churn prediction', 'product analytics']
    };

    // Company 2: Developer Tools
    const devToolCompany: CompanyContext = {
        name: 'CodeSync',
        product: 'AI-powered code review and documentation tool',
        valuePropositions: [
            'Automated code review suggestions',
            'Generate documentation from code',
            'Detect security vulnerabilities',
            'Team collaboration features'
        ],
        icp: ['Engineering teams', 'Tech leads', 'DevOps engineers'],
        keywords: ['code review tool', 'automated documentation', 'code quality', 'developer productivity']
    };

    // Company 3: Marketing Automation
    const marketingCompany: CompanyContext = {
        name: 'GrowthBot',
        product: 'AI-driven marketing automation platform',
        valuePropositions: [
            'Personalized email campaigns at scale',
            'Predictive lead scoring',
            'A/B testing automation',
            'Multi-channel campaign management'
        ],
        icp: ['Marketing teams', 'Growth marketers', 'CMOs'],
        keywords: ['marketing automation', 'email campaigns', 'lead generation', 'growth hacking']
    };

    // Company 4: Design Tool
    const designCompany: CompanyContext = {
        name: 'PixelForge',
        product: 'Collaborative design tool with AI assistance',
        valuePropositions: [
            'AI-powered design suggestions',
            'Real-time team collaboration',
            'Design system management',
            'Export to all major formats'
        ],
        icp: ['Design teams', 'UX designers', 'Creative directors'],
        keywords: ['design tool', 'collaborative design', 'UI design', 'design workflow']
    };

    describe('Post Generation with Different Companies', () => {
        it('should generate posts for DataPulse (Analytics)', () => {
            const prompt = buildPostPrompt(
                postTemplate,
                testPersona,
                analyticsCompany,
                testSubreddit,
                analyticsCompany.keywords
            );

            // Should instruct NOT to mention product in post (per requirements)
            expect(prompt).toContain('DO NOT mention "DataPulse"');

            // Should include target query from keywords for SEO
            const hasKeyword = analyticsCompany.keywords.some(kw =>
                prompt.includes(kw)
            );
            expect(hasKeyword).toBe(true);

            // Should maintain standard requirements
            expect(prompt).toContain('CRITICAL REQUIREMENTS');
            expect(prompt).toContain('specific number');
            expect(prompt).toContain('TARGET SEARCH QUERY');
        });

        it('should generate posts for CodeSync (Developer Tools)', () => {
            const prompt = buildPostPrompt(
                postTemplate,
                testPersona,
                devToolCompany,
                testSubreddit,
                devToolCompany.keywords
            );

            expect(prompt).toContain('DO NOT mention "CodeSync"');

            const hasKeyword = devToolCompany.keywords.some(kw =>
                prompt.includes(kw)
            );
            expect(hasKeyword).toBe(true);
        });

        it('should generate posts for GrowthBot (Marketing)', () => {
            const prompt = buildPostPrompt(
                postTemplate,
                testPersona,
                marketingCompany,
                testSubreddit,
                marketingCompany.keywords
            );

            expect(prompt).toContain('DO NOT mention "GrowthBot"');

            const hasKeyword = marketingCompany.keywords.some(kw =>
                prompt.includes(kw)
            );
            expect(hasKeyword).toBe(true);
        });

        it('should generate posts for PixelForge (Design)', () => {
            const prompt = buildPostPrompt(
                postTemplate,
                testPersona,
                designCompany,
                testSubreddit,
                designCompany.keywords
            );

            expect(prompt).toContain('DO NOT mention "PixelForge"');

            const hasKeyword = designCompany.keywords.some(kw =>
                prompt.includes(kw)
            );
            expect(hasKeyword).toBe(true);
        });
    });

    describe('Comment Generation with Product Mentions', () => {
        it('should mention DataPulse naturally in comments', () => {
            const prompt = buildCommentPrompt(
                commentTemplate,
                testPersona,
                analyticsCompany,
                testSubreddit,
                'Looking for a better way to track user behavior',
                'OriginalPoster',
                analyticsCompany.keywords
            );

            expect(prompt).toContain('DataPulse');
            expect(prompt).toContain('PRODUCT MENTION');

            // Should include a value prop
            const hasValueProp = analyticsCompany.valuePropositions.some(vp =>
                prompt.includes(vp)
            );
            expect(hasValueProp).toBe(true);

            // Should have natural framing instructions
            expect(prompt).toContain('personal experience');
            expect(prompt).toContain('NEVER say:');
        });

        it('should mention CodeSync naturally in comments', () => {
            const prompt = buildCommentPrompt(
                commentTemplate,
                testPersona,
                devToolCompany,
                testSubreddit,
                'Code reviews are taking forever on my team',
                'OriginalPoster',
                devToolCompany.keywords
            );

            expect(prompt).toContain('CodeSync');
            expect(prompt).toContain('PRODUCT MENTION');
        });

        it('should mention GrowthBot naturally in comments', () => {
            const prompt = buildCommentPrompt(
                commentTemplate,
                testPersona,
                marketingCompany,
                testSubreddit,
                'Struggling to scale our email campaigns',
                'OriginalPoster',
                marketingCompany.keywords
            );

            expect(prompt).toContain('GrowthBot');
            expect(prompt).toContain('PRODUCT MENTION');
        });

        it('should mention PixelForge naturally in comments', () => {
            const prompt = buildCommentPrompt(
                commentTemplate,
                testPersona,
                designCompany,
                testSubreddit,
                'Need better design collaboration tools',
                'OriginalPoster',
                designCompany.keywords
            );

            expect(prompt).toContain('PixelForge');
            expect(prompt).toContain('PRODUCT MENTION');
        });
    });

    describe('Company-Specific Value Propositions', () => {
        it('should randomly select different value props across multiple generations', () => {
            const valuePropsUsed = new Set<string>();

            // Generate 20 prompts to test randomness
            for (let i = 0; i < 20; i++) {
                const prompt = buildCommentPrompt(
                    commentTemplate,
                    testPersona,
                    analyticsCompany,
                    testSubreddit,
                    'Need analytics help',
                    'OP',
                    analyticsCompany.keywords
                );

                // Find which value prop was used
                analyticsCompany.valuePropositions.forEach(vp => {
                    if (prompt.includes(vp)) {
                        valuePropsUsed.add(vp);
                    }
                });
            }

            // Should use multiple different value props (not always the same)
            expect(valuePropsUsed.size).toBeGreaterThan(1);
        });
    });

    describe('ICP Targeting', () => {
        it('should include ICP information in company context', () => {
            // All companies should have valid ICPs
            expect(analyticsCompany.icp.length).toBeGreaterThan(0);
            expect(devToolCompany.icp.length).toBeGreaterThan(0);
            expect(marketingCompany.icp.length).toBeGreaterThan(0);
            expect(designCompany.icp.length).toBeGreaterThan(0);

            // ICPs should be specific
            expect(analyticsCompany.icp).toContain('SaaS founders');
            expect(devToolCompany.icp).toContain('Engineering teams');
            expect(marketingCompany.icp).toContain('Marketing teams');
            expect(designCompany.icp).toContain('Design teams');
        });
    });

    describe('Keyword Diversity', () => {
        it('should have unique keywords per company vertical', () => {
            const allKeywords = [
                ...analyticsCompany.keywords,
                ...devToolCompany.keywords,
                ...marketingCompany.keywords,
                ...designCompany.keywords
            ];

            // All keywords should be unique (no overlap)
            const uniqueKeywords = new Set(allKeywords);

            // At least 12 unique keywords across 4 companies
            expect(uniqueKeywords.size).toBeGreaterThanOrEqual(12);

            // Each company has at least 3 keywords
            expect(analyticsCompany.keywords.length).toBeGreaterThanOrEqual(3);
            expect(devToolCompany.keywords.length).toBeGreaterThanOrEqual(3);
            expect(marketingCompany.keywords.length).toBeGreaterThanOrEqual(3);
            expect(designCompany.keywords.length).toBeGreaterThanOrEqual(3);
        });

        it('should use different keywords across posts', () => {
            const keywordsUsed = new Set<string>();

            // Generate 15 posts
            for (let i = 0; i < 15; i++) {
                const prompt = buildPostPrompt(
                    postTemplate,
                    testPersona,
                    analyticsCompany,
                    testSubreddit,
                    analyticsCompany.keywords
                );

                // Find which keyword was used
                analyticsCompany.keywords.forEach(kw => {
                    if (prompt.includes(kw)) {
                        keywordsUsed.add(kw);
                    }
                });
            }

            // Should use multiple different keywords
            expect(keywordsUsed.size).toBeGreaterThan(1);
        });
    });
});
