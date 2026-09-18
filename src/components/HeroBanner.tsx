import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Fuel, Compass } from 'lucide-react';

interface HeroBannerProps {
  onQuickPrompt: (promptText: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onQuickPrompt }) => {
  const quickChips = [
    { label: 'I need a new car in 2026', prompt: 'I need a new car in 2026.' },
    { label: 'Blue automatic EV around ₹15–20 lakh', prompt: 'I need a blue automatic EV around ₹15–20 lakh.' },
    { label: 'Family SUV under $45k for snow', prompt: 'Family SUV under $45,000 for snowy winters.' },
    { label: 'Reliable hybrid commuter (40+ MPG)', prompt: 'Reliable hybrid commuter with 40+ MPG.' }
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border-b border-slate-800">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs text-amber-300 font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Grounded In Real Showroom Inventory via RAG</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Find your perfect car with an AI assistant that actually knows cars.
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Powered by Retrieval-Augmented Generation (RAG), our attached AI advisor analyzes verified vehicle specifications, real-world MPG, safety records, and pricing to find the exact match for your lifestyle.
          </p>

          {/* Quick RAG Search Prompt Chips */}
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" /> Try asking the assistant:
            </p>
            <div className="flex flex-wrap gap-2">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  id={`hero-chip-${idx}`}
                  onClick={() => onQuickPrompt(chip.prompt)}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700/80 hover:border-amber-500/50 transition-all text-left"
                >
                  <span>{chip.label}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Highlights Bar */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white">NHTSA / IIHS Tested</p>
              <p className="text-slate-400 text-[11px]">Verified crash ratings</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white">EV & Hybrid Ready</p>
              <p className="text-slate-400 text-[11px]">Range & 800V fast-charge data</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white">Real MPG & Costs</p>
              <p className="text-slate-400 text-[11px]">City, hwy & lease estimates</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white">RAG Hybrid Search</p>
              <p className="text-slate-400 text-[11px]">Semantic vector matching</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
