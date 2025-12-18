'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Copy, RotateCcw, Check, Trash2, Edit2, Clock, Star, Wand2, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/inputs/button';
import { Badge } from '@/shared/components/ui/feedback/badge';

import { AnnotatedText, generateAnnotations } from '../shared/annotated-text';
import { ScheduledConversation } from '@/core/types';
import {
    getGradeBadgeStyle,
    getInitials,
    getAvatarColor
} from '@/shared/lib/utils/ui-helpers';
import { ConfirmDialog } from '@/shared/components/ui/feedback/confirm-dialog';
import { TimePicker } from '../shared/time-picker';
import { calendarStorage } from '../../lib/calendar-storage';

interface ThreadPanelProps {
    scheduled: ScheduledConversation;
    onClose: () => void;
    onUpdate?: (conversationId: string, updates: Partial<ScheduledConversation>) => Promise<void>;
    onDelete?: (conversationId: string) => Promise<void>;
    onRegenerate?: (conversationId: string) => Promise<void>;
    onUpdateTime?: (conversationId: string, newTime: Date) => Promise<void>;
    isUpdating?: boolean;
}

export function ThreadPanel({
    scheduled,
    onClose,
    onUpdate,
    onDelete,
    onRegenerate,
    onUpdateTime,
    isUpdating = false
}: ThreadPanelProps) {
    const conv = scheduled.conversation;
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Edit state
    interface EditState {
        mode: 'view' | 'edit';
        field: 'post' | 'comment' | 'reply' | null;
        targetId: string | null;
        draftContent: string;
    }
    const [editState, setEditState] = useState<EditState>({
        mode: 'view',
        field: null,
        targetId: null,
        draftContent: '',
    });

    // Delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Time picker
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [draftTime, setDraftTime] = useState<Date>(new Date(scheduled.scheduledTime));

    // Regenerate loading
    const [isRegenerating, setIsRegenerating] = useState(false);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Handler functions
    const handleDelete = async () => {
        if (onDelete) {
            await onDelete(conv.id);
        }
        setShowDeleteConfirm(false);
    };

    const handleRegenerate = async () => {
        if (onRegenerate) {
            setIsRegenerating(true);
            await onRegenerate(conv.id);
            setIsRegenerating(false);
        }
    };

    const handleSaveTime = async () => {
        if (onUpdateTime) {
            await onUpdateTime(conv.id, draftTime);
            setShowTimePicker(false);
        }
    };

    const qualityColor = conv.qualityScore.overall >= 90
        ? 'bg-emerald-500'
        : conv.qualityScore.overall >= 80
            ? 'bg-amber-500'
            : 'bg-red-500';

    const qualityColorClass = conv.qualityScore.overall >= 90
        ? 'emerald'
        : conv.qualityScore.overall >= 80
            ? 'amber'
            : 'red';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full flex flex-col bg-white"
        >
            {/* Minimal Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Subreddit Badge */}
                    <div className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-100 text-zinc-900 border border-zinc-200">
                        r/{conv.subreddit}
                    </div>

                    {/* Quality Score Badge */}
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold border ${conv.qualityScore.overall >= 90
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : conv.qualityScore.overall >= 80
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        {conv.qualityScore.overall >= 90 ? (
                            <Star className="w-3 h-3 fill-emerald-700 text-emerald-700" />
                        ) : (
                            <TrendingUp className="w-3 h-3" />
                        )}
                        <span>{conv.qualityScore.overall}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded">
                        <Clock className="w-3 h-3" />
                        {new Date(scheduled.scheduledTime).toLocaleString('en-US', {
                            weekday: 'short',
                            hour: 'numeric',
                            minute: '2-digit'
                        })}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onClose}
                        className="hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-lg h-7 w-7 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
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
                                    <button
                                        onClick={() => setShowTimePicker(!showTimePicker)}
                                        className="text-[10px] text-zinc-400 tabular-nums hover:text-zinc-600 hover:underline flex items-center gap-1 group"
                                    >
                                        <Clock className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {new Date(scheduled.scheduledTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    </button>
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
                            <div className="bg-zinc-50 rounded-xl border border-zinc-100 p-5">
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

                            {/* Time Picker */}
                            {showTimePicker && (
                                <div className="mt-4">
                                    <TimePicker
                                        value={draftTime}
                                        onChange={setDraftTime}
                                        onSave={handleSaveTime}
                                        onCancel={() => setShowTimePicker(false)}
                                        validateFn={(date) => calendarStorage.validateTimeGap(date, 0, conv.id)}
                                    />
                                </div>
                            )}
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

            {/* Enhanced Footer Actions */}
            <div className="flex-shrink-0 p-4 border-t border-zinc-200 bg-gradient-to-r from-zinc-50 to-white">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white hover:border-transparent font-semibold shadow-sm transition-all h-10"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isUpdating || isRegenerating}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 bg-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white border-zinc-300 text-zinc-700 h-10 shadow-sm rounded-lg font-semibold text-sm transition-all hover:border-transparent"
                        onClick={handleRegenerate}
                        disabled={isUpdating || isRegenerating}
                    >
                        {isRegenerating ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <Wand2 className="w-4 h-4 mr-2" />
                                </motion.div>
                                Regenerating...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4 mr-2" />
                                Regenerate
                            </>
                        )}
                    </Button>
                    <Button
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-10 shadow-sm rounded-lg font-bold text-sm transition-all active:scale-[0.98] group"
                        onClick={() => {
                            const fullThread = [
                                conv.post.content,
                                ...conv.topLevelComments.map(c => c.content),
                                ...conv.replies.map(r => r.content)
                            ].join('\n\n---\n\n');
                            copyToClipboard(fullThread, 'full-thread');
                        }}
                        disabled={isUpdating || isRegenerating}
                    >
                        {copiedId === 'full-thread' ? (
                            <motion.span
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Copied!
                            </motion.span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Copy className="w-4 h-4" />
                                Copy Full Thread
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Delete Conversation?"
                description="This will permanently remove this scheduled conversation from your calendar. This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </motion.div>
    );
}
