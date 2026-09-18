import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  X,
  Check,
  RotateCcw,
  Code,
  ShieldCheck,
  Zap,
  Terminal,
  Play,
  ArrowRight,
  Sliders,
  HelpCircle,
  FileJson
} from 'lucide-react';
import { PromptsConfig, PromptDefinition } from '../../server/promptEngine';

interface PromptArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastExecutionPrompts?: string[];
  onTestPrompt?: (promptText: string) => void;
}

export const PromptArchitectureModal: React.FC<PromptArchitectureModalProps> = ({
  isOpen,
  onClose,
  lastExecutionPrompts = [],
  onTestPrompt
}) => {
  const [config, setConfig] = useState<PromptsConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('system_orchestrator');
  const [editedTemplate, setEditedTemplate] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'architecture' | 'tester' | 'flow'>('architecture');

  // Test Console State
  const [testInput, setTestInput] = useState('I need a blue automatic EV around ₹15–20 lakh.');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPrompts();
    }
  }, [isOpen]);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prompts');
      const data = await res.json();
      setConfig(data);
      if (data.prompts && data.prompts[selectedPromptId]) {
        setEditedTemplate(data.prompts[selectedPromptId].template);
      }
    } catch (err) {
      console.error('Failed to load prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (id: string) => {
    setSelectedPromptId(id);
    setSaveSuccess(false);
    if (config?.prompts[id]) {
      setEditedTemplate(config.prompts[id].template);
    }
  };

  const handleSavePrompt = async () => {
    if (!selectedPromptId || !editedTemplate) return;
    try {
      const res = await fetch(`/api/prompts/${selectedPromptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: editedTemplate })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        fetchPrompts();
      }
    } catch (err) {
      console.error('Failed to update prompt template:', err);
    }
  };

  const handleRunTest = async (overridePrompt?: string) => {
    const input = overridePrompt || testInput;
    if (!input.trim()) return;

    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/recommendation/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ error: err.message || 'Execution error' });
    } finally {
      setTestLoading(false);
    }
  };

  if (!isOpen) return null;

  const promptList: PromptDefinition[] = config?.prompts
    ? (Object.values(config.prompts) as PromptDefinition[]).sort((a, b) => a.layer - b.layer)
    : [];

  const activePrompt: PromptDefinition | undefined = config?.prompts
    ? (config.prompts as Record<string, PromptDefinition>)[selectedPromptId]
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Prompt-Driven Architecture Inspector</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  15 Modular Prompts
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Single-responsibility prompt layers for minimal, humanized, and dynamic product recommendations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab switchers */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <button
                id="tab-prompt-architecture"
                onClick={() => setActiveTab('architecture')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'architecture'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Prompts Config (15)
              </button>
              <button
                id="tab-prompt-tester"
                onClick={() => setActiveTab('tester')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'tester'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Live Test & JSON Contract</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'architecture' && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
              {/* Left Column: 15 Prompts List */}
              <div className="md:col-span-5 border-r border-slate-800 overflow-y-auto p-4 space-y-2 bg-slate-950/40">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Prompt Hierarchy (15 Layers)
                  </span>
                  <button
                    onClick={fetchPrompts}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reload
                  </button>
                </div>

                {promptList.map((prompt) => {
                  const isSelected = prompt.id === selectedPromptId;
                  const isFiredInLastTurn = lastExecutionPrompts.includes(prompt.id);

                  return (
                    <button
                      key={prompt.id}
                      onClick={() => handleSelectPrompt(prompt.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {prompt.layer}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-semibold truncate text-white">{prompt.name}</h4>
                          {isFiredInLastTurn && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shrink-0">
                              Active Turn
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{prompt.purpose}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Prompt Detail & Live Editor */}
              <div className="md:col-span-7 flex flex-col p-6 overflow-y-auto bg-slate-900/40">
                {activePrompt ? (
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                            Layer {activePrompt.layer}
                          </span>
                          <h4 className="text-base font-bold text-white">{activePrompt.name}</h4>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{activePrompt.purpose}</p>
                      </div>

                      {saveSuccess && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                          <Check className="w-3.5 h-3.5" />
                          <span>Saved to prompts.json</span>
                        </div>
                      )}
                    </div>

                    {/* Key Architectural Principle Banner */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Core Rule Enforced:</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {activePrompt.id === 'preference_extraction' && 'Rule 1: Extract Before Asking. Analyzes user message to parse all entities before formulating questions.'}
                        {activePrompt.id === 'non_recurring_guard' && 'Rule 2: Never Ask Twice. Cross-references collected preference state and history to reject duplicate questions.'}
                        {activePrompt.id === 'question_completion' && 'Rule 3: Keep Conversation Small. Recommends immediately once 2-3 key attributes or confidence threshold is met.'}
                        {activePrompt.id === 'next_best_question' && 'Rule 4: Dynamic Questions. Dynamically picks the single highest-value differentiating missing attribute.'}
                        {activePrompt.id === 'warm_humanized_response' && 'Rule 5: Warm, Humanized Tone. Short, friendly, non-robotic conversational text with zero SaaS slop.'}
                        {activePrompt.id === 'ui_selection' && 'Rule 6: UI-First Options. Returns structured chips, cards, buttons, and icons rather than plain text.'}
                        {activePrompt.id === 'match_score_input' && 'Rule 8: Deterministic 0-100 Match Meter. Scores only criteria for which user preferences exist.'}
                        {activePrompt.id === 'final_card_structurer' && 'Primary Recommendation Card. Generates structured JSON for exactly one standout primary recommendation.'}
                        {!['preference_extraction', 'non_recurring_guard', 'question_completion', 'next_best_question', 'warm_humanized_response', 'ui_selection', 'match_score_input', 'final_card_structurer'].includes(activePrompt.id) && 'Modular single-responsibility prompt ensuring strict separation of concerns.'}
                      </p>
                    </div>

                    {/* Live Editor */}
                    <div className="flex-1 flex flex-col">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Prompt Template / System Instruction</span>
                        <span className="text-[10px] text-slate-500 font-mono">Dynamic variables in curly braces</span>
                      </label>
                      <textarea
                        value={editedTemplate}
                        onChange={(e) => setEditedTemplate(e.target.value)}
                        className="flex-1 min-h-[220px] w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
                      />
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-[11px] text-slate-500 font-mono">ID: {activePrompt.id}</span>
                      <button
                        onClick={handleSavePrompt}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Template Changes</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                    Select a prompt from the hierarchy to view details.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tester' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Presets */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Test Prompt Presets (Click to Execute):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "I need a new car in 2026.",
                    "I need a blue automatic EV around ₹15–20 lakh.",
                    "Family SUV under $45,000 for snowy winters with AWD.",
                    "Reliable hybrid commuter with 40+ MPG under $35,000."
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTestInput(preset);
                        handleRunTest(preset);
                      }}
                      className="text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 transition-all text-xs text-slate-300 group flex items-center justify-between"
                    >
                      <span className="font-medium group-hover:text-amber-300">{preset}</span>
                      <Play className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-2 opacity-60 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Input & Runner */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Custom User Message Input:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Enter any vehicle requirement..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                    onKeyDown={(e) => e.key === 'Enter' && handleRunTest()}
                  />
                  <button
                    onClick={() => handleRunTest()}
                    disabled={testLoading}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 font-bold text-xs transition-all flex items-center gap-2 shrink-0 shadow-md shadow-amber-500/20"
                  >
                    {testLoading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>Run Turn</span>
                  </button>
                </div>
              </div>

              {/* Output Preview */}
              {testResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-amber-400" />
                      <span>Structured API Output Contract</span>
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      testResult.action === 'recommendation'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      Action: {testResult.action}
                    </span>
                  </div>

                  {/* Summary Callout */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <p className="text-xs text-white font-medium">
                      <span className="text-slate-400">Assistant Message: </span>
                      {testResult.message}
                    </p>
                    {testResult.debugPromptFlow && (
                      <div className="text-[11px] text-slate-400">
                        <span className="text-amber-400 font-semibold">Prompts Triggered: </span>
                        {testResult.debugPromptFlow.promptsTriggered?.join(' → ')}
                      </div>
                    )}
                  </div>

                  {/* Raw JSON */}
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 max-h-[300px] overflow-y-auto">
                    <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
