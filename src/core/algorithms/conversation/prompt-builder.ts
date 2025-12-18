import { Persona, SubredditContext, CompanyContext, PostTemplate, CommentTemplate, ReplyTemplate } from '@/core/types';
import { getFormattedExamples, AI_ANTI_PATTERNS } from '@/core/data/prompts/reddit-examples';

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function randomOrdinal(): string {
    const ordinals = ['2nd', '3rd', '4th', '5th', '6th', '7th'];
    return randomChoice(ordinals);
}

/**
 * Generate relevant activities from company context
 * Converts company product/value props into natural activity phrases
 */
function generateActivitiesFromCompany(company: CompanyContext): string[] {
    const activities: string[] = [];

    // Extract product name and type
    const productLower = company.product.toLowerCase();

    // Build activity phrases based on product type
    // Try to extract action verbs or create natural activities

    // Generic activities that work for any tool/service
    activities.push(`working with ${company.name}`);
    activities.push(`trying to use ${company.name}`);

    // PRIORITY: Use AI-extracted activities if available
    if (company.activities && company.activities.length > 0) {
        // Return mostly specific activities, plus 1-2 generic ones
        return [
            ...company.activities,
            `struggling with ${company.product.split(' ').slice(-2).join(' ')}` // "struggling with [last 2 words of product]"
        ].slice(0, 8);
    }

    // Extract activities from product description
    // Look for keywords that indicate activities
    if (productLower.includes('marketing')) {
        activities.push('running marketing campaigns');
        activities.push('doing marketing work');
    }
    if (productLower.includes('reddit')) {
        activities.push('posting on Reddit');
        activities.push('managing Reddit content');
    }
    if (productLower.includes('automation') || productLower.includes('automate')) {
        activities.push('trying to automate this');
        activities.push('setting up automation');
    }
    if (productLower.includes('presentation') || productLower.includes('slide') || productLower.includes('deck')) {
        activities.push('making slides');
        activities.push('building presentations');
        activities.push('creating pitch decks');
    }
    if (productLower.includes('design')) {
        activities.push('working on designs');
        activities.push('creating designs');
    }
    if (productLower.includes('content')) {
        activities.push('creating content');
        activities.push('managing content');
    }
    if (productLower.includes('crm') || productLower.includes('sales')) {
        activities.push('managing leads');
        activities.push('tracking customers');
    }
    if (productLower.includes('analytics') || productLower.includes('data')) {
        activities.push('analyzing data');
        activities.push('building reports');
    }

    // Extract from value propositions
    company.valuePropositions.forEach(vp => {
        const vpLower = vp.toLowerCase();
        // Look for action verbs
        if (vpLower.includes('generate')) {
            const match = vpLower.match(/generates?\s+([\w\s]+)/);
            if (match) activities.push(`generating ${match[1].trim()}`);
        }
        if (vpLower.includes('create')) {
            const match = vpLower.match(/creates?\s+([\w\s]+)/);
            if (match) activities.push(`creating ${match[1].trim()}`);
        }
        if (vpLower.includes('automate')) {
            const match = vpLower.match(/automates?\s+([\w\s]+)/);
            if (match) activities.push(`automating ${match[1].trim()}`);
        }
    });

    // Fallback: generic work activities
    if (activities.length < 4) {
        activities.push(`handling ${productLower}`);
        activities.push(`managing this workflow`);
        activities.push(`trying to optimize this process`);
    }

    // Return up to 6 activities (same as original hardcoded list)
    return activities.slice(0, 6);
}

function buildEmotionalScenario(
    emotion: string,
    persona: Persona,
    keywords: string[],
    company: CompanyContext
): string {
    // Generate activities dynamically from company context
    const activities = generateActivitiesFromCompany(company);
    const timeframes = ['yesterday', 'last week', 'this morning', 'last night', 'earlier today', 'over the weekend'];
    const stakeholders = ['client', 'boss', 'team', 'stakeholder', 'investor', 'professor', 'manager'];

    const scenarios: Record<string, string[]> = {
        frustration: [
            `You spent ${randomInt(2, 8)} hours ${randomChoice(timeframes)} ${randomChoice(activities)} and it's still not working right.`,
            `You have a ${randomChoice(stakeholders)} meeting ${randomChoice(['tomorrow', 'this afternoon', 'in 2 hours'])} and you're stressed about the results.`,
            `This is the ${randomOrdinal()} time this week you've dealt with this and you're honestly over it.`,
            `Your ${randomChoice(stakeholders)} asked for ${randomOrdinal()} revision and you just want to be done.`,
            `You've been ${randomChoice(activities)} for ${randomInt(3, 10)} hours and it still doesn't look right.`
        ],
        curiosity: [
            `You've been ${randomChoice(activities)} for ${randomChoice(['6 months', 'a year', 'the past few months'])} and wondering if there's a better way.`,
            `You saw ${randomChoice(['someone on twitter', 'a reddit post', 'a colleague'])} talking about this and now you're curious how others handle it.`,
            `Your ${randomChoice(['coworker', 'friend', 'teammate'])} mentioned ${randomChoice(['a tool', 'an approach', 'a workflow'])} and you want to understand it better.`,
            `You're doing research on how to ${randomChoice(['save time', 'work faster', 'be more efficient'])} with this.`
        ],
        excitement: [
            `You just discovered something that might solve your workflow issues.`,
            `Something clicked ${randomChoice(timeframes)} and you want to share what worked.`,
            `After ${randomChoice(['months', 'weeks', 'days'])} of struggling with ${randomChoice(activities)}, you finally figured out a solution.`
        ]
    };

    return randomChoice(scenarios[emotion] || scenarios['frustration']);
}

