import React, { useState } from 'react';
import {
  PrimaryRecommendation,
  Car
} from '../types';
import {
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Gauge,
  Calendar,
  ExternalLink,
  MessageSquare,
  RotateCcw,
  Check,
  Info
} from 'lucide-react';

interface PrimaryRecommendationCardProps {
  recommendation: PrimaryRecommendation;
  onSelectCar?: (car: Car) => void;
  onAskAboutCar?: (carName: string) => void;
  onResetPreferences?: () => void;
}

export const PrimaryRecommendationCard: React.FC<PrimaryRecommendationCardProps> = ({
  recommendation,
  onSelectCar,
  onAskAboutCar,
  onResetPreferences
}) => {
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [scheduledTestDrive, setScheduledTestDrive] = useState(false);

  // Match score color formatting
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 75) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
  };

  const scoreBadgeClass = getScoreColor(recommendation.matchScore);

  return (
    <div
      id={`recommendation-card-${recommendation.id}`}
      className="rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl shadow-amber-500/10 overflow-hidden text-slate-100 animate-fade-in"
    >
      {/* Top Banner: Standout Match & Score Meter */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-500/15 via-slate-800 to-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs uppercase tracking-wider font-extrabold text-amber-300">
            Top Recommendation
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            2026 Model Year
          </span>
        </div>

        {/* 0 to 100 Match Meter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${scoreBadgeClass} hover:opacity-90`}
            title="Click to view transparent match score breakdown"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{recommendation.matchScore}/100 Match</span>
            {showScoreBreakdown ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Transparent Score Breakdown */}
      {showScoreBreakdown && recommendation.scoreBreakdown && (
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Deterministic Match Score Breakdown</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Weighted Total: {recommendation.matchScore}%</span>
          </div>

          <div className="space-y-1.5 pt-1">
            {recommendation.scoreBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{item.criterion}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    weight {item.weight}%
                  </span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[200px]">{item.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.score >= 80 ? 'bg-emerald-400' : item.score >= 50 ? 'bg-amber-400' : 'bg-slate-500'}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-[11px] text-white w-7 text-right">{item.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image & Price Area */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
        <img
          src={recommendation.imageUrl}
          alt={recommendation.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-md">
              {recommendation.name}
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {recommendation.carData.trim} • {recommendation.carData.bodyType}
            </p>
          </div>

          <div className="text-right bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Starting MSRP</span>
            <span className="text-base font-extrabold text-amber-400 tracking-tight">
              {recommendation.price.display}
            </span>
            {recommendation.price.leasePerMonth && (
              <span className="text-[11px] text-slate-400 block leading-tight">
                ~${recommendation.price.leasePerMonth}/mo lease
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 space-y-4">
        {/* Why this car matches you */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why This Fits Your Intent</span>
          </div>
          <p className="leading-relaxed text-slate-300 text-xs">{recommendation.reason}</p>
        </div>

        {/* Matched Preferences Checkmarks */}
        {recommendation.matchedPreferences && recommendation.matchedPreferences.length > 0 && (
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Preferences Matched:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recommendation.matchedPreferences.map((pref, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{pref}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Specifications Grid */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Verified Specifications:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {Object.entries(recommendation.specifications).map(([specKey, specVal]) => (
              <div key={specKey} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-medium block truncate">{specKey}</span>
                <span className="font-bold text-white text-xs truncate block mt-0.5">{specVal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
          {onSelectCar && (
            <button
              onClick={() => onSelectCar(recommendation.carData)}
              className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full Specifications</span>
            </button>
          )}

          <button
            onClick={() => setScheduledTestDrive(true)}
            disabled={scheduledTestDrive}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              scheduledTestDrive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 cursor-default'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
            }`}
          >
            {scheduledTestDrive ? <Check className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{scheduledTestDrive ? 'Test Drive Requested' : 'Schedule Test Drive'}</span>
          </button>

          {onAskAboutCar && (
            <button
              onClick={() => onAskAboutCar(recommendation.name)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Ask detailed follow-up questions"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Ask AI</span>
            </button>
          )}

          {onResetPreferences && (
            <button
              onClick={onResetPreferences}
              className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors ml-auto"
              title="Reset conversation and start fresh"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
