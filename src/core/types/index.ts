// ============================================
// CORE CONVERSATION STRUCTURES
// ============================================

export interface CompanyContext {
    name: string;                          // "SlideForge"
    product: string;                       // "AI-powered presentation tool"
    valuePropositions: string[];           // ["Automates layouts", "Saves time"]
    keywords: string[];                    // ["presentation tool", "slide deck"]
    activities?: string[];                 // ["creating pitch decks", "fixing slide layouts"]
}

export interface PersonaVocabulary {
    characteristic: string[];              // [" honestly", "literally", "chaotic"]
    avoid: string[];                       // ["fundamentally", "essentially"]
    formality: number;                     // 0-1 scale (0=casual, 1=formal)
}

export interface CommunicationStyle {
    default: 'casual' | 'professional' | 'technical';
    acceptable: string[];
}

export interface Persona {
    id: string;                            // "riley_ops"
    name: string;                          // "Riley Hart"
    role: string;                          // "Head of Operations at startup"
    backstory: string;                     // Full persona description
    vocabulary: PersonaVocabulary;
    communicationStyle: CommunicationStyle;
    redditPattern: 'always_online' | 'periodic_checker' | 'evening_browser';
    experienceLevel: 'low' | 'medium' | 'high';
    interests: string[];                   // ["productivity", "operations"]
}

export type SubredditCulture = 'technical' | 'casual' | 'professional' | 'academic';
export type ModerationLevel = 'strict' | 'moderate' | 'relaxed';
export type PromotionTolerance = 'zero' | 'low' | 'moderate';

export interface SubredditContext {
    name: string;                          // "r/productivity"
    culture: SubredditCulture;
    formalityLevel: number;                // 0-1 scale
    typicalCommentLength: {
        min: number;                         // 50
        max: number;                         // 300
    };
    acceptableMarkers: string[];           // ["lol", "tbh", "honestly"]
    avoidMarkers: string[];                // ["academic jargon"]
    moderationLevel: ModerationLevel;
    promotionTolerance: PromotionTolerance;
    commonTopics: string[];                // Current trending topics
}

export interface Post {
    id: string;
    persona: Persona;
    subreddit: string;
    content: string;
    emotion: 'frustration' | 'excitement' | 'curiosity';
    keywords: string[];
    scheduledTime: Date;
}

export interface Comment {
    id: string;
    persona: Persona;
    content: string;
    scheduledTime: Date;
    replyTo: 'post' | string;             // 'post' or comment id
    purpose: string;                       // "validate_problem", "suggest_approach"
    productMention: boolean;
}

export interface Reply {
    id: string;
    persona: Persona;
    content: string;
    scheduledTime: Date;
    parentCommentId: string;
    replyType: 'op_followup' | 'commenter_elaboration' | 'cross_commenter';
}

export interface ConversationThread {
    id: string;
    post: Post;
    topLevelComments: Comment[];
    replies: Reply[];
    arcType: 'discovery' | 'comparison' | 'problemSolver';
    qualityScore: QualityScore;
    subreddit: string;
}

// ============================================
// QUALITY & SAFETY STRUCTURES
// ============================================

export interface QualityDimensions {
    subredditRelevance: number;          // 0-20
    problemSpecificity: number;          // 0-20
    authenticity: number;                // 0-25
    valueFirst: number;                  // 0-20
    engagementDesign: number;            // 0-15
}

export interface Issue {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    suggestion: string;
    location?: string;                     // Which part of conversation
}

export interface Strength {
    type: string;
    message: string;
    example: string;
}

export interface QualityScore {
    overall: number;                       // 0-100
    dimensions: QualityDimensions;
    grade: 'excellent' | 'good' | 'needs_improvement' | 'poor';
    issues: Issue[];
    strengths: Strength[];
    suggestions: string[];
}

export interface CheckResult {
    passed: boolean;
    score: number;                         // 0-1
    details: string;
}

export interface Violation {
    type: string;
    severity: 'high' | 'critical';
    message: string;
    fix: string;
}

export interface Warning {
    type: string;
    severity: 'low' | 'medium';
    message: string;
    recommendation: string;
}

export interface SafetyReport {
    passed: boolean;
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    checks: {
        accountReadiness: CheckResult;
        frequencyLimits: CheckResult;
        timingRealism: CheckResult;
        collusionPatterns: CheckResult;
        contentSimilarity: CheckResult;
    };
    violations: Violation[];
    warnings: Warning[];
    recommendations: string[];
}

// ============================================
// TIMING & SCHEDULING STRUCTURES
// ============================================

export interface TimeWindow {
    start: number;                         // Hour (0-23)
    end: number;
}

export interface PersonaTiming {
    timezone: string;                      // "America/New_York"
    activeHours: TimeWindow[];
    peakActivity: number[];                // Hours: [10, 14, 16]
    weekendPattern: 'active' | 'reduced' | 'offline';
    typicalResponseDelay: {
        min: number;                         // minutes
        max: number;
    };
}

export interface ScheduledConversation {
    conversation: ConversationThread;
    scheduledTime: Date;
    commentTimings: Date[];
    replyTimings: Date[];
}

// ============================================
// ACCOUNT HISTORY STRUCTURES
// ============================================

export interface AccountHistory {
    personaId: string;
    accountAge: number;                    // days
    karma: number;
    commentHistory: Comment[];
    postHistory: Post[];
    subredditActivity: Map<string, number>; // subreddit -> post count
    productMentions: number;
    lastProductMention: Date | null;
    riskLevel: 'new' | 'establishing' | 'trusted';
}

// ============================================
// GENERATION INPUT/OUTPUT
// ============================================

export interface GenerationInput {
    company: CompanyContext;
    personas: Persona[];
    subreddits: string[];
    keywords: string[];
    postsPerWeek: number;
    qualityThreshold: number;              // Minimum acceptable score (0-100)
    weekNumber?: number;                   // Week number (default: 1)
    previousWeeks?: WeekCalendar[];        // Previous week calendars for context-aware generation
}

export interface WeekCalendar {
    weekNumber: number;
    conversations: ScheduledConversation[];
    averageQuality: number;
    safetyReport: SafetyReport;
    metadata: {
        generatedAt: Date;
        totalConversations: number;
        subredditDistribution: Record<string, number> | Map<string, number>;
        personaUsage: Record<string, number> | Map<string, number>;
    };
}

// ============================================
// ARC TEMPLATES
// ============================================

export interface PostTemplate {
    tone: string;
    framing: string;
    emotion: 'frustration' | 'excitement' | 'curiosity';
    mentionProduct: boolean;
}

export interface CommentTemplate {
    purpose: string;
    tone: string;
    timingRange: {
        min: number;                         // minutes
        max: number;
    };
    productMention: boolean;
    productFraming?: string;
}

export interface ReplyTemplate {
    replyType: 'op_followup' | 'commenter_elaboration' | 'cross_commenter';
    purpose: string;
    tone: string;
}

export interface ArcTemplate {
    type: 'discovery' | 'comparison' | 'problemSolver';
    name: string;
    description: string;
    postTemplate: PostTemplate;
    commentTemplates: CommentTemplate[];
    replyTemplates: ReplyTemplate[];
}
