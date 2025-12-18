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

export interface GenerationOptions {
    temperature?: number;
    maxTokens?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    systemPrompt?: string;
}

/**
 * Generate text using OpenAI GPT-4o-mini
 * Optimized for natural Reddit-style content generation
 *
 * @param prompt - The full prompt to send
 * @param options - Optional generation parameters
 * @returns Generated text content
 */
export async function generateWithOpenAI(
    prompt: string,
    options: GenerationOptions = {}
): Promise<string> {
    const client = getOpenAIClient();

    const {
        temperature = 1.1,
        maxTokens = 250,
        frequencyPenalty = 1.5,
        presencePenalty = 0.8,
        systemPrompt = 'You are a Reddit user typing quickly on your phone. Write naturally with some imperfections. Be brief and emotional.'
    } = options;

    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature,
        max_tokens: maxTokens,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
    });

    return response.choices[0]?.message?.content?.trim() || '';
}
