'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, AlertTriangle, Info, Sparkles } from 'lucide-react';
import { QualityScore, QualityDimensions } from '@/core/types';
import { Badge } from './badge';

interface QualityBreakdownProps {
    qualityScore: QualityScore;
    compact?: boolean;
}

interface DimensionInfo {
    name: string;
    key: keyof QualityDimensions;
    maxScore: number;
    description: string;
    icon: 'check' | 'warning' | 'info' | 'sparkles';
}

const DIMENSIONS: DimensionInfo[] = [
    {
        name: 'Subreddit Relevance',
        key: 'subredditRelevance',
        maxScore: 20,
        description: 'How well the conversation matches subreddit culture and norms',
        icon: 'check'
    },
    {
        name: 'Problem Specificity',
        key: 'problemSpecificity',
        maxScore: 20,
        description: 'Concrete, relatable pain points vs. vague complaints',
        icon: 'check'
    },
    {
        name: 'Authenticity',
        key: 'authenticity',
        maxScore: 25,
        description: 'Natural vocabulary, realistic timing, human-like patterns',
        icon: 'sparkles'
    },
    {
        name: 'Value-First Approach',
        key: 'valueFirst',
        maxScore: 20,
        description: 'Helpful context before product mention',
        icon: 'check'
    },
    {
        name: 'Engagement Design',
        key: 'engagementDesign',
        maxScore: 15,
        description: 'Conversation structure encourages natural discussion',
        icon: 'info'
    }
];

const getIcon = (iconType: string) => {
    switch (iconType) {
        case 'check':
            return CheckCircle2;
        case 'warning':
            return AlertTriangle;
        case 'sparkles':
            return Sparkles;
        default:
            return Info;
    }
};

const getScoreStatus = (score: number, maxScore: number): 'excellent' | 'good' | 'warning' => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 85) return 'excellent';
    if (percentage >= 70) return 'good';
    return 'warning';
};

const getStatusColor = (status: 'excellent' | 'good' | 'warning') => {
    switch (status) {
        case 'excellent':
            return 'text-emerald-600';
        case 'good':
            return 'text-blue-600';
        case 'warning':
            return 'text-amber-600';
    }
};

const getStatusBg = (status: 'excellent' | 'good' | 'warning') => {
    switch (status) {
        case 'excellent':
            return 'bg-emerald-50';
        case 'good':
            return 'bg-blue-50';
        case 'warning':
            return 'bg-amber-50';
    }
};

export function QualityBreakdown({ qualityScore, compact = false }: QualityBreakdownProps) {
    const [isExpanded, setIsExpanded] = useState(!compact);

    const overallGrade = qualityScore.grade;
    const overallScore = qualityScore.overall;

    const getGradeColor = () => {
        switch (overallGrade) {
            case 'excellent':
                return 'text-emerald-700 bg-emerald-50 border-emerald-200';
            case 'good':
                return 'text-blue-700 bg-blue-50 border-blue-200';
            case 'needs_improvement':
                return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'poor':
                return 'text-red-700 bg-red-50 border-red-200';
        }
    };

    const getGradeLabel = () => {
        switch (overallGrade) {
            case 'excellent':
                return 'Excellent';
            case 'good':
                return 'Good';
            case 'needs_improvement':
                return 'Needs Improvement';
            case 'poor':
                return 'Poor';
        }
    };

    return (
        <div className="space-y-3">
            {/* Overall Score Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-600">Quality Score:</span>
                        <span className="text-2xl font-bold text-zinc-900 tabular-nums">{overallScore}</span>
                        <span className="text-sm text-zinc-400 font-medium">/100</span>
                    </div>
                    <Badge className={`px-2.5 py-0.5 text-xs font-semibold border ${getGradeColor()}`}>
                        {getGradeLabel()}
                    </Badge>
                </div>

                {compact && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors group"
                    >
                        <span>{isExpanded ? 'Hide' : 'Show'} Breakdown</span>
                        <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                    </button>
                )}
            </div>

            {/* Detailed Breakdown */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2 overflow-hidden"
                    >
                        {DIMENSIONS.map((dimension) => {
                            const score = qualityScore.dimensions[dimension.key];
                            const status = getScoreStatus(score, dimension.maxScore);
                            const percentage = (score / dimension.maxScore) * 100;
                            const Icon = getIcon(dimension.icon);

                            return (
                                <div
                                    key={dimension.key}
                                    className="group relative rounded-lg border border-zinc-100 bg-white p-3 hover:border-zinc-200 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-5 h-5 rounded flex items-center justify-center ${getStatusBg(status)}`}>
                                                <Icon className={`w-3 h-3 ${getStatusColor(status)}`} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-zinc-900">
                                                    {dimension.name}
                                                </div>
                                                <div className="text-xs text-zinc-500 mt-0.5">
                                                    {dimension.description}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-sm font-bold tabular-nums ${getStatusColor(status)}`}>
                                                {score}
                                            </span>
                                            <span className="text-xs text-zinc-400 font-medium">
                                                /{dimension.maxScore}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="relative h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 0.5, delay: 0.1 }}
                                            className={`h-full ${status === 'excellent'
                                                    ? 'bg-emerald-500'
                                                    : status === 'good'
                                                        ? 'bg-blue-500'
                                                        : 'bg-amber-500'
                                                }`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Issues & Strengths Summary */}
            {isExpanded && (qualityScore.issues.length > 0 || qualityScore.strengths.length > 0) && (
                <div className="pt-3 border-t border-zinc-100 space-y-3">
                    {/* Strengths */}
                    {qualityScore.strengths.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                                    Strengths
                                </span>
                            </div>
                            <div className="space-y-1">
                                {qualityScore.strengths.slice(0, 2).map((strength, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-xs text-zinc-600">
                                        <span className="text-emerald-500 mt-0.5">•</span>
                                        <span>{strength.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Issues */}
                    {qualityScore.issues.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                                    Areas to Improve
                                </span>
                            </div>
                            <div className="space-y-1">
                                {qualityScore.issues
                                    .filter(issue => issue.severity === 'high' || issue.severity === 'medium')
                                    .slice(0, 2)
                                    .map((issue, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs text-zinc-600">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            <span>{issue.message}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
