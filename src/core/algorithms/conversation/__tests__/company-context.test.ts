import { buildPostPrompt } from '@/core/algorithms/conversation/prompt-builder';
import { Persona, CompanyContext, SubredditContext, PostTemplate } from '@/core/types';

describe('Company-Specific Content Generation', () => {
    const mockPersona: Persona = {
        id: 'test_persona',
        name: 'Test User',
        role: 'Marketer',
        backstory: 'A marketer interested in Reddit',
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
        interests: ['marketing', 'reddit']
    };

    const mockSubreddit: SubredditContext = {
        name: 'r/marketing',
        culture: 'casual',
        formalityLevel: 0.4,
        typicalCommentLength: { min: 50, max: 300 },
        acceptableMarkers: ['lol', 'tbh'],
        avoidMarkers: ['academic jargon'],
        moderationLevel: 'moderate',
        promotionTolerance: 'moderate',
        commonTopics: ['marketing strategies', 'growth', 'campaigns']
    };

    const mockPostTemplate: PostTemplate = {
        tone: 'frustrated',
        framing: 'time_spent',
        emotion: 'frustration',
        mentionProduct: false
    };

    describe('Reddit Mastermind Company', () => {
        const redditMastermindCompany: CompanyContext = {
            name: 'Reddit Mastermind',
            product: 'AI-powered Reddit marketing automation tool',
            valuePropositions: [
                'Generates authentic Reddit conversations that drive organic discovery',
                'Creates psychologically-modeled personas for realistic engagement',
                'Automates timing and subreddit targeting for maximum reach'
            ],
            keywords: ['reddit marketing', 'organic discovery', 'community marketing']
        };

        it('should generate prompts with Reddit marketing context in scenarios', () => {
            const prompt = buildPostPrompt(
                mockPostTemplate,
                mockPersona,
                redditMastermindCompany,
                mockSubreddit,
                redditMastermindCompany.keywords
            );

            // Check the scenario section specifically (not the examples)
            // The scenario should mention Reddit-related activities
            const hasRedditScenario =
                prompt.includes('posting on Reddit') ||
                prompt.includes('managing Reddit content') ||
                prompt.includes('working with Reddit Mastermind') ||
                prompt.includes('trying to use Reddit Mastermind') ||
                prompt.includes('running marketing campaigns');

            expect(hasRedditScenario).toBe(true);

            // Should include company name in scenarios
            expect(prompt).toContain('Reddit Mastermind');

            // NOTE: Examples may still reference presentations/slides because they're 
            // generic style examples showing HOW to write, not WHAT to write about
        });
    });

    describe('Presentation Tool Company', () => {
        const presentationCompany: CompanyContext = {
            name: 'SlideForge',
            product: 'AI-powered presentation builder',
            valuePropositions: [
                'Creates beautiful slides in minutes',
                'Automates formatting and design',
                'Generates content from bullet points'
            ],
            keywords: ['presentation software', 'slide design']
        };

        it('should generate prompts with presentation context in scenarios', () => {
            const prompt = buildPostPrompt(
                mockPostTemplate,
                mockPersona,
                presentationCompany,
                mockSubreddit,
                presentationCompany.keywords
            );

            // Check for presentation-related scenario activities
            const hasPresentationScenario =
                prompt.includes('making slides') ||
                prompt.includes('building presentations') ||
                prompt.includes('creating pitch decks') ||
                prompt.includes('working with SlideForge');

            expect(hasPresentationScenario).toBe(true);
            expect(prompt).toContain('SlideForge');
        });
    });

    describe('CRM Tool Company', () => {
        const crmCompany: CompanyContext = {
            name: 'SalesHub',
            product: 'Modern CRM for sales teams',
            valuePropositions: [
                'Tracks leads automatically',
                'Automates follow-ups',
                'Generates sales reports'
            ],
            keywords: ['crm software', 'sales tracking']
        };

        it('should generate prompts with CRM/sales context in scenarios', () => {
            const prompt = buildPostPrompt(
                mockPostTemplate,
                mockPersona,
                crmCompany,
                mockSubreddit,
                crmCompany.keywords
            );

            // Check for CRM-related scenario activities
            const hasCRMScenario =
                prompt.includes('SalesHub') ||
                prompt.includes('managing leads') ||
                prompt.includes('tracking customers') ||
                prompt.includes('working with SalesHub');

            expect(hasCRMScenario).toBe(true);
        });
    });

    describe('Activities Generation', () => {
        it('should generate different scenarios for different companies', () => {
            const companies: CompanyContext[] = [
                {
                    name: 'Reddit Mastermind',
                    product: 'AI-powered Reddit marketing automation tool',
                    valuePropositions: ['Generates authentic Reddit conversations'],
                    keywords: []
                },
                {
                    name: 'DesignPro',
                    product: 'Graphic design platform',
                    valuePropositions: ['Creates beautiful designs'],
                    keywords: []
                },
                {
                    name: 'DataViz',
                    product: 'Analytics and data visualization tool',
                    valuePropositions: ['Analyzes complex datasets'],
                    keywords: []
                }
            ];

            const prompts = companies.map(company =>
                buildPostPrompt(
                    mockPostTemplate,
                    mockPersona,
                    company,
                    mockSubreddit,
                    []
                )
            );

            // Each should contain their company name
            expect(prompts[0]).toContain('Reddit Mastermind');
            expect(prompts[1]).toContain('DesignPro');
            expect(prompts[2]).toContain('DataViz');

            // Verify scenarios are actually different by checking activities
            // Reddit Mastermind should have Reddit-related activities
            const hasRedditActivity =
                prompts[0].includes('posting on Reddit') ||
                prompts[0].includes('managing Reddit content') ||
                prompts[0].includes('working with Reddit Mastermind');
            expect(hasRedditActivity).toBe(true);

            // DesignPro should have design-related activities
            const hasDesignActivity =
                prompts[1].includes('working on designs') ||
                prompts[1].includes('creating designs') ||
                prompts[1].includes('working with DesignPro');
            expect(hasDesignActivity).toBe(true);

            // DataViz should have analytics-related activities
            const hasDataActivity =
                prompts[2].includes('analyzing data') ||
                prompts[2].includes('building reports') ||
                prompts[2].includes('working with DataViz');
            expect(hasDataActivity).toBe(true);
        });
    });
});

