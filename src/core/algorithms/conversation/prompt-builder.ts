import { Persona, SubredditContext, CompanyContext, PostTemplate, CommentTemplate, ReplyTemplate } from '@/core/types';

/**
 * Prompt Builder Utility
 *
 * Constructs comprehensive prompts for Gemini API to generate posts, comments, and replies.
 * Each prompt includes persona backstory, communication style, subreddit context,
 * and specific task requirements.
 */

/**
 * Helper: Get random examples to increase diversity
 */
function getRandomExamples(examples: string[], count: number): string {
    const shuffled = [...examples].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(ex => `- "${ex}"`).join('\n');
}

/**
 * Build prompt for generating a Reddit post
 */
export function buildPostPrompt(
    template: PostTemplate,
    persona: Persona,
    company: CompanyContext,
    subreddit: SubredditContext,
    keywords: string[]
): string {
    // Pick 2-3 RANDOM subreddit topics to naturally weave in (increases diversity)
    const shuffledTopics = [...subreddit.commonTopics].sort(() => Math.random() - 0.5);
    const relevantTopics = shuffledTopics.slice(0, 3).join(', ');

    // Select a target query from keywords (if provided)
    const targetQuery = keywords.length > 0
        ? keywords[Math.floor(Math.random() * keywords.length)]
        : null;

    // Emotion-first scenario setup
    const emotionScenario = template.emotion === 'frustration'
        ? `You're frustrated right now. You've spent hours on this and it's not working.`
        : template.emotion === 'curiosity'
        ? `You're genuinely curious and slightly confused about this.`
        : `You're dealing with this issue and need input.`;

    return `You're ${persona.name}. ${persona.backstory}

THE SITUATION:
${emotionScenario} You're posting in r/${subreddit.name} because you need to vent or get help.
${targetQuery ? `Someone who searches "${targetQuery}" should find your post relatable.` : ''}

WHAT HAPPENED:
- Something specific happened recently (yesterday, last week, this morning)
- Include a number (hours spent, slides made, revisions done)
- You're working on: ${relevantTopics}
- End with a genuine question

HOW YOU WRITE:
${persona.vocabulary.formality < 0.4 ? 'Very casual - like texting' : persona.vocabulary.formality > 0.6 ? 'Professional but still human' : 'Conversational'}

TYPE FAST (60-100 words):
Just vent about what's frustrating you. Type like you're annoyed and not editing much.

Real examples:
${getRandomExamples([
    "spent 3 hours last night on slides and nothing lines up right. like idk maybe im just bad at this",
    "5th revision of this deck and honestly just wanna delete everything lol",
    "had a client call yesterday and realized my slides looked terrible. not great"
], 2)}

OUTPUT ONLY YOUR POST. Start typing now:`;
}

/**
 * Build prompt for generating a comment
 */
export function buildCommentPrompt(
    template: CommentTemplate,
    persona: Persona,
    company: CompanyContext,
    subreddit: SubredditContext,
    postContent: string,
    posterName: string,
    keywords: string[] = []
): string {
    // Purpose-specific instructions to ensure variety
    const purposeInstructions = getPurposeInstructions(template.purpose, posterName, company);

    // Select a target query from keywords for SEO (if provided and this is a helpful comment)
    const targetQuery = keywords.length > 0 && !template.productMention
        ? keywords[Math.floor(Math.random() * keywords.length)]
        : null;

    const productMentionInstructions = template.productMention
        ? `
PRODUCT MENTION (REQUIRED):
You should mention "${company.name}" in this comment.
- Framing: ${template.productFraming || 'casual_mention'}
- Make it sound NATURAL and from PERSONAL EXPERIENCE
- Use phrases like: "I started using..." or "One thing that helped me was..."
- Mention 1 specific feature: ${company.valuePropositions[Math.floor(Math.random() * company.valuePropositions.length)]}
- Include a LIMITATION or caveat: "It's not perfect but..." or "Still have to tweak sometimes, but..."
- Frame as personal experience, NOT recommendation
- NEVER say: "you should try", "I recommend", "the best"
- DO say: "I've been using", "what worked for me", "in my experience"`
        : `
CRITICAL: DO NOT mention any specific product, tool, or app names.
DO NOT provide solutions or fixes.
Focus ONLY on: ${purposeInstructions}`;

    // Simplify purpose to emotion/action
    const simpleTask = template.purpose.includes('validate') || template.purpose.includes('empathy')
        ? 'Empathize - they need to know they\'re not alone'
        : template.purpose.includes('question')
        ? 'Ask them a quick clarifying question'
        : template.purpose.includes('suggest') || template.purpose.includes('approach')
        ? 'Share a quick tip from your experience'
        : template.productMention
        ? `Mention ${company.name} casually - like "I've been using [tool]" not "I recommend"`
        : 'React naturally to what they said';

    return `You're ${persona.name} commenting on u/${posterName}'s post:
"${postContent}"

YOUR REACTION:
${simpleTask}

${productMentionInstructions}

TYPE QUICK (30-60 words):
${persona.vocabulary.formality < 0.4 ? 'Type casually' : 'Be conversational, not corporate'}

Examples:
${getRandomExamples([
    "ugh yeah been there. so annoying",
    "honestly same lol",
    "wait have you tried templates? saves so much time"
], 2)}

OUTPUT ONLY YOUR COMMENT:`;
}

