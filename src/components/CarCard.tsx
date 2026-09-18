import React from 'react';
import { Car } from '../types';
import { Sparkles, Gauge, Fuel, Users, ShieldCheck, Check, Plus, ExternalLink, Bot } from 'lucide-react';

interface CarCardProps {
  car: Car;
  onSelect: (car: Car) => void;
  onAskAI: (car: Car) => void;
  onToggleCompare: (car: Car) => void;
  isCompared: boolean;
}

export const CarCard: React.FC<CarCardProps> = ({
  car,
  onSelect,
  onAskAI,
  onToggleCompare,
  isCompared
}) => {
  const getFuelBadge = (fuel: Car['fuelType']) => {
    switch (fuel) {
      case 'Electric':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Hybrid':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Plug-in Hybrid':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      default:
        return 'bg-slate-700/60 text-slate-300 border-slate-600/50';
    }
  };

  return (
    <div
      id={`car-card-${car.id}`}
      className="group relative flex flex-col bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5"
    >
      {/* Vehicle Image & Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        <img
          src={car.imageUrl}
          alt={`${car.year} ${car.make} ${car.model}`}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // High reliability fallback vehicle placeholder
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80';
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${getFuelBadge(car.fuelType)}`}>
            {car.fuelType}
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700/60 backdrop-blur-md">
            {car.drivetrain}
          </span>
        </div>

        {/* Compare Toggle */}
        <button
          id={`compare-toggle-${car.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompare(car);
          }}
          className={`absolute top-3 right-3 z-10 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-all backdrop-blur-md border ${
            isCompared
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
              : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-700 hover:border-slate-500'
          }`}
          title="Add to comparison"
        >
          {isCompared ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          <span>{isCompared ? 'Comparing' : 'Compare'}</span>
        </button>

        {/* Bottom Image Overlay: Trim & Rating */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs z-10">
          <span className="text-amber-400/90 font-medium tracking-wide truncate max-w-[200px]">
            {car.trim}
          </span>
          <span className="text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800 text-[11px] font-medium">
            ★ {car.rating}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title & Price */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs text-slate-400 font-medium">{car.year}</span>
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                {car.make} {car.model}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-base sm:text-lg font-bold text-white block">
                ${car.price.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 block">
                est. ${car.leasePerMonth}/mo
              </span>
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {car.idealFor}
          </p>

          {/* Key Metrics Grid */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 text-[11px] py-2.5 border-y border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">
                {car.fuelType === 'Electric'
                  ? `${car.electricRangeMiles} mi range`
                  : `${car.mpgCity || 30}/${car.mpgHwy || 38} MPG`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <Gauge className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{car.horsepower} HP ({car.acceleration0to60})</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{car.seatingCapacity} Seats • {car.cargoVolumeCuFt} cu ft</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate" title={car.safetyRating}>Top Safety Pick</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-1 flex items-center gap-2">
          {/* Ask AI Button (Direct integration with attached assistant) */}
          <button
            id={`ask-ai-car-${car.id}`}
            onClick={() => onAskAI(car)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all group/btn"
          >
            <Bot className="w-3.5 h-3.5 text-amber-400 group-hover/btn:scale-110 transition-transform" />
            <span>Ask AI</span>
          </button>

          {/* Details Button */}
          <button
            id={`details-car-${car.id}`}
            onClick={() => onSelect(car)}
            className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            <span>Specs</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