function getFormalityGuidance(persona: Persona): string {
    if (persona.vocabulary.formality < 0.4) {
        return 'Very casual - like texting a friend. Use lowercase, skip punctuation, be conversational.';
    } else if (persona.vocabulary.formality > 0.6) {
        return 'Professional but still human. Use proper grammar but stay conversational. Don\'t be corporate.';
    } else {
        return 'Conversational and natural. Mix casual and professional language.';
    }
}

function getEmotionalContext(emotion: string, persona: Persona): string {
    const contexts: Record<string, string[]> = {
        frustration: [
            `You've tried everything and nothing is working. You're running out of time and patience.`,
            `This should be simple but it's taking way longer than it should. You're annoyed.`,
            `You've spent hours on this and have nothing to show for it. You're stressed.`
        ],
        curiosity: [
            `You're genuinely interested in learning a better approach. You're open to suggestions.`,
            `You feel like you're doing something inefficiently and want to improve.`,
            `You saw someone else's workflow and it made you wonder if you're missing something.`
        ],
        excitement: [
            `You just figured something out and you're eager to share or validate it.`,
            `Something worked and you're relieved and a bit excited.`,
            `You discovered a solution and want to tell people about it.`
        ]
    };

    return randomChoice(contexts[emotion] || contexts['curiosity']);
}

/**
 * Builds a Reddit post prompt with chain-of-thought reasoning and few-shot learning.
 * 
 * @param template - Post template configuration
 * @param persona - Author persona
 * @param company - Company context
 * @param subreddit - Target subreddit context
 * @param keywords - SEO keywords
 * @returns Prompt string for generation
 */
export function buildPostPrompt(
    template: PostTemplate,
    persona: Persona,
    company: CompanyContext,
    subreddit: SubredditContext,
    keywords: string[]
): string {
    const subredditType = subreddit.formalityLevel < 0.4 ? 'casual' : subreddit.formalityLevel > 0.6 ? 'professional' : 'casual';
    const examples = getFormattedExamples('post', subredditType, template.emotion, 3);
    const emotionalScenario = buildEmotionalScenario(template.emotion, persona, keywords, company);
    const emotionalContext = getEmotionalContext(template.emotion, persona);
    const formalityGuidance = getFormalityGuidance(persona);
    const targetQuery = keywords.length > 0 ? randomChoice(keywords) : null;

    // Generate company-specific working context
    const companyActivities = generateActivitiesFromCompany(company);
    const workingContext = companyActivities.slice(0, 3).join(', ');

    return `You are ${persona.name}. ${persona.backstory}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  BEFORE YOU WRITE, THINK THROUGH THIS ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(Don't output this thinking - it's just for you to mentally prepare)

1. EMOTIONAL STATE CHECK
   What are you feeling right now?
   → You're feeling: ${template.emotion}
   → Why? ${emotionalContext}
   → How intense? ${template.emotion === 'frustration' ? 'Pretty frustrated, typing with emotion' : 'Moderately, but genuine'}

2. SPECIFIC SITUATION
   What EXACTLY happened?
   → When: Think of a recent, specific timeframe
   → Numbers: What numbers make this REAL? (hours spent, revisions made, days working)
   → Stakes: Why do you actually care? What's at risk?

   Your situation: ${emotionalScenario}

3. YOUR AUTHENTIC VOICE
   How would ${persona.name} ACTUALLY type this on Reddit?
   → Formality: ${formalityGuidance}
   → Words you USE: ${persona.vocabulary.characteristic.slice(0, 8).join(', ')}
   → Words you NEVER say: ${persona.vocabulary.avoid.slice(0, 5).join(', ')}
   → You're typing on your phone, kind of quickly, not overthinking it

4. IMPERFECTIONS TO INCLUDE
   You're human, not a robot:
   ${subreddit.formalityLevel < 0.5 ? '→ Lowercase "i" is fine (you\'re typing fast)' : '→ Proper grammar but still casual'}
   ${subreddit.formalityLevel < 0.5 ? '→ Skip ending punctuation (casual vibe)' : '→ Some punctuation but not perfect'}
   → Maybe one small typo (optional)
   → Short sentences are good

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✍️  NOW WRITE YOUR POST FOR r/${subreddit.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTEXT:
• You're posting because: ${template.emotion === 'frustration' ? 'you need to vent and maybe get help' : 'you\'re genuinely curious and want input'}
• You're working on: ${workingContext}
${targetQuery ? `• Someone searching "${targetQuery}" should find this relatable` : ''}

YOUR POST SHOULD:
✓ Be 60-100 words (not longer)
✓ Include a SPECIFIC NUMBER or TIMEFRAME (makes it real)
✓ End with a GENUINE QUESTION
✓ Sound like YOU typing FAST - emotional and unedited
✓ NO solutions or tool mentions - you're asking for help, not giving it

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 REAL REDDIT EXAMPLES (match this vibe!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${examples}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ DO NOT DO THESE (AI anti-patterns)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• DON'T use: ${AI_ANTI_PATTERNS.slice(3, 8).join(', ')}
• DON'T write perfectly formatted paragraphs
• DON'T sound like corporate speak or an essay
• DON'T be overly helpful or polite - you're frustrated!
• DON'T include disclaimers or caveats

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

START TYPING YOUR POST NOW (only output the post, no preamble):`;
}

