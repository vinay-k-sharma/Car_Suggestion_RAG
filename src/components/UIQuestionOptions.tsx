import React from 'react';
import { UIQuestion, UIOption } from '../types';
import {
  Zap,
  Leaf,
  BatteryCharging,
  Fuel,
  Sparkles,
  Wallet,
  BadgePercent,
  Gem,
  Crown,
  Settings2,
  Sliders,
  Car,
  Users,
  Mountain,
  Snowflake,
  ShieldCheck,
  Check
} from 'lucide-react';

interface UIQuestionOptionsProps {
  question: UIQuestion;
  onSelectOption: (option: UIOption) => void;
  disabled?: boolean;
}

export const UIQuestionOptions: React.FC<UIQuestionOptionsProps> = ({
  question,
  onSelectOption,
  disabled = false
}) => {
  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'zap':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'leaf':
        return <Leaf className="w-4 h-4 text-emerald-400" />;
      case 'battery-charging':
        return <BatteryCharging className="w-4 h-4 text-cyan-400" />;
      case 'fuel':
        return <Fuel className="w-4 h-4 text-rose-400" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 text-emerald-400" />;
      case 'badge-percent':
        return <BadgePercent className="w-4 h-4 text-amber-400" />;
      case 'gem':
        return <Gem className="w-4 h-4 text-cyan-400" />;
      case 'crown':
        return <Crown className="w-4 h-4 text-purple-400" />;
      case 'settings':
        return <Settings2 className="w-4 h-4 text-amber-400" />;
      case 'sliders':
        return <Sliders className="w-4 h-4 text-slate-300" />;
      case 'car':
        return <Car className="w-4 h-4 text-amber-400" />;
      case 'users':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'snowflake':
        return <Snowflake className="w-4 h-4 text-cyan-300" />;
      case 'mountain':
        return <Mountain className="w-4 h-4 text-orange-400" />;
      case 'sparkles':
      default:
        return <Sparkles className="w-4 h-4 text-amber-300" />;
    }
  };

  return (
    <div className="space-y-2 mt-3 animate-fade-in">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
        <span>Suggested Options:</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelectOption(opt)}
            disabled={disabled}
            className="text-left p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/70 hover:bg-slate-800/80 disabled:opacity-60 transition-all group flex items-start gap-3 shadow-sm hover:shadow-md hover:shadow-amber-500/10 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-slate-700/80 border border-slate-700/80 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
              {renderIcon(opt.icon)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-white group-hover:text-amber-300 transition-colors">
                  {opt.label}
                </span>
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-amber-400 font-bold transition-opacity">
                  Select →
                </span>
              </div>

              {opt.description && (
                <p className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors line-clamp-1 mt-0.5">
                  {opt.description}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
