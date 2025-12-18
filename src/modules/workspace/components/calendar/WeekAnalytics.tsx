'use client';

import { useMemo } from 'react';
import { Users, Hash, Clock, Shield, TrendingUp, AlertCircle } from 'lucide-react';
import { WeekCalendar } from '@/core/types';
import { Badge } from '@/shared/components/ui/feedback/badge';
import { Card } from '@/shared/components/ui/layout/card';

interface WeekAnalyticsProps {
    calendar: WeekCalendar;
}

export function WeekAnalytics({ calendar }: WeekAnalyticsProps) {
    // Calculate analytics
    const analytics = useMemo(() => {
        const conversations = calendar.conversations;

        // Persona distribution
        const personaUsage = new Map<string, number>();
        conversations.forEach(sc => {
            const personaName = sc.conversation.post.persona.name;
            personaUsage.set(personaName, (personaUsage.get(personaName) || 0) + 1);
        });

        // Subreddit distribution
        const subredditUsage = new Map<string, number>();
        conversations.forEach(sc => {
            const sub = sc.conversation.subreddit;
            subredditUsage.set(sub, (subredditUsage.get(sub) || 0) + 1);
        });

        // Timing analysis
        const timings = conversations.map(sc => new Date(sc.scheduledTime));
        const gaps: number[] = [];
        for (let i = 1; i < timings.length; i++) {
            const gapHours = (timings[i].getTime() - timings[i - 1].getTime()) / (1000 * 60 * 60);
            gaps.push(gapHours);
        }
        const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
        const minGap = gaps.length > 0 ? Math.min(...gaps) : 0;

        // Safety checks
        const maxPostsPerSubreddit = Math.max(...Array.from(subredditUsage.values()));
        const hasSubredditOveruse = maxPostsPerSubreddit > 3; // Flag if any subreddit has >3 posts

        // Content diversity (simplified - checking if personas are varied)
        const uniquePersonas = personaUsage.size;
        const totalPosts = conversations.length;
        const personaDiversity = uniquePersonas / totalPosts;

        return {
            personaUsage,
            subredditUsage,
            avgGap,
            minGap,
            hasSubredditOveruse,
            personaDiversity,
            uniquePersonas,
            totalPosts
        };
    }, [calendar]);

    const safetyReport = calendar.safetyReport;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                    Week {calendar.weekNumber} Analysis
                </h3>
                <Badge variant={safetyReport.passed ? 'default' : 'destructive'} className="text-xs">
                    {safetyReport.passed ? (
                        <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Safety Passed
                        </span>
                    ) : (
                        <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Safety Issues
                        </span>
                    )}
                </Badge>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Total Conversations */}
                <MetricCard
                    icon={Hash}
                    label="Conversations"
                    value={analytics.totalPosts.toString()}
                    status="neutral"
                />

                {/* Average Gap */}
                <MetricCard
                    icon={Clock}
                    label="Avg Gap"
                    value={`${analytics.avgGap.toFixed(1)}h`}
                    status={analytics.avgGap >= 12 ? 'good' : 'warning'}
                    subtitle={analytics.avgGap >= 12 ? 'Natural spacing' : 'Consider spacing out'}
                />

                {/* Persona Diversity */}
                <MetricCard
                    icon={Users}
                    label="Persona Usage"
                    value={`${analytics.uniquePersonas} personas`}
                    status={analytics.personaDiversity >= 0.3 ? 'good' : 'warning'}
                    subtitle={`${(analytics.personaDiversity * 100).toFixed(0)}% diversity`}
                />

                {/* Subreddit Distribution */}
                <MetricCard
                    icon={TrendingUp}
                    label="Distribution"
                    value={`${analytics.subredditUsage.size} subreddits`}
                    status={analytics.hasSubredditOveruse ? 'warning' : 'good'}
                    subtitle={analytics.hasSubredditOveruse ? 'Overuse detected' : 'Well distributed'}
                />
            </div>

            {/* Persona Distribution */}
            <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Persona Distribution
                </h4>
                <div className="space-y-2">
                    {Array.from(analytics.personaUsage.entries())
                        .sort((a, b) => b[1] - a[1])
                        .map(([persona, count]) => {
                            const percentage = (count / analytics.totalPosts) * 100;
                            const isBalanced = percentage <= 50; // Flag if any persona is used >50%

                            return (
                                <div key={persona} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-zinc-700">{persona}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-zinc-500 tabular-nums">
                                                {count} posts ({percentage.toFixed(0)}%)
                                            </span>
                                            {!isBalanced && (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">
                                                    High
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${isBalanced ? 'bg-blue-500' : 'bg-amber-500'
                                                }`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Subreddit Distribution */}
            <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Subreddit Distribution
                </h4>
                <div className="space-y-2">
                    {Array.from(analytics.subredditUsage.entries())
                        .sort((a, b) => b[1] - a[1])
                        .map(([subreddit, count]) => {
                            const isSafe = count <= 2; // Flag if >2 posts per subreddit
                            const maxRecommended = 2;

                            return (
                                <div key={subreddit} className="flex items-center justify-between text-xs py-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isSafe ? 'bg-emerald-500' : 'bg-amber-500'
                                            }`} />
                                        <span className="font-medium text-zinc-700">r/{subreddit}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-zinc-500 tabular-nums">
                                            {count} / {maxRecommended} max
                                        </span>
                                        {!isSafe && (
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">
                                                ⚠️ Limit
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Safety Report Summary */}
            {safetyReport.warnings.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
                            Safety Warnings
                        </span>
                    </div>
                    <ul className="space-y-1.5 pl-1">
                        {safetyReport.warnings.slice(0, 3).map((warning, idx) => (
                            <li key={idx} className="text-xs text-amber-800 flex items-start gap-2">
                                <span className="text-amber-600 mt-0.5">•</span>
                                <span>{warning.message}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Quality Insights */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-zinc-600" />
                    <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                        Quality Insights
                    </span>
                </div>
                <ul className="space-y-1.5 pl-1">
                    <li className="text-xs text-zinc-600 flex items-start gap-2">
                        <span className="text-emerald-600 mt-0.5">✓</span>
                        <span>
                            Minimum {analytics.minGap.toFixed(1)}h gap between posts (prevents spam detection)
                        </span>
                    </li>
                    {analytics.personaDiversity >= 0.4 && (
                        <li className="text-xs text-zinc-600 flex items-start gap-2">
                            <span className="text-emerald-600 mt-0.5">✓</span>
                            <span>High persona diversity reduces collusion patterns</span>
                        </li>
                    )}
                    {!analytics.hasSubredditOveruse && (
                        <li className="text-xs text-zinc-600 flex items-start gap-2">
                            <span className="text-emerald-600 mt-0.5">✓</span>
                            <span>Subreddit usage within safe limits (≤2 posts/week per sub)</span>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}

interface MetricCardProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    status: 'good' | 'warning' | 'neutral';
    subtitle?: string;
}

function MetricCard({ icon: Icon, label, value, status, subtitle }: MetricCardProps) {
    const getStatusColor = () => {
        switch (status) {
            case 'good':
                return 'border-emerald-200 bg-emerald-50';
            case 'warning':
                return 'border-amber-200 bg-amber-50';
            case 'neutral':
                return 'border-zinc-200 bg-white';
        }
    };

    const getIconColor = () => {
        switch (status) {
            case 'good':
                return 'text-emerald-600';
            case 'warning':
                return 'text-amber-600';
            case 'neutral':
                return 'text-zinc-500';
        }
    };

    return (
        <div className={`rounded-lg border p-3 ${getStatusColor()}`}>
            <div className="flex items-start justify-between mb-2">
                <Icon className={`w-4 h-4 ${getIconColor()}`} />
                <span className="text-lg font-bold text-zinc-900 tabular-nums">{value}</span>
            </div>
            <div className="space-y-0.5">
                <div className="text-xs font-medium text-zinc-600">{label}</div>
                {subtitle && (
                    <div className={`text-[10px] font-medium ${status === 'good' ? 'text-emerald-700' : status === 'warning' ? 'text-amber-700' : 'text-zinc-500'
                        }`}>
                        {subtitle}
                    </div>
                )}
            </div>
        </div>
    );
}