function getPurposeInstructions(purpose: string, posterName: string, company: CompanyContext): string {
    const instructions: Record<string, string> = {
        validate_problem: `Your ONLY job: Make ${posterName} feel understood.

        ✓ Express empathy: "ugh i felt this" or "been there so many times"
        ✓ Share that you've experienced similar (briefly)
        ✓ Make them feel NOT ALONE

        ✗ DON'T offer solutions yet
        ✗ DON'T mention tools or products
        ✗ DON'T be overly helpful

        Just validate their frustration. That's it.`,

        ask_clarifying_question: `Ask ONE specific question to understand their situation better.

        Good questions:
        • "wait are you working solo or with a team?"
        • "how much volume are we talking?"
        • "what is the specific use case?"

        ✓ Show genuine curiosity
        ✓ Keep it SHORT (one question only)
        ✓ This helps thread feel real

        ✗ DON'T give advice yet`,

        share_similar_experience: `Share YOUR specific experience with this same problem.

        ✓ Describe a SPECIFIC time this happened to you
        ✓ Include a detail: when, how it felt, what happened
        ✓ Make it relatable and human
        ✓ Don't offer solutions - just relate

        Example: "dude i spent my entire weekend on slides last month. it was pain"`,

        empathy_validation: `Pure empathy response. No solutions.

        ✓ Acknowledge how frustrating/annoying/difficult this is
        ✓ Maybe share brief similar struggle
        ✓ Be supportive and understanding

        ✗ NO advice
        ✗ NO solutions
        ✗ NO tool mentions

        Just: "yeah this sucks" energy`,

        suggest_approach: `Share a GENERAL workflow tip or approach (no specific tools).

        ✓ Give practical advice from YOUR experience
        ✓ Focus on process, methodology, or mindset
        ✓ Be helpful but casual
        ✓ Include a limitation ("it's not perfect but...")

        ✗ DON'T mention specific product names
        ✗ DON'T be preachy

        Example: "one thing that helped me was making a template library. still manual but faster"`,

        workflow_suggestion: `Suggest a workflow improvement (general, no tools).

        ✓ Share what worked for you
        ✓ Be specific about the approach
        ✓ Include honest limitations
        ✓ Casual tone`,

        balanced_comparison: `Give a BALANCED view of different approaches.

        ✓ Acknowledge pros AND cons
        ✓ Be fair and nuanced
        ✓ Can mention ${company.name} here IF template says so
        ✓ Mention what it's good at AND where it falls short

        Example: "i've tried both. X is faster but Y has better quality. depends what you need"`
    };

    return instructions[purpose] || `Respond helpfully to ${posterName}'s post. Add value naturally.`;
}

