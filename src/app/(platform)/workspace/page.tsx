'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Download, PanelLeftClose, PanelLeft,
    LayoutGrid, Calendar as CalendarIcon, Loader2, BarChart3,
    MoreVertical, RotateCcw, Settings, Trash2, Plus
} from 'lucide-react';
import { Button } from '@/shared/components/ui/inputs/button';
import { Badge } from '@/shared/components/ui/feedback/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/components/ui/overlays/dropdown-menu';
import {
    SetupPanel,
    CalendarView,
    ThreadPanel,
    GenerationStatus,
    WeekAnalytics,
    ExportDialog,
    DemoModeSwitcher
} from '@/modules/workspace/components';
import { SLIDEFORGE_SUBREDDITS, SLIDEFORGE_COMPANY } from '@/core/data/personas/demo-data';
import { PERSONA_LIBRARY } from '@/core/data/personas/persona-library';
import { Persona, CompanyContext, WeekCalendar, ScheduledConversation } from '@/core/types';
import Link from 'next/link';
import { calendarStorage } from '@/modules/workspace/lib/calendar-storage';
import { toast } from '@/shared/lib/utils/toast';
import { ConfirmDialog } from '@/shared/components/ui/feedback/confirm-dialog';

function WorkspaceLoadingFallback() {
    return (
        <div className="h-screen flex items-center justify-center bg-white">
            <Loader2 className="w-6 h-6 text-zinc-900 animate-spin" />
        </div>
    );
}

export default function WorkspacePage() {
    return (
        <Suspense fallback={<WorkspaceLoadingFallback />}>
            <WorkspaceContent />
        </Suspense>
    );
}

