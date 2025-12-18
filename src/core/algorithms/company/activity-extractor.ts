import { generateWithOpenAI } from '@/shared/lib/api/openai-client';
import { CompanyContext } from '@/core/types';

/**
 * Intelligent Activity Extractor
 * 
 * Uses LLM to extract highly specific, realistic user activities and frustrations
 * based on the company's product description. This replaces generic keyword matching.
 */

export async function extractCompanyActivities(company: CompanyContext): Promise<string[]> {
    const prompt = `
    Analyze this company and generate a list of 8-10 specific, realistic daily "activities" 
    that a potential user of this product would be doing (the problems/tasks the product solves).
    
    COMPANY: ${company.name}
    PRODUCT: ${company.product}
    VALUE PROPS: ${company.valuePropositions.join(', ')}
    KEYWORDS: ${company.keywords.join(', ')}

    These activities should be:
    1. Action-oriented verbs (gerunds: "fixing", "building", "debugging")
    2. Specific to the domain (not generic "working")
    3. Phrased as something a user might complain about or be doing right now
    4. Casual, realistic language

    Example for a Slide App:
    - "fixing broken layouts"
    - "aligning text boxes"
    - "rushing to finish this deck"
    - "formatting these slides"
    
    Example for a CRM:
    - "cleaning up messy leads"
    - "updating deal stages"
    - "chasing these prospects"
    - "migrating customer data"

    OUTPUT FORMAT:
    Return ONLY a JSON array of strings. No markdown, no explanation.
    ["activity 1", "activity 2", ...]
    `;

    try {
        const response = await generateWithOpenAI(prompt, { temperature: 0.7 });

        // Clean response of any markdown code blocks if present
        const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();

        const activities = JSON.parse(cleaned);

        if (Array.isArray(activities) && activities.length > 0) {
            console.log(`✅ Extracted ${activities.length} smart activities for ${company.name}`);
            return activities.slice(0, 10);
        }

        throw new Error('Invalid response format');
    } catch (error) {
        console.error('Failed to extract activities with AI, falling back to keywords:', error);
        return []; // Caller will handle fallback
    }
}
