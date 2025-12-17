'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import {
    Building2, Users, Settings, Check, ArrowRight, ArrowLeft,
    Sparkles, Loader2
} from 'lucide-react';
import { getSlideForgeDemo, SLIDEFORGE_PERSONAS, SLIDEFORGE_SUBREDDITS, SLIDEFORGE_COMPANY } from '@/core/data/personas/slideforge';
import { Persona, CompanyContext } from '@/core/types';

/**
 * Setup Wizard Page
 * 
 * 4-step wizard for configuring campaign settings:
 * 1. Company Context
 * 2. Persona Selection
 * 3. Campaign Settings
 * 4. Review & Generate
 */

type Step = 'company' | 'personas' | 'settings' | 'review';

const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'personas', label: 'Personas', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'review', label: 'Generate', icon: Sparkles },
];

// Main page export with Suspense boundary
export default function SetupPage() {
    return (
        <Suspense fallback={<SetupLoadingFallback />}>
            <SetupContent />
        </Suspense>
    );
}

function SetupLoadingFallback() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
    );
}

function SetupContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const isDemo = searchParams.get('demo') === 'slideforge';

    const [currentStep, setCurrentStep] = useState<Step>('company');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationStatus, setGenerationStatus] = useState('');

    // Form state
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

    // Load demo data if demo mode
    useEffect(() => {
        if (isDemo) {
            setCompany(SLIDEFORGE_COMPANY);
            setSelectedPersonas(SLIDEFORGE_PERSONAS.map(p => p.id));
            setSelectedSubreddits(SLIDEFORGE_SUBREDDITS);
            setKeywords(SLIDEFORGE_COMPANY.keywords.join(', '));
        }
    }, [isDemo]);

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);
    const progress = ((currentStepIndex + 1) / steps.length) * 100;

    const handleNext = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex].id);
        }
    };

    const handleBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex].id);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenerationProgress(10);
        setGenerationStatus('Preparing configuration...');

        try {
            const personas = SLIDEFORGE_PERSONAS.filter(p => selectedPersonas.includes(p.id));

            const config = {
                company,
                personas,
                subreddits: selectedSubreddits,
                keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
                postsPerWeek,
                qualityThreshold
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
            setGenerationStatus('Complete! Redirecting to dashboard...');

            // Store result and navigate to dashboard
            try {
                // Save generation parameters for subsequent weeks
                localStorage.setItem('generationParams', JSON.stringify(config));

                // Store as an array of weeks (new format)
                localStorage.setItem('generatedCalendars', JSON.stringify([result]));

                // Also store in legacy format for backward compatibility
                localStorage.setItem('generatedCalendar', JSON.stringify(result));

                // Wait a moment for state to settle and user to see 100%
                setTimeout(() => {
                    router.push('/workspace');
                }, 1500);
            } catch (e) {
                throw new Error('Failed to save data. Please check sufficient browser storage.');
            }

        } catch (error) {
            console.error('Generation error:', error);
            setGenerationStatus('Error occurred. Please try again.');
            setIsGenerating(false);
        }
    };

    const togglePersona = (personaId: string) => {
        setSelectedPersonas(prev =>
            prev.includes(personaId)
                ? prev.filter(id => id !== personaId)
                : [...prev, personaId]
        );
    };

    const toggleSubreddit = (subreddit: string) => {
        setSelectedSubreddits(prev =>
            prev.includes(subreddit)
                ? prev.filter(s => s !== subreddit)
                : [...prev, subreddit]
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-semibold text-gray-900">
                            {isDemo ? 'SlideForge Demo Setup' : 'Campaign Setup'}
                        </h1>
                        {isDemo && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                Demo Mode
                            </Badge>
                        )}
                    </div>

                    {/* Steps */}
                    <div className="flex items-center gap-2">
                        {steps.map((step, idx) => (
                            <div key={step.id} className="flex items-center">
                                <button
                                    onClick={() => setCurrentStep(step.id)}
                                    className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                    ${currentStep === step.id
                                            ? 'bg-blue-100 text-blue-700'
                                            : idx < currentStepIndex
                                                ? 'text-green-600'
                                                : 'text-gray-400'
                                        }
                  `}
                                >
                                    {idx < currentStepIndex ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <step.icon className="w-4 h-4" />
                                    )}
                                    <span className="text-sm font-medium hidden sm:block">{step.label}</span>
                                </button>
                                {idx < steps.length - 1 && (
                                    <div className={`w-8 h-0.5 mx-1 ${idx < currentStepIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-32 pb-24 px-6">
                <div className="max-w-3xl mx-auto">

                    {/* Step 1: Company */}
                    {currentStep === 'company' && (
                        <Card className="p-8 slide-up border-2 shadow-lg">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-blue-100">
                                    <Building2 className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Company Context</h2>
                                    <p className="text-sm text-gray-500">Tell us about your product and value</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <Label htmlFor="companyName" className="text-base font-semibold">Company Name *</Label>
                                    <Input
                                        id="companyName"
                                        value={company.name}
                                        onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                        placeholder="e.g., SlideForge"
                                        className="mt-2 h-11"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">This will be used in conversation context</p>
                                </div>

                                <div>
                                    <Label htmlFor="product" className="text-base font-semibold">Product Description *</Label>
                                    <Textarea
                                        id="product"
                                        value={company.product}
                                        onChange={(e) => setCompany({ ...company, product: e.target.value })}
                                        placeholder="e.g., AI-powered presentation and storytelling tool that helps teams create beautiful slides in seconds"
                                        className="mt-2"
                                        rows={4}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Briefly describe what your product does and who it's for</p>
                                </div>

                                <div>
                                    <Label className="text-base font-semibold">Value Propositions *</Label>
                                    <p className="text-sm text-gray-500 mb-3">What makes your product unique? Add 2-5 key benefits</p>
                                    <div className="space-y-3">
                                        {company.valuePropositions.map((vp, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <div className="flex items-center justify-center w-8 h-11 bg-blue-100 text-blue-600 rounded-lg font-semibold text-sm flex-shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <Input
                                                    value={vp}
                                                    onChange={(e) => {
                                                        const newVPs = [...company.valuePropositions];
                                                        newVPs[idx] = e.target.value;
                                                        setCompany({ ...company, valuePropositions: newVPs });
                                                    }}
                                                    placeholder={`e.g., ${idx === 0 ? 'Save 10 hours per week on presentations' : idx === 1 ? 'AI-powered design suggestions' : 'Works with your existing content'}`}
                                                    className="h-11"
                                                />
                                                {company.valuePropositions.length > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            const newVPs = company.valuePropositions.filter((_, i) => i !== idx);
                                                            setCompany({ ...company, valuePropositions: newVPs });
                                                        }}
                                                        className="flex-shrink-0"
                                                    >
                                                        ×
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        {company.valuePropositions.length < 5 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCompany({
                                                    ...company,
                                                    valuePropositions: [...company.valuePropositions, '']
                                                })}
                                                className="w-full border-dashed"
                                            >
                                                + Add another value proposition
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Progress indicator */}
                                <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Form completion</span>
                                        <span className="font-medium text-blue-600">
                                            {Math.round(((company.name ? 1 : 0) + (company.product ? 1 : 0) + (company.valuePropositions.filter(v => v).length > 0 ? 1 : 0)) / 3 * 100)}%
                                        </span>
                                    </div>
                                    <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                                            style={{ width: `${((company.name ? 1 : 0) + (company.product ? 1 : 0) + (company.valuePropositions.filter(v => v).length > 0 ? 1 : 0)) / 3 * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Step 2: Personas */}
                    {currentStep === 'personas' && (
                        <Card className="p-8 slide-up border-2 shadow-lg">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-purple-100">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-gray-900">Select Personas</h2>
                                    <p className="text-sm text-gray-500">Choose diverse voices for authentic conversations</p>
                                </div>
                                <Badge className="bg-purple-100 text-purple-700 text-sm px-3 py-1">
                                    {selectedPersonas.length} selected
                                </Badge>
                            </div>

                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    💡 <span className="font-semibold">Pro tip:</span> Select 3-5 personas for varied, authentic conversations. Each has unique communication styles and Reddit behavior.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {SLIDEFORGE_PERSONAS.map((persona) => {
                                    const isSelected = selectedPersonas.includes(persona.id);
                                    return (
                                        <div
                                            key={persona.id}
                                            onClick={() => togglePersona(persona.id)}
                                            className={`
                                                group p-5 rounded-xl border-2 cursor-pointer transition-all duration-200
                                                ${isSelected
                                                    ? 'border-purple-500 bg-purple-50 shadow-md'
                                                    : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300 group-hover:border-purple-400'}`}>
                                                    {isSelected && (
                                                        <Check className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                            {persona.name.split(' ').map((n: string) => n[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-gray-900 block">{persona.name}</span>
                                                            <span className="text-sm text-gray-600">{persona.role}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-700 leading-relaxed mb-3 line-clamp-2">
                                                        {persona.backstory.substring(0, 180)}...
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge variant="secondary" className="text-xs bg-white">
                                                            📝 {persona.communicationStyle.default}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-xs bg-white">
                                                            📊 {persona.redditPattern}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-xs bg-white">
                                                            🎯 {persona.experienceLevel} exp
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {selectedPersonas.length === 0 && (
                                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ Please select at least one persona to continue
                                    </p>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Step 3: Settings */}
                    {currentStep === 'settings' && (
                        <Card className="p-8 slide-up border-2 shadow-lg">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-green-100">
                                    <Settings className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Campaign Settings</h2>
                                    <p className="text-sm text-gray-500">Fine-tune your content strategy</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Subreddits */}
                                <div>
                                    <Label className="text-base font-semibold">Target Subreddits *</Label>
                                    <p className="text-sm text-gray-500 mt-1 mb-3">Select communities where your audience hangs out</p>
                                    <div className="flex flex-wrap gap-2">
                                        {SLIDEFORGE_SUBREDDITS.map((subreddit) => {
                                            const isSelected = selectedSubreddits.includes(subreddit);
                                            return (
                                                <Badge
                                                    key={subreddit}
                                                    onClick={() => toggleSubreddit(subreddit)}
                                                    className={`
                                                        cursor-pointer transition-all text-sm px-4 py-2
                                                        ${isSelected
                                                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                                                            : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-400'
                                                        }
                                                    `}
                                                >
                                                    {isSelected && '✓ '}
                                                    {subreddit}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                    <p className="text-sm font-medium text-green-600 mt-3">
                                        ✓ {selectedSubreddits.length} subreddit{selectedSubreddits.length !== 1 ? 's' : ''} selected
                                    </p>
                                </div>

                                {/* Keywords */}
                                <div>
                                    <Label htmlFor="keywords" className="text-base font-semibold">Target Keywords</Label>
                                    <p className="text-sm text-gray-500 mt-1 mb-2">Keywords to trigger relevant conversations (comma-separated)</p>
                                    <Textarea
                                        id="keywords"
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                        placeholder="presentation tool, slide deck, PowerPoint alternative, design automation, pitch deck..."
                                        className="mt-1"
                                        rows={3}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Tip: Include variations and related terms your audience might search for
                                    </p>
                                </div>

                                {/* Posts per week */}
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <Label className="text-base font-semibold">Posts Per Week</Label>
                                        <span className="text-2xl font-bold text-blue-600">{postsPerWeek}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="14"
                                        value={postsPerWeek}
                                        onChange={(e) => setPostsPerWeek(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, rgb(37 99 235) 0%, rgb(37 99 235) ${(postsPerWeek / 14) * 100}%, rgb(229 231 235) ${(postsPerWeek / 14) * 100}%, rgb(229 231 235) 100%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                                        <span className={postsPerWeek <= 3 ? 'font-semibold text-green-600' : ''}>Conservative (1-3)</span>
                                        <span className={postsPerWeek >= 5 && postsPerWeek <= 8 ? 'font-semibold text-blue-600' : ''}>Balanced (5-8)</span>
                                        <span className={postsPerWeek >= 10 ? 'font-semibold text-orange-600' : ''}>Aggressive (10+)</span>
                                    </div>
                                </div>

                                {/* Quality threshold */}
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <Label className="text-base font-semibold">Quality Threshold</Label>
                                        <span className="text-2xl font-bold text-green-600">{qualityThreshold}/100</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="95"
                                        value={qualityThreshold}
                                        onChange={(e) => setQualityThreshold(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, rgb(34 197 94) 0%, rgb(34 197 94) ${((qualityThreshold - 50) / 45) * 100}%, rgb(229 231 235) ${((qualityThreshold - 50) / 45) * 100}%, rgb(229 231 235) 100%)`
                                        }}
                                    />
                                    <p className="text-sm text-gray-600 mt-3">
                                        Content scoring below <span className="font-semibold">{qualityThreshold}</span> will be automatically regenerated
                                    </p>
                                </div>

                                {/* Estimated output */}
                                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                                    <h3 className="font-semibold text-blue-900 mb-3">📊 Estimated Output</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-blue-700">Conversations/Week</p>
                                            <p className="text-2xl font-bold text-blue-900">{postsPerWeek}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-700">Generation Time</p>
                                            <p className="text-2xl font-bold text-blue-900">~{Math.ceil(postsPerWeek * 15 / 60)}min</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Step 4: Review & Generate */}
                    {currentStep === 'review' && (
                        <Card className="p-8 slide-up border-2 shadow-lg">
                            {!isGenerating ? (
                                <>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Review & Generate</h2>
                                            <p className="text-sm text-gray-500">Verify your settings and launch</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Summary Cards */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Building2 className="w-4 h-4 text-blue-600" />
                                                    <p className="text-sm font-medium text-blue-700">Company</p>
                                                </div>
                                                <p className="font-bold text-gray-900 text-lg">{company.name || 'Not set'}</p>
                                            </div>
                                            <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Users className="w-4 h-4 text-purple-600" />
                                                    <p className="text-sm font-medium text-purple-700">Personas</p>
                                                </div>
                                                <p className="font-bold text-gray-900 text-lg">{selectedPersonas.length} selected</p>
                                            </div>
                                            <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                    </svg>
                                                    <p className="text-sm font-medium text-green-700">Subreddits</p>
                                                </div>
                                                <p className="font-bold text-gray-900 text-lg">{selectedSubreddits.length} communities</p>
                                            </div>
                                            <div className="p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <p className="text-sm font-medium text-orange-700">Posts/Week</p>
                                                </div>
                                                <p className="font-bold text-gray-900 text-lg">{postsPerWeek} conversations</p>
                                            </div>
                                        </div>

                                        {/* Generation Preview */}
                                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-blue-600" />
                                                What You'll Get
                                            </h3>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                                                        {postsPerWeek}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">Conversations</p>
                                                        <p className="text-sm text-gray-600">Full Reddit threads</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                                                        {qualityThreshold}+
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">Quality Score</p>
                                                        <p className="text-sm text-gray-600">Authenticity verified</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">Safety Checked</p>
                                                        <p className="text-sm text-gray-600">Spam-proof</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Generate button */}
                                        <div className="pt-4">
                                            <Button
                                                size="lg"
                                                className="w-full text-lg py-7 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
                                                onClick={handleGenerate}
                                                disabled={selectedPersonas.length === 0 || selectedSubreddits.length === 0}
                                            >
                                                <Sparkles className="mr-2 w-5 h-5" />
                                                Generate {postsPerWeek} Authentic Conversations
                                            </Button>
                                            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
                                                <span>⏱️ ~{Math.ceil(postsPerWeek * 15 / 60)} minutes</span>
                                                <span>•</span>
                                                <span>🎯 {qualityThreshold}+ quality</span>
                                                <span>•</span>
                                                <span>🛡️ Safety validated</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="relative inline-block mb-6">
                                        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                                        <div className="absolute inset-0 w-16 h-16 border-4 border-blue-200 rounded-full animate-ping opacity-20" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Crafting Your Calendar</h2>
                                    <p className="text-lg text-gray-600 mb-8">{generationStatus}</p>
                                    <div className="max-w-md mx-auto">
                                        <Progress value={generationProgress} className="h-3" />
                                        <p className="text-sm font-medium text-blue-600 mt-2">{generationProgress}%</p>
                                    </div>
                                    <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${generationProgress > 20 ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <span>AI Generation</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${generationProgress > 60 ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <span>Quality Check</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${generationProgress > 80 ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <span>Safety Validation</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </main>

            {/* Fixed Footer Nav */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 px-6">
                <div className="max-w-3xl mx-auto flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStepIndex === 0 || isGenerating}
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back
                    </Button>

                    {currentStep !== 'review' && (
                        <Button onClick={handleNext}>
                            Next
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    )}
                </div>
            </footer>
        </div>
    );
}