function WorkspaceContent() {

    const searchParams = useSearchParams();
    const router = useRouter();
    const isDemo = searchParams.get('demo') === 'slideforge';

    // UI State
    const [setupPanelOpen, setSetupPanelOpen] = useState(true);
    const [analyticsOpen, setAnalyticsOpen] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<ScheduledConversation | null>(null);

    // Data State
    const [allWeeks, setAllWeeks] = useState<WeekCalendar[]>([]);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

    // Setup Configuration State
    const [company, setCompany] = useState<CompanyContext>({
        name: '',
        product: '',
        valuePropositions: [],
        keywords: []
    });
    const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
    const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>([]);
    const [postsPerWeek, setPostsPerWeek] = useState(7);
    const [qualityThreshold, setQualityThreshold] = useState(80);
    const [keywords, setKeywords] = useState('');

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationStatus, setGenerationStatus] = useState('');

    // CRUD State
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());
    const [showDeleteWeekConfirm, setShowDeleteWeekConfirm] = useState(false);

    // Load demo data if demo mode
    useEffect(() => {
        if (isDemo) {
            setCompany(SLIDEFORGE_COMPANY);
            setSelectedPersonas(PERSONA_LIBRARY.slice(0, 3).map(p => p.id));
            setSelectedSubreddits(SLIDEFORGE_SUBREDDITS);
            setKeywords(SLIDEFORGE_COMPANY.keywords.join(', '));
        }
    }, [isDemo]);

    // Load existing calendar data
    useEffect(() => {
        const stored = localStorage.getItem('generatedCalendars');
        if (stored) {
            try {
                const weeks = JSON.parse(stored);
                setAllWeeks(weeks);
                setCurrentWeekIndex(weeks.length - 1);
                // Collapse setup panel if we have data
                if (weeks.length > 0) {
                    setSetupPanelOpen(false);
                }
            } catch (e) {
                console.error('Failed to parse calendars:', e);
            }
        }
        // Load saved params
        const paramsStored = localStorage.getItem('generationParams');
        if (paramsStored) {
            try {
                const params = JSON.parse(paramsStored);
                setCompany(params.company);
                setSelectedPersonas(params.personas?.map((p: Persona) => p.id) || []);
                setSelectedSubreddits(params.subreddits || []);
                setKeywords(params.keywords?.join(', ') || '');
                setPostsPerWeek(params.postsPerWeek || 7);
                setQualityThreshold(params.qualityThreshold || 80);
            } catch (e) {
                console.error('Failed to parse params:', e);
            }
        }
    }, []);

    const calendar = allWeeks[currentWeekIndex] || null;

    // Enhanced validation - check if we can generate
    const keywordsArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const isValidConfig = company.name.trim() !== '' &&
        company.product.trim() !== '' &&
        company.valuePropositions.length >= 2 &&
        keywordsArray.length >= 3 &&
        selectedPersonas.length > 0 &&
        selectedSubreddits.length > 0;

    // Generate week content
    const handleGenerate = useCallback(async () => {
        if (!isValidConfig) return;

        setIsGenerating(true);
        setGenerationProgress(10);
        setGenerationStatus('Preparing configuration...');

        try {
            const personas = PERSONA_LIBRARY.filter(p => selectedPersonas.includes(p.id));
            const weekNumber = allWeeks.length + 1;

            // Sync keywords with company object before sending to API
            const keywordsArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
            const syncedCompany = {
                ...company,
                keywords: keywordsArray
            };

            const config = {
                company: syncedCompany,
                personas,
                subreddits: selectedSubreddits,
                keywords: keywordsArray,
                postsPerWeek,
                qualityThreshold,
                weekNumber,
                previousWeeks: allWeeks
            };

            setGenerationProgress(20);
            setGenerationStatus('Generating conversations with AI...');

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            setGenerationProgress(80);
            setGenerationStatus('Validating safety...');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Generation failed');
            }

            const result = await response.json();

            if (!result.conversations || result.conversations.length === 0) {
                throw new Error('No conversations were generated. Please try again.');
            }

            setGenerationProgress(100);
            setGenerationStatus('Complete!');

            // Save and update state
            localStorage.setItem('generationParams', JSON.stringify(config));
            const updatedWeeks = [...allWeeks, result];
            setAllWeeks(updatedWeeks);
            setCurrentWeekIndex(updatedWeeks.length - 1);
            localStorage.setItem('generatedCalendars', JSON.stringify(updatedWeeks));

            // Collapse setup panel after successful generation
            setSetupPanelOpen(false);

            // Reset after delay
            setTimeout(() => {
                setIsGenerating(false);
                setGenerationProgress(0);
                setGenerationStatus('');
            }, 1500);

        } catch (error) {
            console.error('Generation error:', error);
            setGenerationStatus('Error occurred. Please try again.');
            setTimeout(() => {
                setIsGenerating(false);
                setGenerationProgress(0);
                setGenerationStatus('');
            }, 2000);
        }
    }, [isValidConfig, company, selectedPersonas, selectedSubreddits, keywords, postsPerWeek, qualityThreshold, allWeeks]);

    // CRUD Handlers

    /**
     * Update a conversation with optimistic UI
     */
    const handleUpdateConversation = useCallback(async (
        conversationId: string,
        updates: Partial<ScheduledConversation>
    ) => {
        setIsUpdating(true);
        const originalConversation = calendarStorage.getConversation(currentWeekIndex, conversationId);

        try {
            // Optimistic update - update UI immediately
            const updatedWeeks = [...allWeeks];
            // Create a new reference for the modified week to trigger re-render
            updatedWeeks[currentWeekIndex] = {
                ...updatedWeeks[currentWeekIndex],
                conversations: [...updatedWeeks[currentWeekIndex].conversations]
            };

            const week = updatedWeeks[currentWeekIndex];
            const convIndex = week.conversations.findIndex(c => c.conversation.id === conversationId);

            if (convIndex !== -1) {
                week.conversations[convIndex] = {
                    ...week.conversations[convIndex],
                    ...updates,
                };
                setAllWeeks(updatedWeeks);
            }

            // Persist to storage
            await calendarStorage.updateConversation(currentWeekIndex, conversationId, updates);
            setLastSaved(new Date());

            toast.success('Conversation updated');
        } catch (error) {
            // Rollback on error
            if (originalConversation) {
                const rolledBackWeeks = [...allWeeks];
                const week = rolledBackWeeks[currentWeekIndex];
                const convIndex = week.conversations.findIndex(c => c.conversation.id === conversationId);
                if (convIndex !== -1) {
                    week.conversations[convIndex] = originalConversation;
                    setAllWeeks(rolledBackWeeks);
                }
            }
            toast.error('Failed to update conversation');
            console.error('Update error:', error);
        } finally {
            setIsUpdating(false);
        }
    }, [currentWeekIndex, allWeeks]);

    /**
     * Delete a conversation
     */
    const handleDeleteConversation = useCallback(async (conversationId: string) => {
        try {
            await calendarStorage.deleteConversation(currentWeekIndex, conversationId);

            // Update UI
            const updatedWeeks = calendarStorage.getAllWeeks();
            setAllWeeks(updatedWeeks);

            // Close ThreadPanel if the deleted conversation was selected
            if (selectedConversation?.conversation.id === conversationId) {
                setSelectedConversation(null);
            }

            toast.success('Conversation deleted');
        } catch (error) {
            toast.error('Failed to delete conversation');
            console.error('Delete error:', error);
        }
    }, [currentWeekIndex, selectedConversation]);

    /**
     * Delete an entire week
     */
    const handleDeleteWeek = useCallback(async (weekIndex: number) => {
        try {
            await calendarStorage.deleteWeek(weekIndex);

            // Update UI
            const updatedWeeks = calendarStorage.getAllWeeks();
            setAllWeeks(updatedWeeks);

            // Adjust current week index if needed
            if (currentWeekIndex >= updatedWeeks.length && updatedWeeks.length > 0) {
                setCurrentWeekIndex(updatedWeeks.length - 1);
            } else if (updatedWeeks.length === 0) {
                setCurrentWeekIndex(0);
            }

            // Close ThreadPanel
            setSelectedConversation(null);

            toast.success('Week deleted');
        } catch (error) {
            toast.error('Failed to delete week');
            console.error('Delete week error:', error);
        }
    }, [currentWeekIndex]);

    /**
     * Regenerate a single conversation
     */
    const handleRegenerateConversation = useCallback(async (conversationId: string) => {
        setIsUpdating(true);

        try {
            const response = await fetch('/api/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'conversation',
                    conversationId,
                    weekIndex: currentWeekIndex,
                    context: {
                        currentWeek: calendar,
                        previousWeeks: allWeeks.slice(0, currentWeekIndex),
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Regeneration failed');
            }

            const { scheduled } = await response.json();

            // Update in storage
            await calendarStorage.updateConversation(currentWeekIndex, conversationId, scheduled);

            // Update UI
            const updatedWeeks = calendarStorage.getAllWeeks();
            setAllWeeks(updatedWeeks);

            // Update selected conversation if it's the one being regenerated
            if (selectedConversation?.conversation.id === conversationId) {
                setSelectedConversation(scheduled);
            }

            toast.success('Conversation regenerated');
        } catch (error) {
            toast.error('Failed to regenerate conversation');
            console.error('Regenerate error:', error);
        } finally {
            setIsUpdating(false);
        }
    }, [currentWeekIndex, calendar, allWeeks, selectedConversation]);

    /**
     * Regenerate entire week with same parameters
     */
    const handleRegenerateWeek = useCallback(async () => {
        setIsGenerating(true);
        setGenerationProgress(10);
        setGenerationStatus('Regenerating week...');

        try {
            const response = await fetch('/api/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'week',
                    weekIndex: currentWeekIndex,
                    context: {
                        currentWeek: calendar,
                        previousWeeks: allWeeks.slice(0, currentWeekIndex),
                    }
                })
            });

            setGenerationProgress(80);

            if (!response.ok) {
                throw new Error('Week regeneration failed');
            }

            const { calendar: newCalendar } = await response.json();

            setGenerationProgress(100);
            setGenerationStatus('Complete!');

            // Update in storage
            await calendarStorage.updateWeek(currentWeekIndex, newCalendar);

            // Update UI
            const updatedWeeks = calendarStorage.getAllWeeks();
            setAllWeeks(updatedWeeks);

            // Close ThreadPanel
            setSelectedConversation(null);

            setTimeout(() => {
                setIsGenerating(false);
                setGenerationProgress(0);
                setGenerationStatus('');
                toast.success('Week regenerated');
            }, 1000);
        } catch (error) {
            toast.error('Failed to regenerate week');
            console.error('Regenerate week error:', error);
            setIsGenerating(false);
            setGenerationProgress(0);
            setGenerationStatus('');
        }
    }, [currentWeekIndex, calendar, allWeeks]);

    /**
     * Regenerate current week with updated setup configuration
     */
    const handleRegenerateCurrentWeek = useCallback(async () => {
        if (!isValidConfig || allWeeks.length === 0) return;

        setIsGenerating(true);
        setGenerationProgress(10);
        setGenerationStatus('Regenerating with updated setup...');

        try {
            const personas = PERSONA_LIBRARY.filter(p => selectedPersonas.includes(p.id));
            const weekToRegenerate = currentWeekIndex;

            // Sync keywords with company object before sending to API
            const keywordsArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
            const syncedCompany = {
                ...company,
                keywords: keywordsArray
            };

            const config = {
                company: syncedCompany,
                personas,
                subreddits: selectedSubreddits,
                keywords: keywordsArray,
                postsPerWeek,
                qualityThreshold,
                weekNumber: allWeeks[currentWeekIndex].weekNumber,
                previousWeeks: allWeeks.slice(0, currentWeekIndex)
            };

            setGenerationProgress(20);
            setGenerationStatus('Generating conversations with updated setup...');

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            setGenerationProgress(80);
            setGenerationStatus('Validating safety...');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Regeneration failed');
            }

            const result = await response.json();

            if (!result.conversations || result.conversations.length === 0) {
                throw new Error('No conversations were generated. Please try again.');
            }

            setGenerationProgress(100);
            setGenerationStatus('Complete!');

            // Update the current week with new content
            await calendarStorage.updateWeek(weekToRegenerate, result);

            // Save updated params
            localStorage.setItem('generationParams', JSON.stringify(config));

            // Update UI
            const updatedWeeks = calendarStorage.getAllWeeks();
            setAllWeeks(updatedWeeks);

            // Close ThreadPanel if conversation was deleted
            setSelectedConversation(null);

            // Collapse setup panel after successful regeneration
            setSetupPanelOpen(false);

            // Reset after delay
            setTimeout(() => {
                setIsGenerating(false);
                setGenerationProgress(0);
                setGenerationStatus('');
                toast.success('Week regenerated with updated setup');
            }, 1500);

        } catch (error) {
            console.error('Regeneration error:', error);
            setGenerationStatus('Error occurred. Please try again.');
            toast.error('Failed to regenerate week');
            setTimeout(() => {
                setIsGenerating(false);
                setGenerationProgress(0);
                setGenerationStatus('');
            }, 2000);
        }
    }, [isValidConfig, company, selectedPersonas, selectedSubreddits, keywords, postsPerWeek, qualityThreshold, allWeeks, currentWeekIndex]);

    /**
     * Update conversation scheduled time
     */
    const handleUpdateTime = useCallback(async (
        conversationId: string,
        newTime: Date
    ) => {
        // Validate time gap
        const validation = calendarStorage.validateTimeGap(newTime, currentWeekIndex, conversationId);

        if (!validation.valid) {
            toast.warning(validation.message || 'Invalid time');
            return;
        }

        try {
            await handleUpdateConversation(conversationId, { scheduledTime: newTime });
            toast.success('Time updated');
        } catch (error) {
            toast.error('Failed to update time');
        }
    }, [currentWeekIndex, handleUpdateConversation]);

    /**
     * Bulk delete conversations
     */
    const handleBulkDelete = useCallback(async (conversationIds: string[]) => {
        try {
            await calendarStorage.deleteMultipleConversations(currentWeekIndex, conversationIds);

            // Update UI
            const updatedWeeks = calendarStorage.getAllWeeks();
            setAllWeeks(updatedWeeks);

            // Close ThreadPanel if needed
            if (selectedConversation && conversationIds.includes(selectedConversation.conversation.id)) {
                setSelectedConversation(null);
            }

            toast.success(`${conversationIds.length} conversations deleted`);
        } catch (error) {
            toast.error('Failed to delete conversations');
            console.error('Bulk delete error:', error);
        }
    }, [currentWeekIndex, selectedConversation]);

    return (
        <div className="h-screen flex flex-col bg-zinc-50/30 overflow-hidden font-sans">
            {/* Header - Minimal Design */}
            <header className="flex-shrink-0 h-12 sm:h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-2 sm:px-4 z-40 relative">
                <div className="flex items-center gap-1.5 sm:gap-3">
                    {/* Setup Toggle */}
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setSetupPanelOpen(!setupPanelOpen)}
                        className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition-all ${setupPanelOpen
                            ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white'
                            : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
                    >
                        {setupPanelOpen ? <PanelLeftClose className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <PanelLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </Button>

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-6 bg-zinc-200" />

                    {/* Branding */}
                    <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 group">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">RM</span>
                        </div>
                        <span className="hidden md:inline font-semibold text-sm text-zinc-900">Reddit Mastermind</span>
                    </Link>

                    {isDemo && (
                        <div className="hidden lg:block ml-2">
                            <DemoModeSwitcher currentDemo={isDemo ? 'slideforge' : undefined} />
                        </div>
                    )}
                </div>

                {/* Center Controls - Week Nav */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    {allWeeks.length > 0 ? (
                        <div className="flex items-center bg-white rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-zinc-200 shadow-sm gap-0.5 sm:gap-1">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
                                disabled={currentWeekIndex === 0}
                                className="h-6 w-6 sm:h-7 sm:w-7 rounded-md sm:rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <div className="flex flex-col items-center px-2 sm:px-4">
                                <span className="text-[10px] sm:text-xs font-bold text-zinc-900 tabular-nums">
                                    Week {calendar?.weekNumber || currentWeekIndex + 1}
                                </span>
                                <span className="hidden sm:inline text-[10px] text-zinc-400">of {allWeeks.length}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setCurrentWeekIndex(Math.min(allWeeks.length - 1, currentWeekIndex + 1))}
                                disabled={currentWeekIndex === allWeeks.length - 1}
                                className="h-6 w-6 sm:h-7 sm:w-7 rounded-md sm:rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>

                            {/* Week Actions Dropdown */}
                            <div className="hidden sm:block w-px h-5 bg-zinc-200 mx-1" />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="hidden sm:flex h-7 w-7 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem
                                        onClick={handleRegenerateWeek}
                                        disabled={isGenerating || isUpdating}
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Regenerate Week
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteWeekConfirm(true)}
                                        className="text-red-600 focus:text-red-600"
                                        disabled={isGenerating || isUpdating}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Week
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
                            <span className="hidden sm:inline font-medium text-zinc-500">New Campaign</span>
                        </div>
                    )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {allWeeks.length > 0 && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAnalyticsOpen(!analyticsOpen)}
                                className={`hidden md:flex h-8 text-xs font-medium rounded-lg transition-all ${analyticsOpen
                                    ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white'
                                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                                    }`}
                            >
                                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                                Analytics
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setExportDialogOpen(true)}
                                className="h-7 w-7 sm:h-8 sm:w-auto sm:px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 rounded-lg"
                            >
                                <Download className="w-3.5 h-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                            <div className="hidden sm:block w-px h-6 bg-zinc-200 mx-1" />
                        </>
                    )}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-50 border border-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-600 shadow-sm">
                        DG
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Setup Panel (Collapsible Left) */}
                <AnimatePresence mode="wait">
                    {setupPanelOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            className="flex-shrink-0 bg-white border-r border-zinc-100 overflow-hidden shadow-sm"
                        >
                            <SetupPanel
                                company={company}
                                setCompany={setCompany}
                                selectedPersonas={selectedPersonas}
                                setSelectedPersonas={setSelectedPersonas}
                                selectedSubreddits={selectedSubreddits}
                                setSelectedSubreddits={setSelectedSubreddits}
                                postsPerWeek={postsPerWeek}
                                setPostsPerWeek={setPostsPerWeek}
                                qualityThreshold={qualityThreshold}
                                setQualityThreshold={setQualityThreshold}
                                keywords={keywords}
                                setKeywords={setKeywords}
                                isValidConfig={isValidConfig}
                                isGenerating={isGenerating}
                                onGenerate={handleGenerate}
                                onRegenerateCurrentWeek={handleRegenerateCurrentWeek}
                                weekNumber={allWeeks.length + 1}
                                hasExistingWeek={allWeeks.length > 0}
                            />
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Calendar View (Center) */}
                <main className="flex-1 overflow-hidden flex">
                    <div className="flex-1 overflow-hidden">
                        <CalendarView
                            calendar={calendar}
                            onSelectConversation={setSelectedConversation}
                            selectedConversation={selectedConversation}
                            hasData={allWeeks.length > 0}
                            onOpenSetup={() => setSetupPanelOpen(true)}
                            onRegenerate={handleRegenerateWeek}
                            isRegenerating={isGenerating}
                            onUpdateTime={handleUpdateTime}
                        />
                    </div>

                    {/* Analytics Panel */}
                    <AnimatePresence mode="wait">
                        {analyticsOpen && calendar && (
                            <motion.aside
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 340, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                className="flex-shrink-0 border-l border-zinc-100 bg-white overflow-hidden shadow-sm"
                            >
                                <div className="h-full overflow-y-auto p-6">
                                    <WeekAnalytics calendar={calendar} />
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>
                </main>

                {/* Thread Panel (Slide-in Right) */}
                <AnimatePresence>
                    {selectedConversation && (
                        <motion.aside
                            initial={{ x: '100%', opacity: 0.8 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="absolute right-0 top-14 bottom-0 w-[500px] bg-white border-l border-zinc-200 shadow-2xl z-30 overflow-hidden"
                        >
                            <ThreadPanel
                                scheduled={selectedConversation}
                                onClose={() => setSelectedConversation(null)}
                                onUpdate={handleUpdateConversation}
                                onDelete={handleDeleteConversation}
                                onRegenerate={handleRegenerateConversation}
                                onUpdateTime={handleUpdateTime}
                                isUpdating={isUpdating}
                            />
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* Generation Status (Bottom Dock) */}
            <AnimatePresence>
                {isGenerating && (
                    <GenerationStatus
                        progress={generationProgress}
                        status={generationStatus}
                    />
                )}
            </AnimatePresence>

            {/* Export Dialog */}
            <ExportDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                calendars={allWeeks}
            />

            {/* Delete Week Confirmation */}
            <ConfirmDialog
                open={showDeleteWeekConfirm}
                onOpenChange={setShowDeleteWeekConfirm}
                title="Delete Entire Week?"
                description={`This will permanently delete Week ${calendar?.weekNumber || currentWeekIndex + 1} and all its ${calendar?.conversations.length || 0} conversations. This action cannot be undone.`}
                confirmText="Delete Week"
                cancelText="Cancel"
                variant="destructive"
                onConfirm={() => handleDeleteWeek(currentWeekIndex)}
            />
        </div>
    );
}
