'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Users, Settings, Loader2, ChevronDown, ChevronUp,
    Check, AlertCircle, Zap, TrendingUp, Lightbulb, BarChart, RotateCcw, Trash2, Info
} from 'lucide-react';
import { Button } from '@/shared/components/ui/inputs/button';
import { Input } from '@/shared/components/ui/inputs/input';
import { Label } from '@/shared/components/ui/inputs/label';
import { Textarea } from '@/shared/components/ui/inputs/textarea';
import { Badge } from '@/shared/components/ui/feedback/badge';
import { SLIDEFORGE_PERSONAS, SLIDEFORGE_SUBREDDITS } from '@/core/data/personas/demo-data';
import { CompanyContext, Persona } from '@/core/types';
import { DynamicListInput } from '../setup/DynamicListInput';
import { TagInput } from '../setup/TagInput';
import { FrequencyCalculator } from '../setup/FrequencyCalculator';

interface SetupPanelProps {
    company: CompanyContext;
    setCompany: (company: CompanyContext) => void;
    selectedPersonas: string[];
    setSelectedPersonas: (personas: string[]) => void;
    selectedSubreddits: string[];
    setSelectedSubreddits: (subreddits: string[]) => void;
    postsPerWeek: number;
    setPostsPerWeek: (count: number) => void;
    qualityThreshold: number;
    setQualityThreshold: (threshold: number) => void;
    keywords: string;
    setKeywords: (keywords: string) => void;
    isValidConfig: boolean;
    isGenerating: boolean;
    onGenerate: () => void;
    onRegenerateCurrentWeek?: () => void;
    weekNumber: number;
    hasExistingWeek?: boolean;
}

// Value proposition suggestions
const VALUE_PROP_SUGGESTIONS = [
    'Saves 10+ hours per week',
    'Reduces costs by 40%',
    'Increases productivity by 50%',
    'Automates repetitive tasks',
    'Improves team collaboration'
];


// Keyword suggestions
const KEYWORD_SUGGESTIONS = [
    'productivity', 'saas', 'startup', 'automation',
    'efficiency', 'collaboration', 'remote-work', 'tools'
];

type Section = 'brand' | 'personas' | 'settings';

