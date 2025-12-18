'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Users, Settings, Sparkles, ChevronDown, ChevronUp,
    Check, AlertCircle
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
    weekNumber: number;
}

// Value proposition suggestions
const VALUE_PROP_SUGGESTIONS = [
    'Saves 10+ hours per week',
    'Reduces costs by 40%',
    'Increases productivity by 50%',
    'Automates repetitive tasks',
    'Improves team collaboration'
];

// ICP suggestions
const ICP_SUGGESTIONS = [
    'B2B SaaS founders',
    'Marketing teams',
    'Product managers',
    'Sales leaders',
    'Operations managers',
    'Remote teams'
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
    weekNumber
}: SetupPanelProps) {
    const [expandedSection, setExpandedSection] = useState<Section | null>('brand');

    // Convert keywords string to array for tag input
    const keywordsArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const setKeywordsArray = (arr: string[]) => setKeywords(arr.join(', '));

    // Validation helpers
    const brandValid = company.name.trim() !== '' &&
        company.product.trim() !== '' &&
        company.valuePropositions.length >= 2 &&
        company.icp.length >= 2 &&
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

    return (
        <div className="h-full flex flex-col w-80 bg-white">
            {/* Panel Header */}
            <div className="flex-shrink-0 p-5 border-b border-zinc-100 bg-gradient-to-b from-zinc-50/50 to-white">
                <h2 className="font-semibold text-zinc-900 tracking-tight text-base">Campaign Setup</h2>
                <p className="text-xs text-zinc-500 mt-1">Configure your content strategy</p>
            </div>

            {/* Scrollable Sections */}
            <div className="flex-1 overflow-y-auto">
                {/* Brand Section */}
                <section className="border-b border-zinc-100">
                    <button
                        onClick={() => toggleSection('brand')}
                        className="w-full p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-all ${brandValid
                                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                                : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
                                {brandValid ? <Check className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                            </div>
                            <div className="text-left">
                                <span className="font-medium text-zinc-900 text-sm block">Your Brand</span>
                                {company.name && (
                                    <span className="text-[11px] text-zinc-500 truncate max-w-[140px] block">
                                        {company.name}
                                    </span>
                                )}
                            </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${expandedSection === 'brand' ? 'rotate-180' : ''}`} />
                    </button>

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

                                    <DynamicListInput
                                        label="Ideal Customer Profile (ICP)"
                                        description="Who are your ideal customers? (2-5 items)"
                                        value={company.icp}
                                        onChange={(value) => setCompany({ ...company, icp: value })}
                                        placeholder="e.g., B2B SaaS founders"
                                        min={2}
                                        max={5}
                                        suggestions={ICP_SUGGESTIONS}
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
                    <button
                        onClick={() => toggleSection('personas')}
                        className="w-full p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-all ${personasValid
                                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                                : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
                                {personasValid ? <Check className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                            </div>
                            <div className="text-left">
                                <span className="font-medium text-zinc-900 text-sm block">Personas</span>
                                <span className="text-[11px] text-zinc-500 block">
                                    {selectedPersonas.length} selected
                                </span>
                            </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${expandedSection === 'personas' ? 'rotate-180' : ''}`} />
                    </button>

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
                        className="w-full p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-all ${settingsValid
                                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                                : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
                                {settingsValid ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                            </div>
                            <div className="text-left">
                                <span className="font-medium text-zinc-900 text-sm block">Settings</span>
                                <span className="text-[11px] text-zinc-500 block">
                                    {postsPerWeek} posts • {selectedSubreddits.length} subreddits
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
            <div className="flex-shrink-0 p-4 bg-gradient-to-t from-white via-white to-white/80 border-t border-zinc-100">
                <Button
                    onClick={onGenerate}
                    disabled={!isValidConfig || isGenerating}
                    className="w-full h-11 bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 text-white font-semibold shadow-lg shadow-zinc-900/15 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-sm rounded-xl"
                >
                    {isGenerating ? (
                        <>
                            Generating...
                        </>
                    ) : (
                        <>
                            Generate Week {weekNumber}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
