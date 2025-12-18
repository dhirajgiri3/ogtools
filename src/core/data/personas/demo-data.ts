import { CompanyContext } from '@/core/types';
import { PERSONA_LIBRARY } from './persona-library';

/**
 * Demo Data Configuration
 * 
 * Pre-configured demo data for testing and demonstrations.
 * Based on the Reddit Mastermind product as the example company.
 */

export const DEMO_COMPANY: CompanyContext = {
    name: 'Reddit Mastermind',
    product: 'AI-powered Reddit marketing automation tool',
    valuePropositions: [
        'Generates authentic Reddit conversations that drive organic discovery',
        'Creates psychologically-modeled personas for realistic engagement',
        'Automates timing and subreddit targeting for maximum reach',
        'Maintains brand safety with built-in quality validation',
        'Scales Reddit marketing without sacrificing authenticity'
    ],
    icp: [
        'B2B SaaS companies looking for organic growth channels',
        'Marketing teams tired of traditional paid advertising',
        'Startup founders seeking product-market fit through community feedback',
        'Growth marketers exploring Reddit as a discovery channel'
    ],
    keywords: [
        'reddit marketing',
        'organic discovery',
        'community marketing',
        'reddit automation',
        'authentic engagement',
        'reddit growth',
        'reddit advertising alternative',
        'community-led growth',
        'reddit content',
        'subreddit marketing'
    ]
};

export const DEMO_SUBREDDITS = [
    'r/SaaS',
    'r/startups',
    'r/Entrepreneur',
    'r/marketing',
    'r/growthmarketing',
    'r/business',
    'r/smallbusiness',
    'r/ProductManagement',
    'r/sales'
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
