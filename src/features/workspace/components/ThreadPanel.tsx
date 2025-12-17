'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Copy, RotateCcw, ChevronDown, Check, Zap } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { QualityBreakdown } from '@/shared/components/ui/quality-breakdown';
import { AnnotatedText, generateAnnotations } from '@/shared/components/ui/annotated-text';
import { ScheduledConversation } from '@/core/types';
import {
    getQualityGrade,
    getGradeBadgeStyle,
    getInitials,
    getAvatarColor
} from '@/shared/lib/utils/ui-helpers';

interface ThreadPanelProps {
    scheduled: ScheduledConversation;
    onClose: () => void;
}

export function ThreadPanel({ scheduled, onClose }: ThreadPanelProps) {
    const conv = scheduled.conversation;
    const qualityGrade = getQualityGrade(conv.qualityScore.overall);
    const [showQualityDetails, setShowQualityDetails] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const qualityColor = conv.qualityScore.overall >= 90
        ? 'bg-emerald-500'
        : conv.qualityScore.overall >= 80
            ? 'bg-amber-500'
            : 'bg-red-500';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col bg-white"
        >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-zinc-50/50 to-white">
                <div className="flex items-center gap-3">
                    {/* Subreddit Badge */}
                    <Badge
                        variant="outline"
                        className="bg-white text-zinc-700 border-zinc-200 font-semibold tracking-wide shadow-sm"
                    >
                        r/{conv.subreddit}
                    </Badge>

                    {/* Quality Score */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${qualityColor}`} />
                        <span className="text-sm font-semibold text-zinc-900 tabular-nums">
                            {conv.qualityScore.overall}
                        </span>
                        <span className="text-xs text-zinc-400 font-medium">quality</span>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onClose}
                    className="hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 rounded-lg h-8 w-8 transition-colors"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Quality Breakdown Section */}
            <div className="flex-shrink-0 border-b border-zinc-100 bg-zinc-50/30">
                <button
                    onClick={() => setShowQualityDetails(!showQualityDetails)}
                    className="w-full px-6 py-3 flex items-center justify-between group hover:bg-zinc-50/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                            Quality Analysis
                        </span>
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${showQualityDetails ? 'rotate-180' : ''}`}
                    />
                </button>
                <AnimatePresence>
                    {showQualityDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="px-6 pb-4">
                                <QualityBreakdown qualityScore={conv.qualityScore} compact={false} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Original Post */}
                <div className="p-6 border-b border-zinc-100">
                    <div className="flex items-start gap-4 group">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm ring-2 ring-white ${getAvatarColor(conv.post.persona.name)} text-white`}>
                            {getInitials(conv.post.persona.name)}
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* Author Info */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-zinc-900 text-sm">
                                        u/{conv.post.persona.name.replace(' ', '_').toLowerCase()}
                                    </span>
                                    <Badge className="text-[10px] bg-indigo-100 text-indigo-700 border-0 px-1.5 py-0 font-semibold">
                                        OP
                                    </Badge>
                                    <span className="text-[10px] text-zinc-400 tabular-nums">
                                        {new Date(scheduled.scheduledTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => copyToClipboard(conv.post.content, 'post')}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-600 h-7 w-7"
                                >
                                    {copiedId === 'post' ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                    )}
                                </Button>
                            </div>

                            {/* Post Content */}
                            <div className="bg-gradient-to-br from-zinc-50 to-zinc-50/50 rounded-xl border border-zinc-100 p-5 shadow-sm">
                                <AnnotatedText
                                    text={conv.post.content}
                                    annotations={generateAnnotations(conv.post.content, {
                                        isPost: true,
                                        emotion: conv.post.emotion
                                    })}
                                    className="text-zinc-800 leading-relaxed text-[15px]"
                                />
                            </div>

                            {/* Post Meta */}
                            <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400 pl-1">
                                <span className="flex items-center gap-1.5 font-medium">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {conv.topLevelComments.length} {conv.topLevelComments.length === 1 ? 'comment' : 'comments'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                {conv.topLevelComments.length > 0 && (
                    <div className="p-6 space-y-5">
                        {/* Section Header */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gradient-to-r from-zinc-200 to-transparent" />
                            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Discussion</span>
                            <div className="flex-1 h-px bg-gradient-to-l from-zinc-200 to-transparent" />
                        </div>

                        {/* Comments */}
                        <div className="space-y-4">
                            {conv.topLevelComments.map((comment) => (
                                <div key={comment.id} className="group">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 shadow-sm ${getAvatarColor(comment.persona.name)} text-white`}>
                                            {getInitials(comment.persona.name)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Author & Actions */}
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-zinc-800 text-sm">
                                                        u/{comment.persona.name.replace(' ', '_').toLowerCase()}
                                                    </span>
                                                    {comment.productMention && (
                                                        <Badge className="text-[9px] bg-amber-100 text-amber-700 border-0 px-1.5 py-0 font-semibold">
                                                            Mention
                                                        </Badge>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => copyToClipboard(comment.content, comment.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-600 h-6 w-6"
                                                >
                                                    {copiedId === comment.id ? (
                                                        <Check className="w-3 h-3 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="w-3 h-3" />
                                                    )}
                                                </Button>
                                            </div>

                                            {/* Comment Content */}
                                            <div className="mb-2">
                                                <AnnotatedText
                                                    text={comment.content}
                                                    annotations={generateAnnotations(comment.content, {
                                                        hasProductMention: comment.productMention
                                                    })}
                                                    className="text-zinc-600 text-[14px] leading-relaxed"
                                                />
                                            </div>

                                            {/* Replies */}
                                            {conv.replies.filter(r => r.parentCommentId === comment.id).length > 0 && (
                                                <div className="mt-3 space-y-3">
                                                    {conv.replies.filter(r => r.parentCommentId === comment.id).map(reply => (
                                                        <div key={reply.id} className="pl-4 border-l-2 border-zinc-100 hover:border-zinc-200 transition-colors">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-medium text-zinc-700 text-xs">
                                                                    u/{reply.persona.name.replace(' ', '_').toLowerCase()}
                                                                </span>
                                                                {reply.replyType === 'op_followup' && (
                                                                    <Badge className="text-[9px] bg-indigo-100 text-indigo-700 border-0 px-1 py-0 font-semibold">
                                                                        OP
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-zinc-500 text-[13px] leading-relaxed">
                                                                {reply.content}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="flex-shrink-0 p-4 border-t border-zinc-100 bg-gradient-to-t from-zinc-50/50 to-white flex items-center gap-3">
                <Button
                    variant="outline"
                    className="flex-1 bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 h-10 shadow-sm rounded-lg font-medium text-sm transition-all hover:border-zinc-300"
                >
                    <RotateCcw className="w-4 h-4 mr-2 text-zinc-400" />
                    Regenerate
                </Button>
                <Button
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white h-10 shadow-md rounded-lg font-medium text-sm transition-all hover:shadow-lg active:scale-[0.98]"
                    onClick={() => {
                        const fullThread = [
                            conv.post.content,
                            ...conv.topLevelComments.map(c => c.content),
                            ...conv.replies.map(r => r.content)
                        ].join('\n\n---\n\n');
                        copyToClipboard(fullThread, 'full-thread');
                    }}
                >
                    {copiedId === 'full-thread' ? (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Thread
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
