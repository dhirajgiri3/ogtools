/**
 * Reddit Examples Library
 *
 * Comprehensive collection of real Reddit writing patterns for few-shot learning.
 * Each example is annotated with features, emotion, and quality rating.
 *
 * Used by prompt-builder.ts to inject authentic examples into generation prompts.
 */

export interface RedditExample {
    type: 'post' | 'comment' | 'reply';
    subredditType: 'casual' | 'professional' | 'technical';
    emotion: 'frustration' | 'curiosity' | 'excitement' | 'relief' | 'empathy' | 'analytical';
    content: string;
    features: string[];
    qualityRating: number; // 1-10, how authentic this feels
}

export interface PromptTemplate {
    name: string;
    systemPrompt: string;
    userPromptTemplate: string;
    fewShotExamples: RedditExample[];
    chainOfThought?: string[];
    antiPatterns: string[];
}

// ============================================
// POST EXAMPLES - Casual Subreddits
// ============================================

export const CASUAL_FRUSTRATION_POSTS: RedditExample[] = [
    {
        type: 'post',
        subredditType: 'casual',
        emotion: 'frustration',
        content: "spent like 3 hours yesterday trying to get my slides to not look terrible and honestly idk if it even worked. client meeting this afternoon and im lowkey stressed lol. anyone else just bad at design or is it just me",
        features: [
            "lowercase i",
            "no ending punctuation",
            "casual markers (lol, lowkey, idk)",
            "relatable question",
            "specific timeframe (3 hours, yesterday)",
            "real stakes (client meeting)"
        ],
        qualityRating: 9
    },
    {
        type: 'post',
        subredditType: 'casual',
        emotion: 'frustration',
        content: "5th revision of this deck and honestly just wanna delete everything lol. why does making slides take longer than the actual work",
        features: [
            "specific number (5th)",
            "lowercase start",
            "no ending punctuation",
            "casual marker (lol)",
            "rhetorical question",
            "relatable frustration"
        ],
        qualityRating: 9
    },
    {
        type: 'post',
        subredditType: 'casual',
        emotion: 'frustration',
        content: "had a client call yesterday and realized my slides looked terrible. spent 6 hours on them. not great. anyone have tips for making presentations not look like garbage quickly?",
        features: [
            "specific timeframe (yesterday, 6 hours)",
            "short sentence (not great)",
            "casual language (garbage)",
            "genuine question",
            "vulnerable admission"
        ],
        qualityRating: 8
    },
    {
        type: 'post',
        subredditType: 'casual',
        emotion: 'frustration',
        content: "why do i spend more time aligning shapes than doing actual work lol. this is my 4th presentation this week and im already over it",
        features: [
            "lowercase i",
            "no ending punctuation",
            "casual marker (lol)",
            "specific number (4th)",
            "specific timeframe (this week)",
            "relatable complaint"
        ],
        qualityRating: 9
    },
    {
        type: 'post',
        subredditType: 'casual',
        emotion: 'frustration',
        content: "spent my entire sunday making slides look professional and they still look mid. presentation is tomorrow and im stressing. does anyone else struggle with this or am i just incompetent lmao",
        features: [
            "lowercase i",
            "specific day (sunday)",
            "real deadline (tomorrow)",
            "gen-z slang (mid, lmao)",
            "self-deprecating",
            "relatable question"
        ],
        qualityRating: 9
    }
];