export function SetupPanel({
    company,
    setCompany,
    selectedPersonas,
    setSelectedPersonas,
    selectedSubreddits,
    setSelectedSubreddits,
    postsPerWeek,
    setPostsPerWeek,
    qualityThreshold,
    setQualityThreshold,
    keywords,
    setKeywords,
    isValidConfig,
    isGenerating,
    onGenerate,
    onRegenerateCurrentWeek,
    weekNumber,
    hasExistingWeek = false
}: SetupPanelProps) {
    const [expandedSection, setExpandedSection] = useState<Section | null>('brand');

    // Convert keywords string to array for tag input
    const keywordsArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const setKeywordsArray = (arr: string[]) => setKeywords(arr.join(', '));

    // Validation helpers
    const brandValid = company.name.trim() !== '' &&
        company.product.trim() !== '' &&
        company.valuePropositions.length >= 2 &&
        keywordsArray.length >= 3;
    const personasValid = selectedPersonas.length > 0;
    const settingsValid = selectedSubreddits.length > 0;

    const toggleSection = (section: Section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const togglePersona = (personaId: string) => {
        setSelectedPersonas(
            selectedPersonas.includes(personaId)
                ? selectedPersonas.filter(id => id !== personaId)
                : [...selectedPersonas, personaId]
        );
    };

    const toggleSubreddit = (subreddit: string) => {
        setSelectedSubreddits(
            selectedSubreddits.includes(subreddit)
                ? selectedSubreddits.filter(s => s !== subreddit)
                : [...selectedSubreddits, subreddit]
        );
    };

    const handleClearAllData = () => {
        if (confirm('This will clear all generated calendars and reset your setup. Continue?')) {
            // Clear localStorage
            localStorage.removeItem('generatedCalendars');
            localStorage.removeItem('generationParams');

            // Reset form to empty state
            setCompany({
                name: '',
                product: '',
                valuePropositions: [],
                keywords: []
            });
            setSelectedPersonas([]);
            setSelectedSubreddits([]);
            setKeywords('');
            setPostsPerWeek(7);
            setQualityThreshold(80);

            // Reload page to clear all state
            window.location.reload();
        }
    };

    // Calculate overall progress
    const totalSections = 3;
    const completedSections = [brandValid, personasValid, settingsValid].filter(Boolean).length;
    const progressPercentage = (completedSections / totalSections) * 100;

    return (
        <div className="h-full flex flex-col w-full sm:w-80 md:w-80 lg:w-80 bg-white border-r border-zinc-200">
            {/* Panel Header with Progress */}
            <div className="flex-shrink-0 p-4 sm:p-5 border-b border-zinc-200 bg-white">\n                <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="font-semibold text-zinc-900 text-sm flex items-center gap-2">
                    Campaign Setup
                </h2>
                <span className="text-xs font-medium text-zinc-500 tabular-nums">{completedSections}/{totalSections}</span>
            </div>

                {/* Progress Bar */}
                <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-zinc-900"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>

                {/* Info Banner - Test with your own data */}
                {hasExistingWeek && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex gap-2">
                            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-blue-900">
                                <p className="font-medium mb-1">Test with your own data</p>
                                <p className="text-blue-700">
                                    Content is generated from YOUR inputs. Clear data below to start fresh and test different companies.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable Sections */}
            <div className="flex-1 overflow-y-auto">
                {/* Brand Section */}
                <section className="border-b border-zinc-100">
                    <motion.button
                        onClick={() => toggleSection('brand')}
                        className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${brandValid
                                ? 'bg-zinc-900 border-zinc-900 text-white'
                                : 'bg-white border-zinc-200 text-zinc-400 group-hover:border-zinc-300'}`}>
                                {brandValid ? <Check className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                            </div>
                            <div className="text-left">
                                <span className="font-medium text-zinc-900 text-sm block flex items-center gap-2">
                                    Your Brand
                                    {brandValid && (
                                        <span className="text-[10px] text-zinc-500 font-normal">
                                            Scale
                                        </span>
                                    )}
                                </span>
                                {company.name && (
                                    <span className="text-[11px] text-zinc-500 truncate max-w-[140px] block">
                                        {company.name}
                                    </span>
                                )}
                            </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${expandedSection === 'brand' ? 'rotate-180' : ''}`} />
                    </motion.button>

                    <AnimatePresence>
                        {expandedSection === 'brand' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 pt-0 space-y-4 pb-6">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="companyName" className="text-xs font-semibold text-zinc-700">
                                            Company Name
                                        </Label>
                                        <Input
                                            id="companyName"
                                            value={company.name}
                                            onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                            placeholder="e.g., SlideForge"
                                            className="h-9 text-sm bg-zinc-50 border-zinc-200 focus:border-zinc-400 focus:ring-zinc-400/20"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="product" className="text-xs font-semibold text-zinc-700">
                                            Product Description
                                        </Label>
                                        <Textarea
                                            id="product"
                                            value={company.product}
                                            onChange={(e) => setCompany({ ...company, product: e.target.value })}
                                            placeholder="AI-powered presentation tool that helps teams create stunning slides in minutes..."
                                            className="text-sm resize-none bg-zinc-50 border-zinc-200 focus:border-zinc-400 focus:ring-zinc-400/20 min-h-[80px]"
                                        />
                                    </div>

                                    <DynamicListInput
                                        label="Value Propositions"
                                        description="What makes your product valuable? (2-5 items)"
                                        value={company.valuePropositions}
                                        onChange={(value) => setCompany({ ...company, valuePropositions: value })}
                                        placeholder="e.g., Saves 10 hours per week"
                                        min={2}
                                        max={5}
                                        suggestions={VALUE_PROP_SUGGESTIONS}
                                    />

                                    <TagInput
                                        label="Keywords"
                                        description="Topics and themes for content targeting (3-15 keywords)"
                                        value={keywordsArray}
                                        onChange={setKeywordsArray}
                                        placeholder="Type keywords and press Enter..."
                                        suggestions={KEYWORD_SUGGESTIONS}
                                        min={3}
                                        max={15}
                                    />

                                    {!brandValid && (
                                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-100">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>Required fields missing</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* Personas Section */}
                <section className="border-b border-zinc-100">
                    <motion.button
                        onClick={() => toggleSection('personas')}
                        className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${personasValid
                                ? 'bg-zinc-900 border-zinc-900 text-white'
                                : 'bg-white border-zinc-200 text-zinc-400 group-hover:border-zinc-300'}`}>
                                {personasValid ? <Check className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                            </div>
                            <div className="text-left">
                                <span className="font-medium text-zinc-900 text-sm block flex items-center gap-2">
                                    Personas
                                    {personasValid && (
                                        <span className="text-[10px] text-zinc-500 font-normal">
                                            {selectedPersonas.length}
                                        </span>
                                    )}
                                </span>
                                <span className="text-[11px] text-zinc-500 block">
                                    Target audience
                                </span>
                            </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${expandedSection === 'personas' ? 'rotate-180' : ''}`} />
                    </motion.button>

                    <AnimatePresence>
                        {expandedSection === 'personas' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 pt-0 space-y-2 pb-6">
                                    {SLIDEFORGE_PERSONAS.map((persona) => {
                                        const isSelected = selectedPersonas.includes(persona.id);
                                        return (
                                            <button
                                                key={persona.id}
                                                onClick={() => togglePersona(persona.id)}
                                                className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${isSelected
                                                    ? 'border-zinc-900 bg-zinc-50 shadow-sm ring-1 ring-zinc-900/5'
                                                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${isSelected ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200'}`}>
                                                        {persona.name.split(' ').map((n: string) => n[0]).join('')}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className={`font-medium text-sm block ${isSelected ? 'text-zinc-900' : 'text-zinc-700'}`}>{persona.name}</span>
                                                        <span className="text-[11px] text-zinc-500 truncate block">{persona.role}</span>
                                                    </div>
                                                    {isSelected && <Check className="w-4 h-4 text-zinc-900 flex-shrink-0" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* Settings Section */}
                <section>
                    <button
                        onClick={() => toggleSection('settings')}
                        className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${settingsValid
                                ? 'bg-zinc-900 border-zinc-900 text-white'
                                : 'bg-white border-zinc-200 text-zinc-400 group-hover:border-zinc-300'}`}>
                                {settingsValid ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                            </div>
                            <div className="text-left">
                                <span className="font-medium text-zinc-900 text-sm block">Settings</span>
                                <span className="text-[11px] text-zinc-500 block">
                                    {postsPerWeek} posts, {selectedSubreddits.length} subs
                                </span>
                            </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${expandedSection === 'settings' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {expandedSection === 'settings' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 pt-0 space-y-6 pb-6">
                                    {/* Subreddits */}
                                    <div>
                                        <Label className="text-xs font-semibold text-zinc-700">Target Subreddits</Label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {SLIDEFORGE_SUBREDDITS.map((subreddit) => {
                                                const isSelected = selectedSubreddits.includes(subreddit);
                                                return (
                                                    <Badge
                                                        key={subreddit}
                                                        onClick={() => toggleSubreddit(subreddit)}
                                                        variant="outline"
                                                        className={`cursor-pointer text-[11px] px-2.5 py-1 transition-all h-7 ${isSelected
                                                            ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
                                                            : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                                                            }`}
                                                    >
                                                        {subreddit}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Posts per week slider */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-semibold text-zinc-700">Frequency</Label>
                                            <span className="text-xs font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">{postsPerWeek} / week</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="14"
                                            value={postsPerWeek}
                                            onChange={(e) => setPostsPerWeek(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                                        />
                                    </div>

                                    {/* Quality threshold */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-semibold text-zinc-700">Min. Quality Score</Label>
                                            <span className="text-xs font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">{qualityThreshold}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="50"
                                            max="95"
                                            value={qualityThreshold}
                                            onChange={(e) => setQualityThreshold(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                                        />
                                    </div>

                                    {/* Frequency Calculator */}
                                    <FrequencyCalculator
                                        postsPerWeek={postsPerWeek}
                                        personaCount={selectedPersonas.length}
                                        subredditCount={selectedSubreddits.length}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            </div>

            {/* Generate Button (Fixed at bottom) */}
            <div className="flex-shrink-0 p-4 border-t border-zinc-200 bg-white space-y-2">
                {hasExistingWeek && onRegenerateCurrentWeek && (
                    <Button
                        onClick={onRegenerateCurrentWeek}
                        disabled={!isValidConfig || isGenerating}
                        className="w-full h-11 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 font-medium shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm rounded-lg"
                    >
                        {isGenerating ? (
                            <span className="flex items-center gap-2">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <Loader2 className="w-4 h-4" />
                                </motion.div>
                                Regenerating Week {weekNumber - 1}...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <RotateCcw className="w-4 h-4" />
                                Regenerate Week {weekNumber - 1}
                            </span>
                        )}
                    </Button>
                )}
                <Button
                    onClick={onGenerate}
                    disabled={!isValidConfig || isGenerating}
                    className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm rounded-lg"
                >
                    {isGenerating ? (
                        <span className="flex items-center gap-2">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                <Loader2 className="w-4 h-4" />
                            </motion.div>
                            Generating Week {weekNumber}...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Generate Week {weekNumber}
                        </span>
                    )}
                </Button>

                {/* Clear All Data Button */}
                {hasExistingWeek && (
                    <Button
                        onClick={handleClearAllData}
                        disabled={isGenerating}
                        variant="ghost"
                        className="w-full h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Clear All Data & Start Fresh
                    </Button>
                )}
            </div>
        </div>
    );
}
