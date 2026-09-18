import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  CheckCircle2,
  Filter,
  Check,
  Info
} from 'lucide-react';
import {
  Car,
  ChatMessage,
  RecommendationState,
  RecommendationApiResponse,
  UIOption,
  CarPreferences
} from '../types';
import { PrimaryRecommendationCard } from './PrimaryRecommendationCard';
import { UIQuestionOptions } from './UIQuestionOptions';

interface AttachedAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  dockMode: 'floating' | 'docked' | 'expanded';
  onSetDockMode: (mode: 'floating' | 'docked' | 'expanded') => void;
  onSelectCar: (car: Car) => void;
  onScheduleTestDrive: (car: Car) => void;
  pendingPrompt?: string | null;
  onClearPendingPrompt?: () => void;
  onOpenPromptInspector?: () => void;
  onExecutionPromptsUpdate?: (prompts: string[]) => void;
}

export const AttachedAssistant: React.FC<AttachedAssistantProps> = ({
  isOpen,
  onClose,
  onOpen,
  dockMode,
  onSetDockMode,
  onSelectCar,
  onScheduleTestDrive,
  pendingPrompt,
  onClearPendingPrompt,
  onOpenPromptInspector,
  onExecutionPromptsUpdate
}) => {
  const [assistantMode, setAssistantMode] = useState<'prompt_recommender' | 'rag_search'>('prompt_recommender');

  const [recommendationState, setRecommendationState] = useState<RecommendationState>({
    domain: 'cars',
    intent: 'car_recommendation',
    preferences: {},
    askedQuestions: [],
    confidence: 0,
    readyForRecommendation: false
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello! I'm your **2026 Vehicle Recommendation Advisor**, powered by a 15-layer modular prompt engine.\n\nTell me what you're looking for (e.g. *"I need a new car in 2026"* or *"I need a blue automatic EV around ₹15–20 lakh"*), and I'll extract your preferences and pinpoint your highest-matching vehicle!`,
      timestamp: Date.now(),
      suggestedPrompts: [
        'I need a new car in 2026.',
        'I need a blue automatic EV around ₹15–20 lakh.',
        'Family SUV under $45,000 for snowy winters.',
        'Reliable hybrid commuter with 40+ MPG.'
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});
  const [expandedFlows, setExpandedFlows] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle external prompt passed in (e.g. from HeroBanner or "Ask AI about this car" button)
  useEffect(() => {
    if (pendingPrompt && pendingPrompt.trim().length > 0) {
      if (!isOpen) onOpen();
      handleSend(pendingPrompt);
      if (onClearPendingPrompt) onClearPendingPrompt();
    }
  }, [pendingPrompt]);

  const handleSend = async (messageText: string) => {
    const textToSend = messageText.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (assistantMode === 'prompt_recommender') {
      setStatusMessage('Extracting preferences & orchestrating prompt layers...');
      try {
        const res = await fetch('/api/recommendation/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: textToSend,
            state: recommendationState
          })
        });

        if (!res.ok) {
          throw new Error(`Engine error ${res.status}`);
        }

        const data: RecommendationApiResponse = await res.json();

        // Update recommendation state from backend
        if (data.updates) {
          setRecommendationState(prev => ({
            ...prev,
            preferences: data.updates.preferences || prev.preferences,
            askedQuestions: data.updates.askedQuestions || prev.askedQuestions,
            confidence: data.updates.confidence ?? prev.confidence,
            readyForRecommendation: data.updates.readyForRecommendation ?? prev.readyForRecommendation
          }));
        }

        if (data.debugPromptFlow?.promptsTriggered && onExecutionPromptsUpdate) {
          onExecutionPromptsUpdate(data.debugPromptFlow.promptsTriggered);
        }

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: Date.now(),
          recommendationApiResponse: data,
          suggestedPrompts: data.action === 'recommendation' ? [
            'Compare with hybrid options',
            'Schedule test drive',
            'Start fresh recommendation'
          ] : []
        };

        setMessages(prev => [...prev, assistantMsg]);
      } catch (err: any) {
        console.error('Prompt recommendation error:', err);
        const errorMsg: ChatMessage = {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: `I experienced a brief hiccup connecting to the recommendation orchestrator. Let me help you find the right vehicle.`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setLoading(false);
        setStatusMessage('');
      }
    } else {
      // Fallback / secondary RAG search mode
      setStatusMessage('Searching verified vehicle knowledge base (RAG)...');
      try {
        const history = messages.slice(-6).map(m => ({
          role: m.role,
          content: m.content
        }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: textToSend,
            history
          })
        });

        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.content || 'I found these matching vehicles based on your requirements.',
          timestamp: Date.now(),
          retrievedCars: data.retrievedCars || [],
          citations: data.citations || [],
          suggestedPrompts: data.suggestedPrompts || []
        };

        setMessages(prev => [...prev, assistantMsg]);
      } catch (err: any) {
        console.error('Chat error:', err);
        const errorMsg: ChatMessage = {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: `I encountered an issue searching the inventory. Let me retry with local specifications.`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setLoading(false);
        setStatusMessage('');
      }
    }
  };

  const handleSelectOption = (option: UIOption) => {
    // Send option label or value as the next user message
    handleSend(option.label);
  };

  const handleResetChat = () => {
    setRecommendationState({
      domain: 'cars',
      intent: 'car_recommendation',
      preferences: {},
      askedQuestions: [],
      confidence: 0,
      readyForRecommendation: false
    });

    setMessages([
      {
        id: `welcome-msg-${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. What kind of vehicle are you looking for in 2026?`,
        timestamp: Date.now(),
        suggestedPrompts: [
          'I need a new car in 2026.',
          'I need a blue automatic EV around ₹15–20 lakh.',
          'Family SUV under $45,000 for snowy winters.',
          'Reliable hybrid commuter with 40+ MPG.'
        ]
      }
    ]);
  };

  const toggleCitation = (msgId: string) => {
    setExpandedCitations(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const toggleFlow = (msgId: string) => {
    setExpandedFlows(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  // If closed, render a floating trigger button at bottom-right
  if (!isOpen) {
    return (
      <button
        id="floating-assistant-trigger-btn"
        onClick={onOpen}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-2xl shadow-amber-500/30 transition-all transform hover:scale-105 group border border-amber-300/40"
      >
        <div className="relative">
          <Bot className="w-6 h-6 text-slate-950" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-amber-500 animate-pulse" />
        </div>
        <div className="text-left">
          <p className="text-xs uppercase tracking-wider font-extrabold text-slate-900 leading-none">CarMatch AI</p>
          <p className="text-[11px] font-medium text-slate-800 leading-tight">2026 Recommendation Bot</p>
        </div>
      </button>
    );
  }

  // Size styling based on dockMode
  const getContainerStyle = () => {
    switch (dockMode) {
      case 'docked':
        return 'fixed top-16 right-0 bottom-0 w-full sm:w-[480px] md:w-[540px] z-40 border-l border-slate-800 shadow-2xl';
      case 'expanded':
        return 'fixed inset-4 sm:inset-8 z-50 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden';
      default: // floating
        return 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[480px] h-[680px] max-h-[88vh] z-40 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden';
    }
  };

  // Preference pills for active state
  const preferencesList: { label: string; value: string }[] = [];
  if (recommendationState.preferences.purchaseYear) {
    preferencesList.push({ label: 'Year', value: `${recommendationState.preferences.purchaseYear}` });
  }
  if (recommendationState.preferences.budget?.display) {
    preferencesList.push({ label: 'Budget', value: recommendationState.preferences.budget.display });
  }
  if (recommendationState.preferences.fuelType) {
    preferencesList.push({ label: 'Fuel', value: recommendationState.preferences.fuelType.toUpperCase() });
  }
  if (recommendationState.preferences.transmission) {
    preferencesList.push({ label: 'Gearbox', value: recommendationState.preferences.transmission });
  }
  if (recommendationState.preferences.color) {
    preferencesList.push({ label: 'Color', value: recommendationState.preferences.color });
  }
  if (recommendationState.preferences.bodyType) {
    preferencesList.push({ label: 'Style', value: recommendationState.preferences.bodyType.toUpperCase() });
  }
  if (recommendationState.preferences.usage) {
    preferencesList.push({ label: 'Usage', value: recommendationState.preferences.usage.replace('_', ' ') });
  }

  return (
    <div
      id="attached-assistant-window"
      className={`flex flex-col bg-slate-950/98 backdrop-blur-xl text-white ${getContainerStyle()} transition-all duration-200`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">CarMatch Advisor</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {assistantMode === 'prompt_recommender' ? 'Prompt Engine' : 'RAG Specs'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">15-Layer Prompt Architecture</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 text-slate-400">
            {onOpenPromptInspector && (
              <button
                id="assistant-open-prompts-btn"
                onClick={onOpenPromptInspector}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-[11px] font-medium border border-slate-700/80 flex items-center gap-1 transition-colors"
                title="Inspect 15 Prompt Layers"
              >
                <Layers className="w-3 h-3" />
                <span className="hidden sm:inline">15 Prompts</span>
              </button>
            )}

            <button
              id="reset-chat-btn"
              onClick={handleResetChat}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors"
              title="Reset conversation state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Dock / Float Mode */}
            <button
              id="toggle-dock-mode-btn"
              onClick={() => onSetDockMode(dockMode === 'docked' ? 'floating' : 'docked')}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors hidden sm:block"
              title={dockMode === 'docked' ? 'Float window' : 'Dock to side'}
            >
              {dockMode === 'docked' ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            </button>

            {/* Expand Mode */}
            <button
              id="toggle-expand-mode-btn"
              onClick={() => onSetDockMode(dockMode === 'expanded' ? 'floating' : 'expanded')}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors hidden sm:block"
              title={dockMode === 'expanded' ? 'Normal view' : 'Maximize window'}
            >
              {dockMode === 'expanded' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close */}
            <button
              id="close-assistant-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
              title="Close assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Engine Mode Tabs & Extracted Preferences Bar */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => setAssistantMode('prompt_recommender')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                assistantMode === 'prompt_recommender'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Prompt Recommender
            </button>
            <button
              onClick={() => setAssistantMode('rag_search')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                assistantMode === 'rag_search'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              RAG Deep Search
            </button>
          </div>

          {recommendationState.confidence > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span>Confidence:</span>
              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${Math.round(recommendationState.confidence * 100)}%` }}
                />
              </div>
              <span className="font-mono text-white">{Math.round(recommendationState.confidence * 100)}%</span>
            </div>
          )}
        </div>

        {/* Live Extracted Preferences Bar */}
        {preferencesList.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-amber-400" />
              <span>Extracted:</span>
            </span>
            {preferencesList.map((item, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200"
              >
                <span className="text-slate-400">{item.label}:</span>{' '}
                <strong className="text-white font-medium">{item.value}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Role indicator */}
            <span className="text-[10px] text-slate-400 mb-1 px-1">
              {msg.role === 'user' ? 'You' : 'CarMatch AI'}
            </span>

            {/* Message Bubble */}
            <div
              className={`max-w-[95%] sm:max-w-[88%] rounded-2xl p-3.5 leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-amber-500/10'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
              }`}
            >
              {/* Formatted Text */}
              <div className="whitespace-pre-wrap space-y-2">
                {msg.content.split('\n\n').map((para, pIdx) => {
                  if (para.startsWith('### ')) {
                    return (
                      <h4 key={pIdx} className="font-bold text-amber-400 text-sm mt-1">
                        {para.replace('### ', '')}
                      </h4>
                    );
                  }
                  return (
                    <p key={pIdx}>
                      {para.split('**').map((seg, sIdx) =>
                        sIdx % 2 === 1 ? (
                          <strong key={sIdx} className={msg.role === 'user' ? 'font-bold' : 'font-semibold text-white'}>
                            {seg}
                          </strong>
                        ) : (
                          seg
                        )
                      )}
                    </p>
                  );
                })}
              </div>

              {/* Interactive UI Question Options (Chips / Cards) */}
              {msg.recommendationApiResponse?.action === 'question' && msg.recommendationApiResponse.question && (
                <UIQuestionOptions
                  question={msg.recommendationApiResponse.question}
                  onSelectOption={handleSelectOption}
                  disabled={loading}
                />
              )}

              {/* Primary Recommendation Card with 0-100 Match Meter */}
              {msg.recommendationApiResponse?.action === 'recommendation' && msg.recommendationApiResponse.recommendation && (
                <div className="mt-3.5">
                  <PrimaryRecommendationCard
                    recommendation={msg.recommendationApiResponse.recommendation}
                    onSelectCar={onSelectCar}
                    onAskAboutCar={(carName) => handleSend(`Tell me more about the ${carName}`)}
                    onResetPreferences={handleResetChat}
                  />
                </div>
              )}

              {/* Debug Prompt Flow Pill (Transparency) */}
              {msg.recommendationApiResponse?.debugPromptFlow && (
                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => toggleFlow(msg.id)}
                    className="flex items-center justify-between w-full text-[10px] text-amber-400/90 hover:text-amber-300 font-medium"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-amber-400" />
                      <span>15-Layer Prompt Execution ({msg.recommendationApiResponse.debugPromptFlow.promptsTriggered.length} layers)</span>
                    </span>
                    {expandedFlows[msg.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {expandedFlows[msg.id] && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800">
                        <span className="font-semibold text-amber-400">Execution Stack</span>
                        <span>{msg.recommendationApiResponse.debugPromptFlow.ruleTriggered}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {msg.recommendationApiResponse.debugPromptFlow.promptsTriggered.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-[10px] text-slate-300 font-mono"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RAG Citations Accordion (Transparency) */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                  <button
                    onClick={() => toggleCitation(msg.id)}
                    className="flex items-center justify-between w-full text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      RAG Context ({msg.citations.length} chunks retrieved)
                    </span>
                    {expandedCitations[msg.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {expandedCitations[msg.id] && (
                    <div className="mt-2 space-y-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                      {msg.citations.map((cit, cIdx) => (
                        <div key={cIdx} className="pb-1.5 border-b border-slate-800/60 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between text-slate-400 text-[10px]">
                            <span className="font-semibold text-amber-300">{cit.carName}</span>
                            <span className="bg-slate-800 px-1.5 py-0.2 rounded text-[9px] text-slate-300">
                              Score: {cit.score}
                            </span>
                          </div>
                          <p className="mt-0.5 text-slate-400 leading-tight">{cit.snippet}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* In-Chat Recommended Car Cards (RAG mode) */}
            {msg.retrievedCars && msg.retrievedCars.length > 0 && (
              <div className="mt-2.5 w-full space-y-2">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 px-1">
                  Matching Vehicles in Showroom:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {msg.retrievedCars.map((rcar) => (
                    <div
                      key={rcar.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all text-xs"
                    >
                      <img
                        src={rcar.imageUrl}
                        alt={rcar.model}
                        className="w-16 h-12 object-cover rounded-lg bg-slate-950 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-white truncate">
                            {rcar.year} {rcar.make} {rcar.model}
                          </h5>
                          <span className="font-bold text-amber-400 shrink-0 ml-2">
                            ${rcar.price.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {rcar.fuelType} • {rcar.drivetrain} • {rcar.fuelType === 'Electric' ? `${rcar.electricRangeMiles} mi range` : `${rcar.mpgHwy || 35} MPG hwy`}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            onClick={() => onSelectCar(rcar)}
                            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                          >
                            <span>View Specs</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                          <span className="text-slate-600">•</span>
                          <button
                            onClick={() => onScheduleTestDrive(rcar)}
                            className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
                          >
                            Book Test Drive
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Follow-up Prompts */}
            {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 w-full">
                {msg.suggestedPrompts.map((p, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSend(p)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 transition-all text-left flex items-center gap-1 cursor-pointer"
                  >
                    <span>{p}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-2.5 text-xs text-slate-400">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-spin shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-none">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-slate-300 font-medium ml-1">
                  {statusMessage || 'Analyzing requirements...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            id="assistant-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 'I need a blue automatic EV around ₹15–20 lakh'..."
            disabled={loading}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
          />
          <button
            id="assistant-send-btn"
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 font-semibold transition-colors shrink-0 shadow-md shadow-amber-500/20 disabled:shadow-none cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="mt-1.5 text-[10px] text-center text-slate-500">
          Prompt-Driven Recommendation Architecture: Minimal questions • Dynamic UI • Deterministic Match Score
        </p>
      </div>
    </div>
  );
};