export const CASUAL_CURIOSITY_POSTS: RedditExample[] = [
    {
        type: 'post',
        subredditType: 'casual',
        emotion: 'curiosity',
        content: "been making like 3-4 presentations every week for the past 6 months and honestly wondering if theres a better way. currently just using google slides but feels super manual. what do yall use?",
        features: [
            "specific numbers (3-4, 6 months)",
            "casual language (yall)",
            "lowercase start",
            "no ending punctuation",
            "genuine question",
            "context sharing"
        ],
        qualityRating: 8
    },
    {
        type: 'post',
        subredditType: 'casual',
        emotion: 'curiosity',
        content: "saw someone mention using templates to save time on decks. do people actually use those or is it more work to customize them? genuinely curious bc i spend way too long on formatting",
        features: [
            "reference to other content",
            "genuine question",
            "casual marker (bc, genuinely curious)",
            "personal context (spend way too long)",
            "lowercase start"
        ],
        qualityRating: 8
    },
    {
        type: 'post',
        subredditType: 'casual',
        emotion: 'curiosity',
        content: "question for people who make a lot of presentations - how much time do you spend on them? i feel like i take forever (like 4-5 hours for a 15 slide deck) and idk if that's normal or if im just slow lol",
        features: [
            "specific numbers (4-5 hours, 15 slides)",
            "lowercase i",
            "casual markers (lol, idk)",
            "vulnerable admission (idk if im just slow)",
            "genuine question"
        ],
        qualityRating: 9
    },
    {
        type: 'post',
        subredditType: 'casual',
        emotion: 'curiosity',
        content: "doing research on presentation tools bc powerpoint is killing me. what does everyone here use? looking for something that doesnt require a design degree to make things look decent",
        features: [
            "casual language (bc, killing me)",
            "lowercase start",
            "no ending punctuation",
            "specific pain point",
            "genuine question"
        ],
        qualityRating: 8
    }
];

// ============================================
// POST EXAMPLES - Professional Subreddits
// ============================================

export const PROFESSIONAL_FRUSTRATION_POSTS: RedditExample[] = [
    {
        type: 'post',
        subredditType: 'professional',
        emotion: 'frustration',
        content: "Been working on stakeholder decks for the past 6 months and finding that layout consistency is eating up about 40% of my deck creation time. Curious how others handle this - do you have template systems, or just manually align everything? Currently using PowerPoint with custom templates but still spending 2-3 hours per deck on formatting.",
        features: [
            "specific timeframe (6 months)",
            "specific percentage (40%)",
            "specific numbers (2-3 hours)",
            "professional tone",
            "genuine question",
            "context provided",
            "tool mentioned (PowerPoint)"
        ],
        qualityRating: 9
    },
    {
        type: 'post',
        subredditType: 'professional',
        emotion: 'frustration',
        content: "Creating my 5th client deck this week and the repetitive formatting work is becoming a bottleneck. I'm spending roughly 3 hours per presentation just on layout and alignment when I should be focusing on content strategy. How do others in consulting manage this without sacrificing quality?",
        features: [
            "specific number (5th)",
            "specific timeframe (this week)",
            "specific time (3 hours)",
            "professional vocabulary (bottleneck, strategy)",
            "role context (consulting)",
            "genuine question"
        ],
        qualityRating: 8
    },
    {
        type: 'post',
        subredditType: 'professional',
        emotion: 'frustration',
        content: "Anyone else find themselves spending more time on slide formatting than actual analysis? I'm a consultant and probably 30-40% of my billable hours go to making decks look professional. This feels unsustainable. Would love to hear how others approach this.",
        features: [
            "specific percentage (30-40%)",
            "professional context (consultant, billable hours)",
            "measured tone",
            "relatable question",
            "specific vocabulary (analysis, professional)"
        ],
        qualityRating: 8
    }
];

export const PROFESSIONAL_CURIOSITY_POSTS: RedditExample[] = [
    {
        type: 'post',
        subredditType: 'professional',
        emotion: 'curiosity',
        content: "I've been exploring ways to streamline our presentation workflow. My team creates 10-15 client decks monthly, and we're spending significant time on formatting rather than strategy. Has anyone implemented automation or template systems that actually save time without compromising quality? Interested in both process improvements and tooling recommendations.",
        features: [
            "specific numbers (10-15, monthly)",
            "professional tone",
            "context provided (team, client decks)",
            "specific ask (automation, templates)",
            "balanced perspective (time vs quality)"
        ],
        qualityRating: 9
    },
    {
        type: 'post',
        subredditType: 'professional',
        emotion: 'curiosity',
        content: "Looking for perspectives on presentation creation tools. I manage a sales team that produces 20+ pitch decks per month. Currently using a mix of PowerPoint and Canva, but customization is time-intensive. What tools or workflows have people found effective for maintaining brand consistency while reducing production time?",
        features: [
            "specific numbers (20+, per month)",
            "role context (manage sales team)",
            "current tools mentioned",
            "specific criteria (brand consistency, time)",
            "professional vocabulary"
        ],
        qualityRating: 8
    }
];

