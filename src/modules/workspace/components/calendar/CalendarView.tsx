'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MessageSquare, Play, Plus, TrendingUp, Activity, RotateCcw, Filter, Search, X, Star } from 'lucide-react';
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
    onUpdateTime: (conversationId: string, newTime: Date) => Promise<void>;
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
    isRegenerating,
    onUpdateTime
}: CalendarViewProps) {
    // Filter and search state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPersona, setFilterPersona] = useState<string | null>(null);
    const [filterSubreddit, setFilterSubreddit] = useState<string | null>(null);
    const [filterQuality, setFilterQuality] = useState<'all' | 'high' | 'medium'>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Drag and Drop State
    const [draggedId, setDraggedId] = useState<string | null>(null);

    // Get unique personas and subreddits for filters
    const filterOptions = useMemo(() => {
        if (!calendar?.conversations) return { personas: [], subreddits: [] };

        const personas = new Set<string>();
        const subreddits = new Set<string>();

        calendar.conversations.forEach(sc => {
            personas.add(sc.conversation.post.persona.name);
            subreddits.add(sc.conversation.subreddit);
        });

        return {
            personas: Array.from(personas),
            subreddits: Array.from(subreddits)
        };
    }, [calendar]);

    // Filter conversations based on search and filters
    const filteredConversations = useMemo(() => {
        if (!calendar?.conversations) return [];

        return calendar.conversations.filter(sc => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesContent = sc.conversation.post.content.toLowerCase().includes(query);
                const matchesPersona = sc.conversation.post.persona.name.toLowerCase().includes(query);
                const matchesSubreddit = sc.conversation.subreddit.toLowerCase().includes(query);
                if (!matchesContent && !matchesPersona && !matchesSubreddit) return false;
            }

            // Persona filter
            if (filterPersona && sc.conversation.post.persona.name !== filterPersona) return false;

            // Subreddit filter
            if (filterSubreddit && sc.conversation.subreddit !== filterSubreddit) return false;

            // Quality filter
            if (filterQuality === 'high' && sc.conversation.qualityScore.overall < 90) return false;
            if (filterQuality === 'medium' && (sc.conversation.qualityScore.overall < 80 || sc.conversation.qualityScore.overall >= 90)) return false;

            return true;
        });
    }, [calendar, searchQuery, filterPersona, filterSubreddit, filterQuality]);

    // Group conversations by day of week
    const conversationsByDay = useMemo(() => {
        if (!filteredConversations.length) return {};

        return filteredConversations.reduce((acc, sc) => {
            const date = new Date(sc.scheduledTime);
            const dayIndex = date.getDay();
            // Convert Sunday (0) to 6, others subtract 1 to make Monday = 0
            const adjustedDay = dayIndex === 0 ? 6 : dayIndex - 1;
            const day = DAYS[adjustedDay];

            if (!acc[day]) acc[day] = [];
            acc[day].push(sc);
            return acc;
        }, {} as Record<string, ScheduledConversation[]>);
    }, [filteredConversations]);

    const hasActiveFilters = searchQuery || filterPersona || filterSubreddit || filterQuality !== 'all';
    const clearAllFilters = () => {
        setSearchQuery('');
        setFilterPersona(null);
        setFilterSubreddit(null);
        setFilterQuality('all');
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedId(id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetDayIndex: number) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        setDraggedId(null);

        if (!calendar) return;

        const conversation = calendar.conversations.find(c => c.conversation.id === id);
        if (!conversation) return;

        const currentScheduledTime = new Date(conversation.scheduledTime);
        const currentParams = {
            year: currentScheduledTime.getFullYear(),
            month: currentScheduledTime.getMonth(),
            date: currentScheduledTime.getDate(),
            hours: currentScheduledTime.getHours(),
            minutes: currentScheduledTime.getMinutes()
        };

        // Calculate target date based on current week's start
        // Assuming calendar has a startDate or we can infer from the conversations
        // For simplicity, let's find the date of the target column from existing items or construct it

        // Better strategy: We don't have explicit week start date in WeekCalendar type easily accessible 
        // effectively without iterating. But we know the day index of the drop target (0=Mon, 6=Sun).
        // Let's get the current day index of the item
        const currentDayIndex = currentScheduledTime.getDay() === 0 ? 6 : currentScheduledTime.getDay() - 1;

        const diffDays = targetDayIndex - currentDayIndex;
        if (diffDays === 0) return; // Dropped on same day

        // Create new date by adding diffDays
        const newTime = new Date(currentScheduledTime);
        newTime.setDate(newTime.getDate() + diffDays);

        await onUpdateTime(id, newTime);
    };


    // Empty state
    if (!hasData) {
        return (
            <div className="h-full flex items-center justify-center bg-zinc-50/50">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-sm px-6"
                >
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6 border border-zinc-200 shadow-sm">
                        <Calendar className="w-7 h-7 text-zinc-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-zinc-900 mb-2 tracking-tight">
                        Ready to Create
                    </h2>
                    <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
                        Configure your campaign to generate authentic, <br className="hidden sm:block" />high-quality Reddit conversations.
                    </p>
                    <Button
                        onClick={onOpenSetup}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-11 text-sm font-medium px-6 shadow-sm active:scale-[0.98]"
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
        <div className="h-full flex flex-col overflow-hidden bg-zinc-50/30">
            {/* Stats Bar with Search and Filters */}
            <div className="flex-shrink-0 border-b border-zinc-200 bg-white z-10">
                {/* Top Row: Stats and Actions */}
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Conversations Count */}
                        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white">
                            <MessageSquare className="w-4 h-4 text-zinc-500" />
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-zinc-900 tabular-nums">{totalConversations}</span>
                                <span className="text-xs text-zinc-500 font-medium">Threads</span>
                            </div>
                        </div>

                        {/* Quality Score */}
                        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white">
                            <Activity className={`w-4 h-4 ${avgQuality >= 85 ? 'text-emerald-500' : avgQuality >= 70 ? 'text-amber-500' : 'text-red-500'
                                }`} />
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-zinc-900 tabular-nums">{avgQuality.toFixed(0)}</span>
                                <span className="text-xs text-zinc-500 font-medium">Avg. Quality</span>
                            </div>
                        </div>

                        {/* Filtered Results */}
                        {hasActiveFilters && (
                            <div className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-lg">
                                <Filter className="w-3.5 h-3.5" />
                                <span className="font-semibold">{filteredConversations.length} filtered</span>
                                <button onClick={clearAllFilters} className="ml-1 hover:bg-zinc-200 rounded p-0.5 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Week Actions */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onRegenerate}
                            disabled={isRegenerating}
                            className="h-9 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 transition-all"
                        >
                            <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                            {isRegenerating ? 'Regenerating...' : 'Regenerate Week'}
                        </Button>
                    </div>
                </div>

                {/* Search and Filter Row */}
                <div className="px-6 pb-3 flex items-center gap-3">
                    {/* Search Input */}
                    <div className="flex-1 max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search conversations, personas, subreddits..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 pl-10 pr-4 rounded-lg border border-zinc-200 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 text-sm placeholder:text-zinc-400 bg-white transition-all outline-none"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`h-9 gap-2 ${showFilters ? 'bg-zinc-100 border-zinc-300 text-zinc-900' : 'text-zinc-600'}`}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                        )}
                    </Button>
                </div>

                {/* Filters Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-zinc-100"
                        >
                            <div className="px-6 py-3 bg-zinc-50 flex items-center gap-4 flex-wrap">
                                {/* Quality Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-zinc-600">Quality:</span>
                                    <div className="flex gap-1">
                                        {(['all', 'high', 'medium'] as const).map(quality => (
                                            <button
                                                key={quality}
                                                onClick={() => setFilterQuality(quality)}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterQuality === quality
                                                    ? 'bg-zinc-900 text-white shadow-sm'
                                                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                                                    }`}
                                            >
                                                {quality === 'all' ? 'All' : quality === 'high' ? '90+' : '80-89'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Persona Filter */}
                                {filterOptions.personas.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-zinc-600">Persona:</span>
                                        <select
                                            value={filterPersona || ''}
                                            onChange={(e) => setFilterPersona(e.target.value || null)}
                                            className="h-8 px-3 text-xs rounded-md border border-zinc-200 bg-white focus:border-zinc-400 focus:outline-none"
                                        >
                                            <option value="">All Personas</option>
                                            {filterOptions.personas.map(persona => (
                                                <option key={persona} value={persona}>{persona}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Subreddit Filter */}
                                {filterOptions.subreddits.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-zinc-600">Subreddit:</span>
                                        <select
                                            value={filterSubreddit || ''}
                                            onChange={(e) => setFilterSubreddit(e.target.value || null)}
                                            className="h-8 px-3 text-xs rounded-md border border-zinc-200 bg-white focus:border-zinc-400 focus:outline-none"
                                        >
                                            <option value="">All Subreddits</option>
                                            {filterOptions.subreddits.map(sub => (
                                                <option key={sub} value={sub}>r/{sub}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {hasActiveFilters && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="ml-auto text-xs font-semibold text-zinc-600 hover:text-zinc-900 underline"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto px-4 py-6">
                <div className="grid grid-cols-7 gap-3 min-w-[1000px] h-full">
                    {/* Day Columns */}
                    {DAYS.map((day, index) => {
                        const dayConversations = conversationsByDay[day] || [];
                        const isToday = new Date().getDay() === (index + 1) % 7;

                        return (
                            <div
                                key={day}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index)}
                                className={`flex flex-col rounded-xl min-h-[520px] transition-colors ${isToday ? 'bg-zinc-50 border border-zinc-200' : 'bg-transparent border border-transparent hover:bg-zinc-50/50'
                                    }`}
                            >
                                {/* Day Header */}
                                <div className="text-center py-3 px-2 sticky top-0 z-10">
                                    <div className="flex items-center justify-center gap-1.5">
                                        {isToday && <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />}
                                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isToday ? 'text-zinc-900' : 'text-zinc-400'}`}>
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
                                        <div className="h-32 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 group">
                                            <div className="w-full text-center">
                                                <div className="w-full h-8 border border-dashed border-zinc-200 rounded-lg flex items-center justify-center text-zinc-300 text-xs">
                                                    Drop here
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        dayConversations.map((sc, idx) => (
                                            <ConversationSlot
                                                key={sc.conversation.id || idx}
                                                scheduled={sc}
                                                onClick={() => onSelectConversation(sc)}
                                                isSelected={selectedConversation?.conversation.id === sc.conversation.id}
                                                onDragStart={(e) => handleDragStart(e, sc.conversation.id)}
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
    isSelected,
    onDragStart
}: {
    scheduled: ScheduledConversation;
    onClick: () => void;
    isSelected: boolean;
    onDragStart: (e: React.DragEvent) => void;
}) {
    const [showPreview, setShowPreview] = useState(false);
    const conv = scheduled.conversation;
    const poster = conv.post.persona;
    const qualityScore = conv.qualityScore.overall;
    const time = new Date(scheduled.scheduledTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return (
        <motion.div
            layout
            layoutId={`card-${scheduled.conversation.id}`}
            draggable
            onDragStart={(e) => onDragStart(e as unknown as React.DragEvent)}
            onClick={onClick}
            onHoverStart={() => setShowPreview(true)}
            onHoverEnd={() => setShowPreview(false)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`w-full p-3 rounded-lg text-left transition-colors duration-200 group relative overflow-visible cursor-grab active:cursor-grabbing ${isSelected
                ? 'bg-zinc-900 shadow-xl ring-2 ring-zinc-900 border-zinc-900 z-10'
                : 'bg-white border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300'
                }`}
        >
            {/* Header: Time & Subreddit */}
            <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold tabular-nums flex items-center gap-1 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {time}
                </span>
                <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${isSelected
                    ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200'}`}>
                    r/{conv.subreddit}
                </div>
            </div>

            {/* Persona */}
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${getAvatarColor(poster.name)} text-white`}>
                    {getInitials(poster.name)}
                </div>
                <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-800'}`}>
                    {poster.name}
                </span>
            </div>

            {/* Content Preview */}
            <p className={`text-[11px] leading-relaxed mb-2 line-clamp-2 ${isSelected ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {conv.post.content}
            </p>

            {/* Footer */}
            <div className={`flex items-center justify-between pt-2 border-t ${isSelected ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <div className="flex items-center gap-2">
                    <Badge
                        variant={qualityScore >= 90 ? 'default' : 'secondary'}
                        className={`text-[9px] h-5 px-1.5 font-bold border-0 ${isSelected
                            ? 'bg-zinc-800 text-white'
                            : qualityScore >= 90
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-zinc-100 text-zinc-700'
                            }`}
                    >
                        {qualityScore}
                    </Badge>
                </div>
                <div className={`flex items-center gap-1 ${isSelected ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <MessageSquare className="w-3 h-3" />
                    <span className="text-[10px] font-bold tabular-nums">{conv.topLevelComments.length}</span>
                </div>
            </div>

            {/* Hover Preview Tooltip */}
            <AnimatePresence>
                {showPreview && !isSelected && (
                    <motion.div
                        initial={{ opacity: 0, x: 10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-full ml-3 top-0 w-72 bg-white border border-zinc-200 rounded-xl shadow-2xl p-4 z-50 pointer-events-none"
                    >
                        <div className="absolute left-0 top-6 -ml-2 w-4 h-4 bg-white border-l border-b border-zinc-200 transform rotate-45" />
                        <div className="flex items-center gap-2 mb-3 relative z-10">
                            <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${getAvatarColor(poster.name)} text-white`}>
                                {getInitials(poster.name)}
                            </div>
                            <div>
                                <div className="font-bold text-xs text-zinc-900">u/{poster.name}</div>
                                <div className="text-[10px] text-zinc-400">on r/{conv.subreddit}</div>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-600 leading-relaxed line-clamp-6 relative z-10">
                            {conv.post.content}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
