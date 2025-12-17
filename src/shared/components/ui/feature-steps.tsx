"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import { cn } from "@/shared/lib/utils/cn";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface Feature {
  step: string;
  title?: string;
  content: string;
  image: string;
}

interface FeatureStepsProps {
  features: Feature[];
  className?: string;
  title?: string;
  subtitle?: string;
  autoPlayInterval?: number;
  imageHeight?: string;
}

export function FeatureSteps({
  features,
  className,
  title = "How to get Started",
  subtitle,
  autoPlayInterval = 5000,
  imageHeight = "h-[500px]",
}: FeatureStepsProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isHovering) return;
    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress((prev) => prev + 100 / (autoPlayInterval / 100));
      } else {
        setCurrentFeature((prev) => (prev + 1) % features.length);
        setProgress(0);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [progress, features.length, autoPlayInterval, isHovering]);

  const handleFeatureClick = (index: number) => {
    setCurrentFeature(index);
    setProgress(0);
  };

  return (
    <div className={cn("py-24 relative overflow-hidden", className)}>
      {/* Organic background shapes */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full px-6 relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter text-gray-900">
              {title.split(' ').map((word, i) => (
                <span key={i} className={i % 2 === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 inline-block px-2" : "inline-block px-1"}>
                  {word}
                </span>
              ))}
            </h2>
          </motion.div>

          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-md text-gray-500 max-w-md mx-auto font-medium"
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Playful Steps List */}
          <div className="flex flex-col gap-6 relative">
            {/* Creating a visual 'thread' connecting steps */}
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-100 via-indigo-100 to-transparent dashed-line" />

            {features.map((feature, index) => {
              const isActive = index === currentFeature;
              return (
                <motion.div
                  key={index}
                  layout
                  className={cn(
                    "group relative pl-24 pr-8 py-6 rounded-[2rem] cursor-pointer transition-all duration-500",
                    isActive
                      ? "bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] scale-105 z-10"
                      : "hover:bg-white/50 hover:scale-[1.02]"
                  )}
                  onClick={() => handleFeatureClick(index)}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  {/* Floating Step Bubble */}
                  <div className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border-4 border-white shadow-sm transition-all duration-500 z-20",
                    isActive ? "bg-blue-600 text-white w-12 h-12 text-lg shadow-blue-200" : "bg-gray-100 text-gray-400"
                  )}>
                    {index + 1}
                  </div>

                  <h3 className={cn(
                    "text-2xl font-bold mb-2 transition-colors duration-300",
                    isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600"
                  )}>
                    {feature.title || feature.step}
                  </h3>

                  <AnimatePresence mode="popLayout">
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="overflow-hidden"
                      >
                        <p className="text-gray-600 leading-relaxed text-lg mb-4">
                          {feature.content}
                        </p>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            initial={{ width: "0%" }}
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: "linear" }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* 3D Floating Image Container */}
          <div className={cn("relative perspective-1000", imageHeight)}>
            <AnimatePresence mode="wait">
              {features.map((feature, index) =>
                index === currentFeature && (
                  <motion.div
                    key={index}
                    className="absolute inset-0 preserve-3d"
                    initial={{ opacity: 0, rotateX: 10, rotateY: 10, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, rotateX: 0, rotateY: 0, scale: 1, y: 0 }}
                    exit={{ opacity: 0, rotateX: -10, rotateY: -5, scale: 0.95, y: -50 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  >
                    {/* Decorative Elements */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] opacity-20 blur-xl animate-pulse" />

                    <div className="relative h-full w-full rounded-[2rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border-8 border-white bg-white">
                      <Image
                        src={feature.image}
                        alt={feature.title || feature.step}
                        fill
                        className="object-cover"
                        priority={index === 0}
                      />

                      {/* Glassmorphic Overlay Tag */}
                      <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="absolute bottom-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl text-white font-bold tracking-wide shadow-lg"
                      >
                        {feature.step}
                      </motion.div>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