// ============================================
// COMMENT EXAMPLES - Casual Subreddits
// ============================================

export const CASUAL_EMPATHY_COMMENTS: RedditExample[] = [
    {
        type: 'comment',
        subredditType: 'casual',
        emotion: 'empathy',
        content: "ugh yeah i felt this. been there so many times",
        features: [
            "lowercase i",
            "no ending punctuation",
            "casual interjection (ugh)",
            "short and punchy",
            "relatable"
        ],
        qualityRating: 10
    },
    {
        type: 'comment',
        subredditType: 'casual',
        emotion: 'empathy',
        content: "honestly same lol. spent 4 hours on a deck last week and it still looked meh",
        features: [
            "casual markers (honestly, lol, meh)",
            "lowercase start",
            "no ending punctuation",
            "specific example (4 hours, last week)",
            "relatable sharing"
        ],
        qualityRating: 9
    },
    {
        type: 'comment',
        subredditType: 'casual',
        emotion: 'empathy',
        content: "i feel this so hard. why is making slides harder than the actual work tho",
        features: [
            "lowercase i",
            "casual marker (tho)",
            "no ending punctuation",
            "emphatic language (so hard)",
            "rhetorical question"
        ],
        qualityRating: 9
    },
    {
        type: 'comment',
        subredditType: 'casual',
        emotion: 'empathy',
        content: "literally dealing with this rn. slides should not take this long to make",
        features: [
            "casual marker (literally, rn)",
            "lowercase start",
            "no ending punctuation",
            "present tense (happening now)",
            "relatable frustration"
        ],
        qualityRating: 9
    },
    {
        type: 'comment',
        subredditType: 'casual',
        emotion: 'empathy',
        content: "dude same. i spent my whole weekend on a presentation and it was pain",
        features: [
            "lowercase i",
            "casual address (dude)",
            "specific timeframe (whole weekend)",
            "casual language (was pain)",
            "no ending punctuation"
        ],
        qualityRating: 8
    }
];

export const CASUAL_CLARIFYING_COMMENTS: RedditExample[] = [
    {
        type: 'comment',
        subredditType: 'casual',
        emotion: 'curiosity',
        content: "wait are you working solo or with a team? that might change things",
        features: [
            "casual starter (wait)",
            "lowercase start",
            "no ending punctuation",
            "genuine question",
            "helpful context"
        ],
        qualityRating: 9
    },
    {
        type: 'comment',
        subredditType: 'casual',
        emotion: 'curiosity',
        content: "what kind of presentations are you making? like sales decks or more internal stuff",
        features: [
            "lowercase start",
            "casual filler (like)",
            "no ending punctuation",
            "specific question",
            "helpful clarification"
        ],
        qualityRating: 8
    },
    {
        type: 'comment',
        subredditType: 'casual',
        emotion: 'curiosity',
        content: "how many slides are we talking? bc if its like 50+ that's different than 10-15",
        features: [
            "lowercase start",
            "casual marker (bc)",
            "specific numbers (50+, 10-15)",
            "casual filler (like)",
            "no ending punctuation"
        ],
        qualityRating: 8
    }
];

