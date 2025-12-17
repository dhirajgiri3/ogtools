import OpenAI from 'openai';

/**
 * OpenAI Client Configuration
 * 
 * Centralized OpenAI client for content generation.
 * Uses GPT-4o-mini for fast, cost-effective generation.
 */

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

/**
 * Generate text using OpenAI GPT-4o-mini
 * Optimized for natural Reddit-style content generation
 *
 * @param prompt - The full prompt to send
 * @returns Generated text content
 */
export async function generateWithOpenAI(prompt: string): Promise<string> {
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: 'You are a Reddit user typing quickly on your phone. Write naturally with some imperfections. Be brief and emotional.'
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 1.1,           // Increased for more randomness and natural variation
        max_tokens: 250,
        frequency_penalty: 1.5,     // Strongly discourage word repetition
        presence_penalty: 0.8,      // Encourage topic diversity
    });

    return response.choices[0]?.message?.content?.trim() || '';
}
