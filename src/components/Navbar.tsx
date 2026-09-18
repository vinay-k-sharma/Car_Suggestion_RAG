import React from 'react';
import { Car as CarIcon, Database, Bot, Sparkles, Layers } from 'lucide-react';

interface NavbarProps {
  onOpenRAGInspector: () => void;
  onOpenPromptInspector: () => void;
  onToggleAssistant: () => void;
  isAssistantOpen: boolean;
  totalCarsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRAGInspector,
  onOpenPromptInspector,
  onToggleAssistant,
  isAssistantOpen,
  totalCarsCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
            <CarIcon className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">CarMatch</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 2026 AI
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Prompt-Driven Conversational Recommendation Engine
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Inventory Count Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{totalCarsCount} Verified Vehicles</span>
          </div>

          {/* 15-Layer Prompt Architecture Inspector Button */}
          <button
            id="prompt-architecture-btn"
            onClick={onOpenPromptInspector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-amber-300 text-xs font-medium transition-colors cursor-pointer"
            title="Inspect 15-Layer Modular Prompt Architecture (prompts.json)"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">15 Prompts</span>
          </button>

          {/* RAG Knowledge Base Inspector Button */}
          <button
            id="rag-knowledge-base-btn"
            onClick={onOpenRAGInspector}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            title="Inspect RAG Knowledge Base & Embeddings"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">RAG Knowledge</span>
          </button>

          {/* Toggle Attached Assistant */}
          <button
            id="toggle-assistant-header-btn"
            onClick={onToggleAssistant}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-xs transition-all shadow-md cursor-pointer ${
              isAssistantOpen
                ? 'bg-amber-400 text-slate-950 shadow-amber-400/20 font-semibold'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>{isAssistantOpen ? 'Hide Assistant' : 'Chat with Assistant'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