export const CASUAL_HELPFUL_COMMENTS: RedditExample[] = [
    {
        type: 'comment',
        subredditType: 'casual',
        emotion: 'analytical',
        content: "tbh i started using master templates and it cuts my time in half. still not perfect but way better than manually formatting everything",
        features: [
            "casual marker (tbh)",
            "lowercase i",
            "specific benefit (cuts time in half)",
            "honest limitation (still not perfect)",
            "no ending punctuation"
        ],
        qualityRating: 9
    },
    {
        type: 'comment',
        subredditType: 'casual',
        emotion: 'analytical',
        content: "one thing that helped me was making a library of pre-formatted slides. copy paste is your friend lol. saves like 30-40 min per deck",
        features: [
            "lowercase start",
            "specific benefit (30-40 min)",
            "casual marker (lol)",
            "practical tip",
            "no ending punctuation"
        ],
        qualityRating: 8
    },
    {
        type: 'comment',
        subredditType: 'casual',
        emotion: 'analytical',
        content: "ngl i just stopped caring about perfect alignment. good enough is good enough. client has never noticed lol",
        features: [
            "casual markers (ngl, lol)",
            "lowercase i",
            "practical philosophy",
            "relatable admission",
            "no ending punctuation"
        ],
        qualityRating: 9
    }
];

// ============================================
// COMMENT EXAMPLES - Professional Subreddits
// ============================================

export const PROFESSIONAL_EMPATHY_COMMENTS: RedditExample[] = [
    {
        type: 'comment',
        subredditType: 'professional',
        emotion: 'empathy',
        content: "In my experience, the 2-3 hours you're spending is pretty normal for custom decks. It's frustrating but most consultants I know deal with the same issue.",
        features: [
            "professional opener (in my experience)",
            "specific numbers referenced",
            "validation",
            "measured tone",
            "professional vocabulary"
        ],
        qualityRating: 8
    },
    {
        type: 'comment',
        subredditType: 'professional',
        emotion: 'empathy',
        content: "I've been there. When I was at MBB, probably 40% of my time was formatting. It's not just you - this is a common pain point in consulting.",
        features: [
            "personal experience shared",
            "specific percentage (40%)",
            "industry reference (MBB)",
            "validation",
            "professional vocabulary"
        ],
        qualityRating: 9
    },
    {
        type: 'comment',
        subredditType: 'professional',
        emotion: 'empathy',
        content: "This resonates. I think most PMs struggle with balancing presentation quality and time investment. The context switching between strategic thinking and formatting is real.",
        features: [
            "professional language (resonates, context switching)",
            "role reference (PMs)",
            "specific issue identified",
            "measured tone",
            "validation"
        ],
        qualityRating: 8
    }
];

export const PROFESSIONAL_HELPFUL_COMMENTS: RedditExample[] = [
    {
        type: 'comment',
        subredditType: 'professional',
        emotion: 'analytical',
        content: "One approach that's worked for me is creating a master slide library with pre-formatted layouts. Still requires customization, but cuts my formatting time roughly in half. Not perfect, but a meaningful improvement.",
        features: [
            "professional opener",
            "specific solution",
            "honest limitation (not perfect)",
            "quantified benefit (roughly in half)",
            "measured language"
        ],
        qualityRating: 9
    },
    {
        type: 'comment',
        subredditType: 'professional',
        emotion: 'analytical',
        content: "From a workflow perspective, I've found that investing time upfront in templates pays dividends. At my firm, we built a library of ~50 standard layouts. Initial investment was significant, but ROI has been strong - estimate we save 30-40% on deck production time.",
        features: [
            "professional framing (workflow perspective, ROI)",
            "specific numbers (50 layouts, 30-40%)",
            "honest assessment (initial investment significant)",
            "professional vocabulary"
        ],
        qualityRating: 9
    },
    {
        type: 'comment',
        subredditType: 'professional',
        emotion: 'analytical',
        content: "Two things have helped me: (1) Creating reusable components rather than starting from scratch, and (2) Being more ruthless about \"good enough\" vs perfect. The second one was harder to internalize, but clients genuinely don't notice the difference between 90% polished and 100% polished.",
        features: [
            "structured response (numbered)",
            "specific strategies",
            "honest limitation",
            "client perspective",
            "professional tone"
        ],
        qualityRating: 8
    }
];

