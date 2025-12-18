'use client';

import { AlertCircle, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';

interface FrequencyCalculatorProps {
    postsPerWeek: number;
    personaCount: number;
    subredditCount: number;
}

interface CalculationResult {
    postsPerSubreddit: number;
    postsPerPersona: number;
    productMentions: number;
    exceedsSubredditLimit: boolean;
    exceedsPersonaLimit: boolean;
    status: 'valid' | 'warning' | 'error';
    issues: string[];
    recommendations: string[];
}

const LIMITS = {
    POSTS_PER_SUBREDDIT: 2,
    POSTS_PER_PERSONA: 7,
    PRODUCT_MENTIONS_PER_PERSONA: 2
};

function calculateFrequency(
    postsPerWeek: number,
    personaCount: number,
    subredditCount: number
): CalculationResult {
    const postsPerSubreddit = subredditCount > 0 ? Math.ceil(postsPerWeek / subredditCount) : 0;
    const postsPerPersona = personaCount > 0 ? Math.ceil(postsPerWeek / personaCount) : 0;
    const productMentions = Math.min(postsPerWeek, personaCount * 2);

    const exceedsSubredditLimit = postsPerSubreddit > LIMITS.POSTS_PER_SUBREDDIT;
    const exceedsPersonaLimit = postsPerPersona > LIMITS.POSTS_PER_PERSONA;

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (exceedsSubredditLimit) {
        const needed = Math.ceil(postsPerWeek / LIMITS.POSTS_PER_SUBREDDIT) - subredditCount;
        issues.push(`${postsPerSubreddit} posts per subreddit exceeds limit of ${LIMITS.POSTS_PER_SUBREDDIT}`);
        recommendations.push(`Add ${needed} more ${needed === 1 ? 'subreddit' : 'subreddits'} or reduce to ${subredditCount * LIMITS.POSTS_PER_SUBREDDIT} posts/week`);
    }

    if (exceedsPersonaLimit) {
        const needed = Math.ceil(postsPerWeek / LIMITS.POSTS_PER_PERSONA) - personaCount;
        issues.push(`${postsPerPersona} posts per persona exceeds limit of ${LIMITS.POSTS_PER_PERSONA}`);
        recommendations.push(`Add ${needed} more ${needed === 1 ? 'persona' : 'personas'} or reduce to ${personaCount * LIMITS.POSTS_PER_PERSONA} posts/week`);
    }

    // Provide optimization suggestions even when valid
    if (!exceedsSubredditLimit && !exceedsPersonaLimit) {
        if (personaCount === 1) {
            recommendations.push('Consider using 3-5 personas for more authentic campaigns');
        }
        if (subredditCount === 1) {
            recommendations.push('Multiple subreddits increase reach and reduce spam risk');
        }
        if (postsPerWeek < 5) {
            recommendations.push('5-7 posts per week is optimal for consistent presence');
        }
    }

    let status: 'valid' | 'warning' | 'error' = 'valid';
    if (exceedsSubredditLimit || exceedsPersonaLimit) {
        status = 'error';
    } else if (personaCount < 3 || subredditCount < 2) {
        status = 'warning';
    }

    return {
        postsPerSubreddit,
        postsPerPersona,
        productMentions,
        exceedsSubredditLimit,
        exceedsPersonaLimit,
        status,
        issues,
        recommendations
    };
}

export function FrequencyCalculator({
    postsPerWeek,
    personaCount,
    subredditCount
}: FrequencyCalculatorProps) {
    if (personaCount === 0 || subredditCount === 0) {
        return null;
    }

    const calc = calculateFrequency(postsPerWeek, personaCount, subredditCount);

    const StatusIcon = calc.status === 'valid' ? CheckCircle2 : calc.status === 'warning' ? AlertTriangle : AlertCircle;
    const statusColor = calc.status === 'valid' ? 'text-emerald-600' : calc.status === 'warning' ? 'text-amber-600' : 'text-red-600';
    const bgColor = calc.status === 'valid' ? 'bg-emerald-50 border-emerald-200' : calc.status === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

    return (
        <div className={`rounded-lg border p-3 space-y-3 ${bgColor}`}>
            {/* Header */}
            <div className="flex items-center gap-2">
                <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                <span className={`text-xs font-semibold ${statusColor}`}>
                    {calc.status === 'valid' ? 'Configuration Valid' : calc.status === 'warning' ? 'Configuration Warning' : 'Configuration Error'}
                </span>
            </div>

            {/* Distribution */}
            <div className="space-y-2">
                <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wide">
                    Distribution
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/50 rounded px-2 py-1.5">
                        <div className="text-[10px] text-zinc-500">Per Subreddit</div>
                        <div className={`font-mono font-semibold ${calc.exceedsSubredditLimit ? 'text-red-600' : 'text-zinc-900'}`}>
                            {calc.postsPerSubreddit} / {LIMITS.POSTS_PER_SUBREDDIT}
                        </div>
                    </div>

                    <div className="bg-white/50 rounded px-2 py-1.5">
                        <div className="text-[10px] text-zinc-500">Per Persona</div>
                        <div className={`font-mono font-semibold ${calc.exceedsPersonaLimit ? 'text-red-600' : 'text-zinc-900'}`}>
                            {calc.postsPerPersona} / {LIMITS.POSTS_PER_PERSONA}
                        </div>
                    </div>
                </div>
            </div>

            {/* Issues */}
            {calc.issues.length > 0 && (
                <div className="space-y-1">
                    {calc.issues.map((issue, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs">
                            <AlertCircle className={`w-3 h-3 flex-shrink-0 mt-0.5 ${statusColor}`} />
                            <span className={statusColor}>{issue}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Recommendations */}
            {calc.recommendations.length > 0 && (
                <div className="space-y-1">
                    {calc.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs">
                            <Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5 text-blue-600" />
                            <span className="text-blue-700">{rec}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
