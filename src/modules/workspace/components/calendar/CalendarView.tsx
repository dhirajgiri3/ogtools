'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MessageSquare, Play, Plus, TrendingUp, Activity, RotateCcw } from 'lucide-react';
import { Badge } from '@/shared/components/ui/feedback/badge';
import { Button } from '@/shared/components/ui/inputs/button';
import { WeekCalendar, ScheduledConversation } from '@/core/types';
import {
    getQualityGrade,
    getInitials,
    getAvatarColor
} from '@/shared/lib/utils/ui-helpers';

interface CalendarViewProps {
    calendar: WeekCalendar | null;
    onSelectConversation: (conversation: ScheduledConversation | null) => void;
    selectedConversation: ScheduledConversation | null;
    hasData: boolean;
    onOpenSetup: () => void;
    onRegenerate: () => void;
    isRegenerating: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarView({
    calendar,
    onSelectConversation,
    selectedConversation,
    hasData,
    onOpenSetup,
    onRegenerate,
    isRegenerating
}: CalendarViewProps) {
    // Group conversations by day of week
    const conversationsByDay = useMemo(() => {
        if (!calendar?.conversations) return {};

        return calendar.conversations.reduce((acc, sc) => {
            const date = new Date(sc.scheduledTime);
            const dayIndex = date.getDay();
            // Convert Sunday (0) to 6, others subtract 1 to make Monday = 0
            const adjustedDay = dayIndex === 0 ? 6 : dayIndex - 1;
            const day = DAYS[adjustedDay];

            if (!acc[day]) acc[day] = [];
            acc[day].push(sc);
            return acc;
        }, {} as Record<string, ScheduledConversation[]>);
    }, [calendar]);

    // Empty state
    if (!hasData) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-50/50">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="text-center max-w-sm px-6"
                >
                    {/* Icon with subtle animation */}
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center mx-auto mb-6 border border-zinc-200/60 shadow-sm"
                    >
                        <Calendar className="w-7 h-7 text-zinc-500" />
                    </motion.div>
                    <h2 className="text-xl font-semibold text-zinc-900 mb-2 tracking-tight">
                        Ready to Create
                    </h2>
                    <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
                        Configure your campaign to generate authentic, <br className="hidden sm:block" />high-quality Reddit conversations.
                    </p>
                    <Button
                        onClick={onOpenSetup}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-11 text-sm font-medium px-6 shadow-lg shadow-zinc-900/10 transition-all hover:shadow-xl hover:shadow-zinc-900/15 active:scale-[0.98]"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Start Campaign
                    </Button>
                </motion.div>
            </div>
        );
    }

    const avgQuality = calendar?.averageQuality || 0;
    const totalConversations = calendar?.metadata?.totalConversations || 0;

    return (
        <div className="h-full flex flex-col overflow-hidden bg-gradient-to-b from-zinc-50/30 to-white">
            {/* Enhanced Stats Bar */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-100/80 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-5">
                    {/* Conversations Count */}
                    <div className="flex items-center gap-2.5 bg-zinc-50 rounded-lg px-3 py-1.5 border border-zinc-100">
                        <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center">
                            <MessageSquare className="w-3.5 h-3.5 text-zinc-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-zinc-900 tabular-nums">{totalConversations}</span>
                            <span className="text-[10px] text-zinc-500 -mt-0.5">Threads</span>
                        </div>
                    </div>

                    {/* Quality Score */}
                    <div className="flex items-center gap-2.5 bg-zinc-50 rounded-lg px-3 py-1.5 border border-zinc-100">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${avgQuality >= 85 ? 'bg-emerald-100' : avgQuality >= 70 ? 'bg-amber-100' : 'bg-red-100'}`}>
                            <TrendingUp className={`w-3.5 h-3.5 ${avgQuality >= 85 ? 'text-emerald-600' : avgQuality >= 70 ? 'text-amber-600' : 'text-red-600'}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-zinc-900 tabular-nums">{avgQuality.toFixed(0)}</span>
                            <span className="text-[10px] text-zinc-500 -mt-0.5">Avg. Quality</span>
                        </div>
                    </div>
                </div>

                {/* Week Actions */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRegenerate}
                        disabled={isRegenerating}
                        className="h-8 text-xs font-medium text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-sm"
                    >
                        <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                        {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                    <div className="w-px h-4 bg-zinc-200" />
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Activity className="w-3.5 h-3.5" />
                        <span className="font-medium">Week {calendar?.weekNumber || 1}</span>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto px-4 py-5">
                <div className="grid grid-cols-7 gap-3 min-w-[1000px] h-full">
                    {/* Day Columns */}
                    {DAYS.map((day, index) => {
                        const dayConversations = conversationsByDay[day] || [];
                        const isToday = new Date().getDay() === (index + 1) % 7;

                        return (
                            <div
                                key={day}
                                className={`flex flex-col rounded-xl min-h-[520px] transition-colors ${isToday ? 'bg-zinc-50/80 ring-1 ring-zinc-200/50' : 'bg-white/50'}`}
                            >
                                {/* Day Header */}
                                <div className={`text-center py-3 px-2 sticky top-0 z-10 rounded-t-xl ${isToday ? 'bg-zinc-50' : 'bg-white/80'} backdrop-blur-sm`}>
                                    <div className="flex items-center justify-center gap-1.5">
                                        {isToday && <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-pulse" />}
                                        <span className={`text-[11px] font-semibold uppercase tracking-wider ${isToday ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                            {SHORT_DAYS[index]}
                                        </span>
                                    </div>
                                    {dayConversations.length > 0 && (
                                        <span className="text-[10px] text-zinc-400 font-medium">{dayConversations.length} scheduled</span>
                                    )}
                                </div>

                                {/* Conversation Slots */}
                                <div className="flex-1 px-2 pb-3 space-y-2.5">
                                    {dayConversations.length === 0 ? (
                                        <div className="h-28 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 group">
                                            <div className="w-full text-center">
                                                <div className="w-8 h-8 rounded-lg border-2 border-dashed border-zinc-200 group-hover:border-zinc-300 flex items-center justify-center mx-auto text-zinc-300 group-hover:text-zinc-400 transition-colors cursor-pointer">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        dayConversations.map((sc, idx) => (
                                            <ConversationSlot
                                                key={sc.conversation.id || idx}
                                                scheduled={sc}
                                                onClick={() => onSelectConversation(sc)}
                                                isSelected={selectedConversation === sc}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function ConversationSlot({
    scheduled,
    onClick,
    isSelected
}: {
    scheduled: ScheduledConversation;
    onClick: () => void;
    isSelected: boolean;
}) {
    const conv = scheduled.conversation;
    const poster = conv.post.persona;
    const qualityScore = conv.qualityScore.overall;
    const time = new Date(scheduled.scheduledTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    const qualityColor = qualityScore >= 90
        ? 'bg-emerald-500'
        : qualityScore >= 80
            ? 'bg-amber-500'
            : 'bg-red-500';

    return (
        <motion.button
            layoutId={`card-${scheduled.conversation.id}`}
            onClick={onClick}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`w-full p-3.5 rounded-xl text-left transition-all duration-200 group relative overflow-hidden ${isSelected
                ? 'bg-white shadow-xl ring-2 ring-zinc-900 z-10'
                : 'bg-white border border-zinc-100 shadow-sm hover:shadow-lg hover:border-zinc-200'
                }`}
        >
            {/* Quality indicator bar */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${qualityColor} opacity-80`} />

            {/* Header: Time & Subreddit */}
            <div className="flex items-center justify-between mb-2.5">
                <span className={`text-[10px] font-medium tabular-nums ${isSelected ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {time}
                </span>
                <div className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${isSelected
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200'}`}>
                    r/{conv.subreddit}
                </div>
            </div>

            {/* Persona */}
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ring-2 ring-white shadow-sm ${getAvatarColor(poster.name)} text-white`}>
                    {getInitials(poster.name)}
                </div>
                <span className="text-xs font-semibold text-zinc-800 truncate">
                    {poster.name}
                </span>
            </div>

            {/* Content Preview */}
            <p className="text-[11px] leading-relaxed text-zinc-500 line-clamp-2 mb-3">
                {conv.post.content}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100">
                <Badge
                    variant="secondary"
                    className={`text-[10px] h-5 px-1.5 font-semibold border ${qualityScore >= 90
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : qualityScore >= 80
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                >
                    {qualityScore}
                </Badge>
                <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-zinc-500 transition-colors">
                    <MessageSquare className="w-3 h-3" />
                    <span className="text-[10px] font-semibold">{conv.topLevelComments.length}</span>
                </div>
            </div>
        </motion.button>
    );
}