// ============================================
// REPLY EXAMPLES - Short and Punchy
// ============================================

export const CASUAL_REPLIES: RedditExample[] = [
    {
        type: 'reply',
        subredditType: 'casual',
        emotion: 'relief',
        content: "ok good not just me then lol",
        features: [
            "lowercase start",
            "casual marker (lol)",
            "very short",
            "relief expression",
            "no ending punctuation"
        ],
        qualityRating: 10
    },
    {
        type: 'reply',
        subredditType: 'casual',
        emotion: 'curiosity',
        content: "wait really? gonna look into this",
        features: [
            "lowercase start",
            "casual interjection (wait)",
            "action intent (gonna look into)",
            "very short",
            "no ending punctuation"
        ],
        qualityRating: 10
    },
    {
        type: 'reply',
        subredditType: 'casual',
        emotion: 'excitement',
        content: "oh damn this is exactly what i needed, thanks",
        features: [
            "lowercase start and i",
            "casual language (oh damn)",
            "gratitude",
            "specific (exactly what i needed)",
            "no ending punctuation"
        ],
        qualityRating: 9
    },
    {
        type: 'reply',
        subredditType: 'casual',
        emotion: 'empathy',
        content: "lol same honestly",
        features: [
            "lowercase start",
            "casual markers (lol, honestly)",
            "very short",
            "relatable",
            "no ending punctuation"
        ],
        qualityRating: 10
    },
    {
        type: 'reply',
        subredditType: 'casual',
        emotion: 'curiosity',
        content: "yeah that makes sense, thanks",
        features: [
            "lowercase start",
            "acknowledgment",
            "gratitude",
            "short",
            "no ending punctuation"
        ],
        qualityRating: 9
    },
    {
        type: 'reply',
        subredditType: 'casual',
        emotion: 'analytical',
        content: "huh good point actually. hadnt thought of that",
        features: [
            "lowercase start",
            "casual interjection (huh)",
            "missing apostrophe (hadnt)",
            "acknowledgment",
            "no ending punctuation"
        ],
        qualityRating: 9
    },
    {
        type: 'reply',
        subredditType: 'casual',
        emotion: 'excitement',
        content: "nice gonna try this tonight",
        features: [
            "lowercase start",
            "casual language (nice, gonna)",
            "action intent",
            "very short",
            "no ending punctuation"
        ],
        qualityRating: 10
    },
    {
        type: 'reply',
        subredditType: 'casual',
        emotion: 'relief',
        content: "appreciate it!",
        features: [
            "lowercase start",
            "gratitude",
            "very short",
            "exclamation for enthusiasm"
        ],
        qualityRating: 9
    }
];

