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
            <div className="animation-delay-8 animate-fadeIn flex flex-col items-center justify-cente gap-8 px-4 text-center relative z-10 w-full max-w-7xl mx-auto">
                <div className="z-10">
                    <div className="relative flex items-center whitespace-nowrap rounded-full border bg-popover px-3 py-1 text-xs leading-6 text-primary/60 hover:bg-zinc-50 transition-colors">
                        <Shapes className="h-5 p-1" />
                        <span className="font-medium">New: Unified Workspace</span>
                        <Link
                            href="/workspace"
                            className="ml-1 flex items-center font-semibold hover:text-blue-600 transition-colors"
                        >
                            <div className="absolute inset-0 flex" aria-hidden="true" />
                            Explore{" "}
                            <span aria-hidden="true">
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </span>
                        </Link>
                    </div>
                </div>

                <div className="w-full flex flex-col items-center justify-center gap-8">
                    <div className="px-2">
                        <div className="relative mx-auto max-w-6xl border border-blue-200/50 p-6 [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)] md:p-16 rounded-3xl bg-white/40 backdrop-blur-sm">
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <span className="relative flex h-3 w-3 items-center justify-center">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                                </span>
                                <p className="text-sm font-medium text-green-600">Live & Ready</p>
                            </div>
                            <h1 className="flex select-none flex-col px-3 py-2 text-center text-4xl font-semibold leading-none tracking-tight md:text-7xl lg:text-8xl text-gray-900">
                                <Plus
                                    strokeWidth={4}
                                    className="text-blue-500 absolute -left-5 -top-5 h-8 w-8 md:h-10 md:w-10"
                                />
                                <Plus
                                    strokeWidth={4}
                                    className="text-blue-500 absolute -bottom-5 -left-5 h-8 w-8 md:h-10 md:w-10"
                                />
                                <Plus
                                    strokeWidth={4}
                                    className="text-blue-500 absolute -right-5 -top-5 h-8 w-8 md:h-10 md:w-10"
                                />
                                <Plus
                                    strokeWidth={4}
                                    className="text-blue-500 absolute -bottom-5 -right-5 h-8 w-8 md:h-10 md:w-10"
                                />
                                Professional Reddit <span className="text-blue-600">Growth Platform.</span>
                            </h1>
                            <h2 className="mt-8 text-xl font-medium text-gray-800 max-w-md mx-auto">
                                Generate authentic Reddit conversations with <span className="text-blue-600 font-bold">AI-Powered Strategy</span>
                            </h2>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link href="/workspace">
                            <Button
                                size="lg"
                                className="group relative h-14 overflow-hidden rounded-full bg-blue-600 px-8 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-blue-500/25 active:scale-95"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Launch Workspace
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </span>
                                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            </Button>
                        </Link>
                        <Link href="/workspace?demo=slideforge">
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-14 rounded-full border-2 border-gray-200 px-8 text-lg font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-95"
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
