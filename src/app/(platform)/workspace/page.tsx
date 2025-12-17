'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Download, PanelLeftClose, PanelLeft,
    Sparkles, LayoutGrid, Calendar as CalendarIcon, Loader2, BarChart3
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
    SetupPanel,
    CalendarView,
    ThreadPanel,
    GenerationStatus
} from '@/features/workspace/components';
import { WeekAnalytics } from '@/features/workspace/components/WeekAnalytics';
import { ExportDialog } from '@/features/workspace/components/ExportDialog';
import { DemoModeSwitcher } from '@/features/workspace/components/DemoModeSwitcher';
import { getSlideForgeDemo, SLIDEFORGE_PERSONAS, SLIDEFORGE_SUBREDDITS, SLIDEFORGE_COMPANY } from '@/core/data/personas/slideforge';
import { Persona, CompanyContext, WeekCalendar, ScheduledConversation } from '@/core/types';
import Link from 'next/link';

/**
 * Unified Workspace Page
 * 
 * Revolutionary single-page experience combining:
 * - Setup (collapsible left panel)
 * - Calendar (center stage)
 * - Thread Preview (slide-in right panel)
 * - Generation Status (bottom dock)
 */

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
        valuePropositions: [''],
        icp: [''],
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

    // Load demo data if demo mode
    useEffect(() => {
        if (isDemo) {
            setCompany(SLIDEFORGE_COMPANY);
            setSelectedPersonas(SLIDEFORGE_PERSONAS.map(p => p.id));
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

    // Validation - check if we can generate
    const isValidConfig = company.name.trim() !== '' &&
        company.product.trim() !== '' &&
        selectedPersonas.length > 0 &&
        selectedSubreddits.length > 0;

    // Generate week content
    const handleGenerate = useCallback(async () => {
        if (!isValidConfig) return;

        setIsGenerating(true);
        setGenerationProgress(10);
        setGenerationStatus('Preparing configuration...');

        try {
            const personas = SLIDEFORGE_PERSONAS.filter(p => selectedPersonas.includes(p.id));
            const weekNumber = allWeeks.length + 1;

            const config = {
                company,
                personas,
                subreddits: selectedSubreddits,
                keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
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

    return (
        <div className="h-screen flex flex-col bg-zinc-50/30 overflow-hidden font-sans">
            {/* Header - Premium Minimal Design */}
            <header className="flex-shrink-0 h-14 bg-white/95 backdrop-blur-xl border-b border-zinc-100 flex items-center justify-between px-4 z-40 relative shadow-sm shadow-zinc-100/50">
                <div className="flex items-center gap-3">
                    {/* Setup Toggle */}
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setSetupPanelOpen(!setupPanelOpen)}
                        className={`h-8 w-8 rounded-lg transition-all ${setupPanelOpen
                            ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                            : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
                    >
                        {setupPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                    </Button>

                    {/* Divider */}
                    <div className="w-px h-6 bg-zinc-200" />

                    {/* Branding */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-700 flex items-center justify-center shadow-md shadow-zinc-900/10">
                            <span className="text-white font-bold text-xs tracking-tighter">RM</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm text-zinc-900 leading-tight tracking-tight">Reddit Mastermind</span>
                            <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Workspace</span>
                        </div>
                    </Link>

                    {isDemo && (
                        <div className="ml-2">
                            <DemoModeSwitcher currentDemo={isDemo ? 'slideforge' : undefined} />
                        </div>
                    )}
                </div>

                {/* Center Controls - Week Nav */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    {allWeeks.length > 0 ? (
                        <div className="flex items-center bg-white rounded-xl p-1 border border-zinc-200 shadow-sm">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
                                disabled={currentWeekIndex === 0}
                                className="h-7 w-7 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex flex-col items-center px-4">
                                <span className="text-xs font-bold text-zinc-900 tabular-nums">
                                    Week {calendar?.weekNumber || currentWeekIndex + 1}
                                </span>
                                <span className="text-[10px] text-zinc-400">of {allWeeks.length}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setCurrentWeekIndex(Math.min(allWeeks.length - 1, currentWeekIndex + 1))}
                                disabled={currentWeekIndex === allWeeks.length - 1}
                                className="h-7 w-7 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm">
                            <Sparkles className="w-4 h-4 text-zinc-400" />
                            <span className="font-medium text-zinc-500">New Campaign</span>
                        </div>
                    )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    {allWeeks.length > 0 && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAnalyticsOpen(!analyticsOpen)}
                                className={`h-8 text-xs font-medium rounded-lg transition-all ${analyticsOpen
                                    ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                                    }`}
                            >
                                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                                Analytics
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExportDialogOpen(true)}
                                className="h-8 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 rounded-lg"
                            >
                                <Download className="w-3.5 h-3.5 mr-1.5" />
                                Export
                            </Button>
                            <div className="w-px h-6 bg-zinc-200 mx-1" />
                        </>
                    )}
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-50 border border-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-600 shadow-sm">
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
                                weekNumber={allWeeks.length + 1}
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
        </div>
    );
}
