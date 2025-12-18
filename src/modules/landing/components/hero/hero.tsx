"use client";

import { useEffect } from "react";
import Link from "next/link";
import { renderCanvas } from "@/modules/landing/components/hero/canvas";
import { Shapes, ArrowRight, Plus } from "lucide-react";

import { Button } from "@/shared/components/ui/inputs/button";

export function Hero() {
    useEffect(() => {
        renderCanvas();
    }, []);

    return (
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 md:pt-20">
            <div className="animation-delay-8 animate-fadeIn flex flex-col items-center justify-center gap-6 md:gap-8 px-4 sm:px-6 text-center relative z-10 w-full max-w-7xl mx-auto">
                <div className="z-10">
                    <div className="relative inline-flex items-center rounded-full border bg-popover px-3 py-1 text-xs leading-6 text-primary/60 hover:bg-zinc-50 transition-colors max-w-full">
                        <Shapes className="h-4 w-4 sm:h-5 sm:p-1 flex-shrink-0" />
                        <span className="font-medium mx-1 sm:mx-0">New: Unified Workspace</span>
                        <Link
                            href="/workspace"
                            className="ml-1 flex items-center font-semibold hover:text-blue-600 transition-colors"
                        >
                            <div className="absolute inset-0 flex" aria-hidden="true" />
                            <span className="hidden sm:inline">Explore</span>
                            <span aria-hidden="true">
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </span>
                        </Link>
                    </div>
                </div>

                <div className="w-full flex flex-col items-center justify-center gap-6 md:gap-8">
                    <div className="px-2 sm:px-4 w-full">
                        <div className="relative mx-auto max-w-6xl border border-blue-200/50 p-4 sm:p-6 md:p-12 lg:p-16 [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)] rounded-2xl sm:rounded-3xl bg-white/40 backdrop-blur-sm">
                            <div className="flex items-center justify-center gap-2 mt-2 sm:mt-4 md:mt-6">
                                <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 items-center justify-center">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                                    <span className="relative inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500"></span>
                                </span>
                                <p className="text-xs sm:text-sm font-medium text-green-600">Live & Ready</p>
                            </div>
                            <h1 className="flex select-none flex-col px-2 sm:px-3 py-2 text-center text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold leading-tight md:leading-none tracking-tight text-gray-900">
                                <Plus
                                    strokeWidth={4}
                                    className="text-blue-500 absolute -left-3 -top-3 sm:-left-4 sm:-top-4 md:-left-5 md:-top-5 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10"
                                />
                                <Plus
                                    strokeWidth={4}
                                    className="text-blue-500 absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 md:-bottom-5 md:-left-5 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10"
                                />
                                <Plus
                                    strokeWidth={4}
                                    className="text-blue-500 absolute -right-3 -top-3 sm:-right-4 sm:-top-4 md:-right-5 md:-top-5 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10"
                                />
                                <Plus
                                    strokeWidth={4}
                                    className="text-blue-500 absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 md:-bottom-5 md:-right-5 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10"
                                />
                                Professional Reddit <span className="text-blue-600">Growth Platform.</span>
                            </h1>
                            <h2 className="mt-4 sm:mt-6 md:mt-8 text-base sm:text-lg md:text-xl font-medium text-gray-800 max-w-md mx-auto px-2">
                                Generate authentic Reddit conversations with <span className="text-blue-600 font-bold">AI-Powered Strategy</span>
                            </h2>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row w-full px-4 sm:px-0">
                        <Link href="/workspace" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                className="group relative h-12 sm:h-14 w-full sm:w-auto overflow-hidden rounded-full bg-blue-600 px-6 sm:px-8 text-base sm:text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-blue-500/25 active:scale-95"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Launch Workspace
                                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                                </span>
                                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            </Button>
                        </Link>
                        <Link href="/workspace?demo=slideforge" className="w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-12 sm:h-14 w-full sm:w-auto rounded-full border-2 border-gray-200 px-6 sm:px-8 text-base sm:text-lg font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                            >
                                View Demo
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
            <canvas
                className="bg-background pointer-events-none absolute inset-0 mx-auto opacity-60"
                id="canvas"
            ></canvas>
        </section>
    );
}