/**
 * Get purpose-specific instructions for comment
 */
function getPurposeInstructions(purpose: string, posterName: string, company: CompanyContext): string {
    switch (purpose) {
        case 'validate_problem':
            return `VALIDATE ${posterName}'s frustration.
- Express empathy: "I feel this" or "This is so relatable"
- Share that you've experienced something similar
- DO NOT offer solutions or advice yet
- Just let them know they're not alone`;

        case 'ask_clarifying_question':
            return `Ask a CLARIFYING QUESTION to understand better.
- Ask about their specific workflow or setup
- Examples: "What's your timeline on this?" or "Are you working solo or with a team?"
- Show genuine curiosity
- This builds engagement and makes the thread feel real`;

        case 'share_similar_experience':
            return `Share YOUR similar experience with this problem.
- Describe a specific time you dealt with this
- Include a detail: when it happened, how it felt
- Don't offer solutions yet - just relate
- Build trust through shared experience`;

        case 'empathy_validation':
            return `Pure EMPATHY response.
- Acknowledge how frustrating this is
- Maybe share a brief similar experience
- Use supportive language
- NO solutions, NO advice - just validation`;

        case 'suggest_approach':
        case 'workflow_suggestion':
            return `Suggest a GENERAL approach or workflow tip.
- Give practical advice from your experience
- Do NOT mention any specific tools/products
- Focus on process, methodology, or mindset
- Be helpful but not preachy`;

        case 'balanced_comparison':
            return `Give a BALANCED view comparing different approaches.
- Acknowledge pros and cons
- Be fair and nuanced
- Include your personal experience with ${company.name}
- Mention what it's good at AND where it falls short`;

        default:
            return `Respond helpfully to ${posterName}'s post.
- Add value to the conversation
- Be genuine and helpful`;
    }
}

/**
 * Build prompt for generating a reply
 */
export function buildReplyPrompt(
    template: ReplyTemplate,
    persona: Persona,
    subreddit: SubredditContext,
    postContent: string,
    parentCommentContent: string,
    isOP: boolean
): string {
    return `You are ${persona.name} ${isOP ? '(the OP)' : ''}.

Parent comment you're replying to:
"${parentCommentContent}"

REPLY QUICKLY (you're typing fast):
- ${isOP ? 'Thank them or ask a quick follow-up' : 'Add a quick thought or agree'}
- Tone: ${template.tone}
- Keep it VERY SHORT: 5-20 words (1-2 sentences max)
- Sound ${persona.vocabulary.formality < 0.4 ? 'casual' : 'human'}

REAL REDDIT REPLY EXAMPLES (emulate this brevity):
${getRandomExamples([
    "yeah that makes sense, thanks",
    "oh interesting, hadn't thought of that",
    "lol same honestly",
    "wait really? gonna try this",
    "appreciate it!",
    "huh, good point actually",
    "nice, will check this out",
    "ok yeah that tracks",
    "oooh smart, didn't think of that",
    "yeah fair enough",
    "thanks for this!",
    "solid advice tbh"
], 3)}

OUTPUT ONLY THE REPLY TEXT. NO PREAMBLE. JUST 1-2 SENTENCES.`;
}

/**
 * Build prompt for Gemini API with system context
 */
export function buildGeminiPrompt(userPrompt: string): string {
    return `${userPrompt}

FINAL REMINDER: Output ONLY the content requested. No meta-commentary, no "Here's what I created:", no explanations. Just the raw text that would appear on Reddit.`;
}
