'use client';

import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';

interface DemoModeSwitcherProps {
    currentDemo?: string;
}

const DEMO_SCENARIOS = [
    {
        id: 'slideforge',
        name: 'SlideForge',
        description: 'AI presentation tool for startups',
        industry: 'SaaS'
    },
    {
        id: 'datapipe',
        name: 'DataPipe',
        description: 'ETL platform for data teams',
        industry: 'Data'
    },
    {
        id: 'devtools',
        name: 'DevTools Pro',
        description: 'Developer productivity suite',
        industry: 'DevTools'
    }
];

export function DemoModeSwitcher({ currentDemo }: DemoModeSwitcherProps) {
    const router = useRouter();

    const handleDemoChange = (demoId: string) => {
        if (demoId === 'custom') {
            router.push('/workspace');
        } else {
            router.push(`/workspace?demo=${demoId}`);
        }
    };

    const currentScenario = DEMO_SCENARIOS.find(d => d.id === currentDemo);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 px-2.5 text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                >
                    <Sparkles className="w-3 h-3" />
                    <span className="font-medium">
                        {currentScenario ? currentScenario.name : 'Demo Mode'}
                    </span>
                    <svg
                        className="w-3 h-3 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Demo Scenarios
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {DEMO_SCENARIOS.map((scenario) => (
                    <DropdownMenuItem
                        key={scenario.id}
                        onClick={() => handleDemoChange(scenario.id)}
                        className="flex flex-col items-start gap-1 py-2.5 cursor-pointer"
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-zinc-900">{scenario.name}</span>
                            {currentDemo === scenario.id && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-blue-50 text-blue-700 border-blue-200">
                                    Active
                                </Badge>
                            )}
                        </div>
                        <span className="text-xs text-zinc-500">{scenario.description}</span>
                        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                            {scenario.industry}
                        </span>
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => handleDemoChange('custom')}
                    className="text-zinc-600 hover:text-zinc-900 cursor-pointer"
                >
                    <span className="text-sm">✏️ Custom Configuration</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