/**
 * Builds a Reddit comment prompt.
 * 
 * @param template - Comment template configuration
 * @param persona - Author persona  
 * @param company - Company context
 * @param subreddit - Target subreddit context
 * @param postContent - The post being commented on
 * @param posterName - Username of post author
 * @param keywords - SEO keywords
 * @returns Prompt string for generation
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
    // Select relevant Reddit examples
    const subredditType = subreddit.formalityLevel < 0.4 ? 'casual' : subreddit.formalityLevel > 0.6 ? 'professional' : 'casual';
    const commentEmotion = template.purpose.includes('validate') || template.purpose.includes('empathy') ? 'empathy'
        : template.purpose.includes('question') ? 'curiosity'
            : 'analytical';
    const examples = getFormattedExamples('comment', subredditType, commentEmotion, 2);

    const purposeInstructions = getPurposeInstructions(template.purpose, posterName, company);
    const formalityGuidance = getFormalityGuidance(persona);
    const productMentionInstructions = template.productMention
        ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 PRODUCT MENTION (REQUIRED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You should mention "${company.name}" in this comment.

HOW TO FRAME IT (${template.productFraming || 'casual_mention'}):
✓ Make it sound NATURAL and from PERSONAL EXPERIENCE
✓ Use phrases: "i started using..." or "one thing that helped me was..."
✓ Mention 1 specific feature: "${randomChoice(company.valuePropositions)}"
✓ Include a LIMITATION: "it's not perfect but..." or "still have to tweak sometimes..."
✓ Frame as YOUR experience, NOT a recommendation

NEVER SAY:
✗ "you should try"
✗ "I recommend"
✗ "the best tool"
✗ "definitely use this"

DO SAY:
✓ "i've been using"
✓ "what worked for me"
✓ "in my experience"
✓ "i tried X and it helps with Y"

Example: "ngl i started using [tool] a few months ago and it cut my time like 30%. still not perfect but way better than manually doing everything"`
        : `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  CRITICAL: NO PRODUCT MENTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT mention ANY specific products, tools, or app names.
Focus ONLY on: ${template.purpose}`;

    return `You're ${persona.name} commenting on u/${posterName}'s post in r/${subreddit.name}:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 THE POST YOU'RE RESPONDING TO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"${postContent}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR TASK (be specific):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${purposeInstructions}

${productMentionInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✍️  HOW TO WRITE THIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Length: 30-60 words (not longer!)
• Tone: ${formalityGuidance}
• Voice: ${persona.vocabulary.characteristic.slice(0, 5).join(', ')}
• You're typing QUICKLY, not overthinking

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 REAL REDDIT EXAMPLES (match this energy!):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${examples}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OUTPUT ONLY YOUR COMMENT (no preamble, no "Here's my response"):`;
}

/**
 * Builds a Reddit reply prompt.
 * 
 * @param template - Reply template configuration
 * @param persona - Author persona
 * @param subreddit - Target subreddit context  
 * @param postContent - Original post content
 * @param parentCommentContent - Comment being replied to
 * @param isOP - Whether the author is the original poster
 * @returns Prompt string for generation
 */
export function buildReplyPrompt(
    template: ReplyTemplate,
    persona: Persona,
    subreddit: SubredditContext,
    postContent: string,
    parentCommentContent: string,
    isOP: boolean
): string {
    // Select relevant Reddit examples
    const subredditType = subreddit.formalityLevel < 0.4 ? 'casual' : subreddit.formalityLevel > 0.6 ? 'professional' : 'casual';
    const replyEmotion = template.purpose.includes('thank') ? 'relief' : template.purpose.includes('question') ? 'curiosity' : 'empathy';
    const examples = getFormattedExamples('reply', subredditType, replyEmotion, 4);

    const toneGuidance: Record<string, string> = {
        grateful: 'thankful and appreciative',
        curious: 'asking a quick follow-up question',
        thoughtful: 'processing what they said',
        enthusiastic: 'excited and energized',
        brief_grateful: 'quick thanks',
        relieved: 'feeling better, validated'
    };

    const guidance = toneGuidance[template.tone] || 'natural and conversational';

    return `You are ${persona.name} ${isOP ? '(the OP)' : ''}.

Parent comment you're replying to:
"${parentCommentContent}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ REPLY SUPER QUICKLY (you're on your phone!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task: ${isOP ? 'Thank them or ask a quick follow-up' : 'Add a quick thought or agreement'}
Tone: ${guidance}
Length: 5-20 words MAX (1-2 sentences, seriously keep it SHORT)

Your vibe: ${persona.vocabulary.formality < 0.4 ? 'casual and quick' : 'natural but not overly formal'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 REAL REDDIT REPLIES (emulate this BREVITY!):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${examples}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ CRITICAL: DO NOT OVER-WRITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replies are SHORT. Like, really short.
If you write more than 2 sentences, you failed.
Think: text message, not email.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OUTPUT ONLY THE REPLY TEXT (no preamble, just the reply):`;
}

export function wrapWithSystemPrompt(userPrompt: string): string {
    return `${userPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 FINAL CRITICAL REMINDERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Output ONLY the content requested (post/comment/reply)
2. NO meta-commentary like "Here's what I created:"
3. NO explanations or preambles
4. NO disclaimers or "as an AI" statements
5. Just the raw text that would appear on Reddit

This is not practice. This is the real thing. Type naturally.`;
}