export const PROFESSIONAL_REPLIES: RedditExample[] = [
    {
        type: 'reply',
        subredditType: 'professional',
        emotion: 'analytical',
        content: "That's a fair point. I'll give that approach a try.",
        features: [
            "professional tone",
            "acknowledgment",
            "action intent",
            "measured language"
        ],
        qualityRating: 8
    },
    {
        type: 'reply',
        subredditType: 'professional',
        emotion: 'curiosity',
        content: "Interesting. How long did it take to build that initial template library?",
        features: [
            "professional tone",
            "specific question",
            "short and focused"
        ],
        qualityRating: 8
    },
    {
        type: 'reply',
        subredditType: 'professional',
        emotion: 'relief',
        content: "Good to know I'm not alone in this. Thanks for the perspective.",
        features: [
            "validation seeking",
            "gratitude",
            "professional tone",
            "short"
        ],
        qualityRating: 8
    },
    {
        type: 'reply',
        subredditType: 'professional',
        emotion: 'excitement',
        content: "This is really helpful, appreciate it. Going to explore this approach.",
        features: [
            "gratitude",
            "action intent",
            "professional tone",
            "enthusiastic but measured"
        ],
        qualityRating: 8
    }
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get relevant examples filtered by criteria
 */
export function getRelevantExamples(
    contentType: 'post' | 'comment' | 'reply',
    subredditType: 'casual' | 'professional' | 'technical',
    emotion: string,
    count: number = 3
): RedditExample[] {
    // Build pool based on content type and subreddit type
    let pool: RedditExample[] = [];

    if (contentType === 'post') {
        if (subredditType === 'casual') {
            pool = [
                ...CASUAL_FRUSTRATION_POSTS,
                ...CASUAL_CURIOSITY_POSTS
            ];
        } else {
            pool = [
                ...PROFESSIONAL_FRUSTRATION_POSTS,
                ...PROFESSIONAL_CURIOSITY_POSTS
            ];
        }
    } else if (contentType === 'comment') {
        if (subredditType === 'casual') {
            pool = [
                ...CASUAL_EMPATHY_COMMENTS,
                ...CASUAL_CLARIFYING_COMMENTS,
                ...CASUAL_HELPFUL_COMMENTS
            ];
        } else {
            pool = [
                ...PROFESSIONAL_EMPATHY_COMMENTS,
                ...PROFESSIONAL_HELPFUL_COMMENTS
            ];
        }
    } else {
        pool = subredditType === 'casual' ? CASUAL_REPLIES : PROFESSIONAL_REPLIES;
    }

    // Filter by emotion and quality
    const filtered = pool.filter(ex =>
        ex.emotion === emotion &&
        ex.subredditType === subredditType &&
        ex.qualityRating >= 8
    );

    // If no exact emotion match, get any high-quality examples
    const finalPool = filtered.length > 0 ? filtered : pool.filter(ex => ex.qualityRating >= 8);

    // Shuffle and return requested count
    return shuffleArray(finalPool).slice(0, count);
}

/**
 * Format example for prompt display
 */
export function formatExampleForPrompt(example: RedditExample): string {
    return `"${example.content}"
→ Notice: ${example.features.join(', ')}`;
}

/**
 * Get multiple formatted examples
 */
export function getFormattedExamples(
    contentType: 'post' | 'comment' | 'reply',
    subredditType: 'casual' | 'professional' | 'technical',
    emotion: string,
    count: number = 3
): string {
    const examples = getRelevantExamples(contentType, subredditType, emotion, count);
    return examples.map((ex, i) => `Example ${i + 1}:\n${formatExampleForPrompt(ex)}`).join('\n\n');
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ============================================
// ANTI-PATTERNS TO AVOID
// ============================================

export const AI_ANTI_PATTERNS = [
    // Structure anti-patterns
    'numbered lists (1. 2. 3.)',
    'bulleted lists with perfect formatting',
    'perfectly formatted paragraphs',

    // Language anti-patterns
    'certainly', 'furthermore', 'moreover', 'additionally',
    'comprehensive', 'utilize', 'leverage', 'implement',
    'in conclusion', 'to summarize', 'in summary',
    'hope this helps', 'feel free to', 'don\'t hesitate',

    // Tone anti-patterns
    'overly helpful tone',
    'perfectly polished writing',
    'no contractions',
    'formal academic style',
    'corporate speak',

    // Reddit-specific anti-patterns
    'starting with "As an AI"',
    'disclaimers about not being expert',
    'overly cautious language',
    'perfect grammar and punctuation'
];

export const HUMAN_MARKERS_TO_PRESERVE = [
    'lowercase "i"',
    'missing punctuation at end',
    'casual markers (lol, tbh, ngl, fr)',
    'typos (teh, adn, waht)',
    'missing apostrophes (dont, cant)',
    'sentence fragments',
    'starting with lowercase',
    'ellipsis trails (...)',
    'double spaces',
    'rhetorical questions',
    'casual interjections (ugh, wait, oh)'
];
