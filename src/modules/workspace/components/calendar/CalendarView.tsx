'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MessageSquare, Play, RotateCcw, Filter, Search, X, Activity, Clock, Users, MapPin } from 'lucide-react';
import { Badge } from '@/shared/components/ui/feedback/badge';
import { Button } from '@/shared/components/ui/inputs/button';
import { WeekCalendar, ScheduledConversation } from '@/core/types';
import { getInitials, getAvatarColor } from '@/shared/lib/utils/ui-helpers';

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

// Business hours: 6 AM - 10 PM
const BUSINESS_HOURS = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 6;
    return {
        hour,
        label: hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
        shortLabel: hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`
    };
});

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
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPersona, setFilterPersona] = useState<string | null>(null);
    const [filterSubreddit, setFilterSubreddit] = useState<string | null>(null);
    const [filterQuality, setFilterQuality] = useState<'all' | 'high' | 'medium'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [draggedCard, setDraggedCard] = useState<ScheduledConversation | null>(null);
    const [dropTarget, setDropTarget] = useState<{ day: string; hour: number } | null>(null);
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [showFullHours, setShowFullHours] = useState(false);

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1;

    // Calculate adaptive time range based on scheduled posts
    const adaptiveTimeRange = useMemo(() => {
        if (!calendar?.conversations || calendar.conversations.length === 0 || showFullHours) {
            return BUSINESS_HOURS; // Show all business hours in full view or if no data
        }

        // In smart view: show ONLY hours that have posts
        const occupiedHours = new Set<number>();

        calendar.conversations.forEach(sc => {
            const hour = new Date(sc.scheduledTime).getHours();
            if (hour >= 6 && hour <= 22) { // Only within business hours
                occupiedHours.add(hour);
            }
        });

        // Convert to sorted array and map to hour objects
        const sortedHours = Array.from(occupiedHours).sort((a, b) => a - b);

        return sortedHours.map(hour => ({
            hour,
            label: hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
            shortLabel: hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`
        }));
    }, [calendar, showFullHours]);

    const filterOptions = useMemo(() => {
        if (!calendar?.conversations) return { personas: [], subreddits: [] };
        const personas = new Set<string>();
        const subreddits = new Set<string>();
        calendar.conversations.forEach(sc => {
            personas.add(sc.conversation.post.persona.name);
            subreddits.add(sc.conversation.subreddit);
        });
        return { personas: Array.from(personas), subreddits: Array.from(subreddits) };
    }, [calendar]);

    const filteredConversations = useMemo(() => {
        if (!calendar?.conversations) return [];
        return calendar.conversations.filter(sc => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matches = sc.conversation.post.content.toLowerCase().includes(query) ||
                    sc.conversation.post.persona.name.toLowerCase().includes(query) ||
                    sc.conversation.subreddit.toLowerCase().includes(query);
                if (!matches) return false;
            }
            if (filterPersona && sc.conversation.post.persona.name !== filterPersona) return false;
            if (filterSubreddit && sc.conversation.subreddit !== filterSubreddit) return false;
            if (filterQuality === 'high' && sc.conversation.qualityScore.overall < 90) return false;
            if (filterQuality === 'medium' && (sc.conversation.qualityScore.overall < 80 || sc.conversation.qualityScore.overall >= 90)) return false;
            return true;
        });
    }, [calendar, searchQuery, filterPersona, filterSubreddit, filterQuality]);

    const conversationGrid = useMemo(() => {
        const grid: Record<string, Record<number, ScheduledConversation[]>> = {};
        DAYS.forEach(day => {
            grid[day] = {};
            adaptiveTimeRange.forEach(({ hour }) => {
                grid[day][hour] = [];
            });
        });

        filteredConversations.forEach(sc => {
            const date = new Date(sc.scheduledTime);
            const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
            const day = DAYS[dayIndex];
            const hour = date.getHours();
            if (grid[day] && grid[day][hour] !== undefined) {
                grid[day][hour].push(sc);
            }
        });

        return grid;
    }, [filteredConversations, adaptiveTimeRange]);

    const hourDensity = useMemo(() => {
        const density: Record<number, number> = {};
        adaptiveTimeRange.forEach(({ hour }) => {
            density[hour] = 0;
            DAYS.forEach(day => {
                density[hour] += (conversationGrid[day]?.[hour] || []).length;
            });
        });
        return density;
    }, [conversationGrid, adaptiveTimeRange]);

    const hasActiveFilters = searchQuery || filterPersona || filterSubreddit || filterQuality !== 'all';
    const clearAllFilters = () => {
        setSearchQuery('');
        setFilterPersona(null);
        setFilterSubreddit(null);
        setFilterQuality('all');
    };

    const handleDragStart = (sc: ScheduledConversation) => {
        setDraggedCard(sc);
    };

    const handleDragOver = (e: React.DragEvent, day: string, hour: number) => {
        e.preventDefault();
        setDropTarget({ day, hour });
    };

    const handleDragLeave = () => {
        setDropTarget(null);
    };

    const handleDrop = async (e: React.DragEvent, day: string, hour: number) => {
        e.preventDefault();
        if (!draggedCard) return;

        const dayIndex = DAYS.indexOf(day);
        const oldDate = new Date(draggedCard.scheduledTime);
        const weekStart = new Date(oldDate);
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));

        const newDate = new Date(weekStart);
        newDate.setDate(newDate.getDate() + dayIndex);
        newDate.setHours(hour, 0, 0, 0);

        try {
            await onUpdateTime(draggedCard.conversation.id, newDate);
        } catch (error) {
            console.error('Failed to update time:', error);
        }

        setDraggedCard(null);
        setDropTarget(null);
    };

    if (!hasData) {
        return (
            <div className="h-full flex items-center justify-center bg-zinc-50">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md px-6">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-zinc-200"
                    >
                        <Calendar className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-zinc-900 mb-3">Ready to Schedule</h2>
                    <p className="text-sm text-zinc-600 mb-8 leading-relaxed">
                        Create your campaign and start building your content calendar today.
                    </p>
                    <Button onClick={onOpenSetup} className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl h-12 text-sm font-semibold px-8 shadow-sm">
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
        <div className="h-full flex flex-col bg-white">
            {/* Clean Header with Better Stats */}
            <div className="flex-shrink-0 border-b border-zinc-200 bg-white">
                <div className="px-6 py-3 flex items-center justify-between">
                    {/* Left - Stats Overview */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                                <MessageSquare className="w-4 h-4 text-zinc-600" />
                            </div>
                            <div>
                                <div className="text-lg font-bold text-zinc-900 leading-none">{totalConversations}</div>
                                <div className="text-xs text-zinc-500 mt-0.5">Posts</div>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-zinc-200" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-zinc-600" />
                            </div>
                            <div>
                                <div className="text-lg font-bold text-zinc-900 leading-none">{avgQuality.toFixed(0)}</div>
                                <div className="text-xs text-zinc-500 mt-0.5">Quality</div>
                            </div>
                        </div>
                        {hasActiveFilters && (
                            <>
                                <div className="w-px h-10 bg-zinc-200" />
                                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 rounded-lg">
                                    <Filter className="w-4 h-4 text-zinc-600" />
                                    <span className="text-sm font-semibold text-zinc-700">{filteredConversations.length} filtered</span>
                                    <button onClick={clearAllFilters} className="ml-1 hover:bg-zinc-200 rounded-full p-0.5 transition-colors">
                                        <X className="w-3.5 h-3.5 text-zinc-600" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right - Actions */}
                    <div className="flex items-center gap-2">
                        {!showFullHours && adaptiveTimeRange.length < BUSINESS_HOURS.length && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFullHours(true)}
                                className="h-9 text-xs font-medium"
                            >
                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                Show all hours
                            </Button>
                        )}
                        {showFullHours && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFullHours(false)}
                                className="h-9 text-xs font-medium bg-zinc-100"
                            >
                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                Smart view
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRegenerate}
                            disabled={isRegenerating}
                            className="h-9"
                        >
                            <RotateCcw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                        </Button>
                    </div>
                </div>

                <div className="px-6 pb-4 flex items-center gap-3">
                    <div className="flex-1 max-w-md relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within:text-blue-500" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-11 pr-4 rounded-xl border border-zinc-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 text-sm bg-white outline-none transition-all"
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'bg-zinc-100' : ''}>
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-500 ml-2" />}
                    </Button>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-zinc-200">
                            <div className="px-6 py-4 bg-zinc-50 flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-zinc-700">Quality:</span>
                                    <div className="flex gap-1.5">
                                        {(['all', 'high', 'medium'] as const).map(q => (
                                            <button key={q} onClick={() => setFilterQuality(q)} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterQuality === q ? 'bg-blue-500 text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-blue-300'}`}>
                                                {q === 'all' ? 'All' : q === 'high' ? '90+' : '80-89'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {filterOptions.personas.length > 0 && (
                                    <select value={filterPersona || ''} onChange={(e) => setFilterPersona(e.target.value || null)} className="h-9 px-4 text-xs font-medium rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none">
                                        <option value="">All Personas</option>
                                        {filterOptions.personas.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                )}
                                {filterOptions.subreddits.length > 0 && (
                                    <select value={filterSubreddit || ''} onChange={(e) => setFilterSubreddit(e.target.value || null)} className="h-9 px-4 text-xs font-medium rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none">
                                        <option value="">All Subreddits</option>
                                        {filterOptions.subreddits.map(s => <option key={s} value={s}>r/{s}</option>)}
                                    </select>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
                <div className="inline-block min-w-full">
                    {/* Day Headers */}
                    <div className="sticky top-0 z-20 bg-white border-b border-zinc-200">
                        <div className="flex">
                            <div className="w-20 flex-shrink-0 border-r border-zinc-200 bg-zinc-50">
                                <div className="h-14 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-zinc-400" />
                                </div>
                            </div>
                            {DAYS.map((day, idx) => {
                                const isToday = idx === currentDay;
                                const dayPosts = conversationGrid[day] ? Object.values(conversationGrid[day]).flat().length : 0;
                                return (
                                    <div key={day} className={`flex-1 min-w-[160px] border-r last:border-r-0 ${isToday ? 'bg-gradient-to-b from-blue-50 to-blue-50/30' : 'bg-white'} border-zinc-200`}>
                                        <div className="h-14 px-4 flex flex-col items-center justify-center">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-blue-600' : 'text-zinc-500'}`}>{SHORT_DAYS[idx]}</span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {isToday && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                                                <span className={`text-xs font-semibold ${isToday ? 'text-blue-700' : 'text-zinc-600'}`}>{dayPosts}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time Grid */}
                    <div className="relative">
                        {adaptiveTimeRange.map(({ hour, label }) => {
                            const isCurrentHour = hour === currentHour;
                            const density = hourDensity[hour] || 0;

                            return (
                                <div key={hour} className={`flex border-b border-zinc-100 ${isCurrentHour ? 'bg-blue-50/20' : ''} hover:bg-zinc-50/30 transition-colors`}>
                                    <div className={`w-20 flex-shrink-0 border-r border-zinc-200 ${isCurrentHour ? 'bg-blue-50' : 'bg-zinc-50'}`}>
                                        <div className="h-24 flex flex-col items-center justify-start pt-2">
                                            <span className={`text-xs font-bold ${isCurrentHour ? 'text-blue-700' : 'text-zinc-600'}`}>{label}</span>
                                            {isCurrentHour && <span className="text-[9px] text-blue-600 font-bold mt-0.5 px-2 py-0.5 rounded-full bg-blue-100">NOW</span>}
                                            {density > 0 && (
                                                <div className="mt-1.5 px-2 py-0.5 rounded-full bg-zinc-200 text-[9px] font-bold text-zinc-600">
                                                    {density}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {DAYS.map((day, dayIdx) => {
                                        const conversations = conversationGrid[day]?.[hour] || [];
                                        const isDropZone = dropTarget?.day === day && dropTarget?.hour === hour;
                                        const isToday = dayIdx === currentDay;

                                        return (
                                            <div
                                                key={`${day}-${hour}`}
                                                className={`flex-1 min-w-[160px] border-r last:border-r-0 p-2 transition-all ${isToday ? 'bg-blue-50/10' : 'bg-white'
                                                    } ${isDropZone ? 'bg-blue-100 border-2 border-blue-400 border-dashed' : 'border-zinc-200'}`}
                                                onDragOver={(e) => handleDragOver(e, day, hour)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, day, hour)}
                                            >
                                                <div className="min-h-[80px] space-y-2">
                                                    {conversations.length === 0 ? (
                                                        <div className="h-full min-h-[80px] flex items-center justify-center rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer">
                                                            <span className="text-xs text-zinc-300 font-medium">Drop here</span>
                                                        </div>
                                                    ) : (
                                                        conversations.map(sc => (
                                                            <ConversationCard
                                                                key={sc.conversation.id}
                                                                scheduled={sc}
                                                                isSelected={selectedConversation?.conversation.id === sc.conversation.id}
                                                                isDragging={draggedCard?.conversation.id === sc.conversation.id}
                                                                isHovered={hoveredCard === sc.conversation.id}
                                                                onClick={() => onSelectConversation(sc)}
                                                                onDragStart={() => handleDragStart(sc)}
                                                                onHoverStart={() => setHoveredCard(sc.conversation.id)}
                                                                onHoverEnd={() => setHoveredCard(null)}
                                                            />
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ConversationCard({ scheduled, isSelected, isDragging, isHovered, onClick, onDragStart, onHoverStart, onHoverEnd }: {
    scheduled: ScheduledConversation;
    isSelected: boolean;
    isDragging: boolean;
    isHovered: boolean;
    onClick: () => void;
    onDragStart: () => void;
    onHoverStart: () => void;
    onHoverEnd: () => void;
}) {
    const conv = scheduled.conversation;
    const poster = conv.post.persona;
    const qualityScore = conv.qualityScore.overall;
    const time = new Date(scheduled.scheduledTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    const commentCount = conv.topLevelComments.length;
    const replyCount = conv.replies.length;

    return (
        <div className="relative">
            <motion.button
                layout
                draggable
                onDragStart={onDragStart}
                onMouseEnter={onHoverStart}
                onMouseLeave={onHoverEnd}
                onClick={onClick}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                    opacity: isDragging ? 0.4 : 1,
                    scale: isDragging ? 0.95 : 1
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left p-3 rounded-xl text-xs transition-all cursor-grab active:cursor-grabbing ${isSelected
                    ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white'
                    : 'bg-white border border-zinc-200 hover:border-blue-300'
                    }`}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold tabular-nums ${isSelected ? 'text-blue-100' : 'text-zinc-500'}`}>{time}</span>
                    <Badge className={`text-[9px] h-5 px-2 font-bold ${isSelected ? 'bg-white/20 text-white border-white/30' : qualityScore >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {qualityScore}
                    </Badge>
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold ${getAvatarColor(poster.name)} text-white`}>
                        {getInitials(poster.name)}
                    </div>
                    <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-900'}`}>{poster.name}</span>
                </div>

                <p className={`text-[11px] line-clamp-2 leading-relaxed mb-2 ${isSelected ? 'text-blue-50' : 'text-zinc-700'}`}>
                    {conv.post.content}
                </p>

                <div className="flex items-center justify-between">
                    <div className={`px-2 py-1 rounded-md text-[9px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-700'}`}>
                        r/{conv.subreddit}
                    </div>
                    <div className={`flex items-center gap-1.5 text-[9px] font-semibold ${isSelected ? 'text-blue-100' : 'text-zinc-500'}`}>
                        <MessageSquare className="w-3 h-3" />
                        <span>{commentCount + replyCount}</span>
                    </div>
                </div>
            </motion.button>

            {/* Tooltip on Right */}
            <AnimatePresence>
                {isHovered && !isSelected && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="absolute left-full top-0 ml-3 w-80 bg-white rounded-2xl border border-zinc-200 p-4 z-50 pointer-events-none"
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${getAvatarColor(poster.name)} text-white flex-shrink-0`}>
                                {getInitials(poster.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-zinc-900 mb-0.5">{poster.name}</div>
                                <div className="text-xs text-zinc-500">{poster.role}</div>
                            </div>
                            <Badge className="bg-zinc-900 text-white font-bold text-xs px-2 py-1">{qualityScore}</Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 text-xs">
                                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                <span className="font-semibold text-zinc-700">r/{conv.subreddit}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                <span className="text-zinc-600">{new Date(scheduled.scheduledTime).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="border-t border-zinc-200 pt-3 mb-3">
                            <div className="text-xs font-bold text-zinc-900 mb-2">Post Content</div>
                            <p className="text-xs text-zinc-700 leading-relaxed">{conv.post.content}</p>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                                <span className="font-semibold text-zinc-700">{commentCount}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-zinc-500" />
                                <span className="font-semibold text-zinc-700">{replyCount}</span>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-zinc-200 text-center">
                            <Badge className={`text-xs px-3 py-1 ${conv.qualityScore.grade === 'excellent' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' :
                                    conv.qualityScore.grade === 'good' ? 'bg-zinc-900 text-white' :
                                        conv.qualityScore.grade === 'needs_improvement' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                }`}>
                                {conv.qualityScore.grade?.replace('_', ' ')}
                            </Badge>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
