import { CompanyContext } from '@/core/types';
import { PERSONA_LIBRARY } from './persona-library';

/**
 * Demo Data Configuration
 *
 * Pre-configured demo data for testing and demonstrations.
 * Uses SlideForge as the example company for demo mode (?demo=slideforge).
 *
 * Note: The actual content generation algorithm is company-agnostic and will
 * generate content specific to ANY company data provided by the user.
 */

export const DEMO_COMPANY: CompanyContext = {
    name: 'SlideForge',
    product: 'AI-powered presentation builder that transforms ideas into professional slides instantly',
    valuePropositions: [
        'Creates presentation decks 10x faster than traditional tools',
        'AI-generated content that matches your brand voice',
        'Smart templates that adapt to your content',
        'Collaborative editing with real-time feedback',
        'Saves 10+ hours per week on slide creation'
    ],
    keywords: [
        'presentation software',
        'slide design',
        'pitch decks',
        'AI presentation tool',
        'deck automation',
        'PowerPoint alternative',
        'presentation design',
        'consulting slides',
        'sales presentations'
    ]
};

export const DEMO_SUBREDDITS = [
    'r/marketing',
    'r/consulting',
    'r/SaaS',
    'r/sideproject',
    'r/growthhacking',
    'r/digitalmarketing',
    'r/webdev',
    'r/AskMarketing',
    'r/startups',
    'r/sales',
    'r/productivity',
    'r/entrepreneur',
    'r/freelance'
];

/**
 * Get demo configuration with all required data
 */
export function getDemoConfiguration() {
    return {
        company: DEMO_COMPANY,
        personas: PERSONA_LIBRARY,
        subreddits: DEMO_SUBREDDITS,
        keywords: DEMO_COMPANY.keywords,
        postsPerWeek: 7,
        qualityThreshold: 80
    };
}

// Export personas for backwards compatibility
export const DEMO_PERSONAS = PERSONA_LIBRARY;

// Backwards compatibility aliases
export const SLIDEFORGE_COMPANY = DEMO_COMPANY;
export const SLIDEFORGE_PERSONAS = DEMO_PERSONAS;
export const SLIDEFORGE_SUBREDDITS = DEMO_SUBREDDITS;
export const getSlideForgeDemo = getDemoConfiguration;
