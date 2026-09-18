import React from 'react';
import { Car } from '../types';
import { X, Check, AlertCircle, Bot, Calendar, Fuel, Gauge, ShieldCheck, Users, Box, ExternalLink } from 'lucide-react';

interface CarDetailsModalProps {
  car: Car | null;
  onClose: () => void;
  onAskAI: (car: Car) => void;
  onScheduleTestDrive: (car: Car) => void;
  onToggleCompare: (car: Car) => void;
  isCompared: boolean;
}

export const CarDetailsModal: React.FC<CarDetailsModalProps> = ({
  car,
  onClose,
  onAskAI,
  onScheduleTestDrive,
  onToggleCompare,
  isCompared
}) => {
  if (!car) return null;

  return (
    <div
      id="car-details-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        id="car-details-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-white max-h-[90vh] flex flex-col"
      >
        {/* Header Image with close button */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-slate-950 shrink-0">
          <img
            src={car.imageUrl}
            alt={`${car.year} ${car.make} ${car.model}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          {/* Close button */}
          <button
            id="close-details-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-md transition-colors border border-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Bottom Title Info */}
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {car.fuelType}
                </span>
                <span className="text-xs text-slate-400 font-medium">{car.trim}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {car.year} {car.make} {car.model}
              </h2>
            </div>

            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-bold text-amber-400">
                ${car.price.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 block">
                est. ${car.leasePerMonth}/mo lease
              </span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Overview */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Overview</h4>
            <p className="mt-1.5 text-sm text-slate-200 leading-relaxed">{car.description}</p>
            <div className="mt-2 text-xs text-amber-300/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              <strong>Ideal Target:</strong> {car.idealFor}
            </div>
          </div>

          {/* Specifications Grid */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
              Performance & Dimension Specifications
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  <span>Efficiency / Range</span>
                </div>
                <p className="font-bold text-sm text-white">
                  {car.fuelType === 'Electric'
                    ? `${car.electricRangeMiles} mi Range`
                    : `${car.mpgCity || 30}/${car.mpgHwy || 38} MPG`}
                </p>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span>Horsepower & 0-60</span>
                </div>
                <p className="font-bold text-sm text-white">
                  {car.horsepower} HP ({car.acceleration0to60})
                </p>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Seating Capacity</span>
                </div>
                <p className="font-bold text-sm text-white">{car.seatingCapacity} Passengers</p>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Box className="w-4 h-4 text-emerald-400" />
                  <span>Max Cargo Space</span>
                </div>
                <p className="font-bold text-sm text-white">{car.cargoVolumeCuFt} cu ft</p>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Safety Rating</span>
                </div>
                <p className="font-bold text-xs text-white leading-tight">{car.safetyRating}</p>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <ExternalLink className="w-4 h-4 text-amber-400" />
                  <span>Drivetrain</span>
                </div>
                <p className="font-bold text-sm text-white">
                  {car.drivetrain} ({car.bodyType})
                </p>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
              Key Features & Tech Highlights
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {car.keyFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-950/20 border border-emerald-800/40 p-3.5 rounded-xl text-xs">
              <h5 className="font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                <Check className="w-4 h-4" /> Strongest Selling Points (Pros)
              </h5>
              <ul className="space-y-1.5 text-slate-300">
                {car.pros.map((p, idx) => (
                  <li key={idx}>• {p}</li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-950/20 border border-amber-800/40 p-3.5 rounded-xl text-xs">
              <h5 className="font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                <AlertCircle className="w-4 h-4" /> Points to Consider (Cons)
              </h5>
              <ul className="space-y-1.5 text-slate-300">
                {car.cons.map((c, idx) => (
                  <li key={idx}>• {c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            id={`modal-compare-toggle-${car.id}`}
            onClick={() => onToggleCompare(car)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              isCompared
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isCompared ? 'Remove from Compare' : '+ Add to Compare'}
          </button>

          <div className="flex items-center gap-2">
            <button
              id={`modal-ask-ai-btn-${car.id}`}
              onClick={() => {
                onClose();
                onAskAI(car);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all"
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span>Ask AI About This Car</span>
            </button>

            <button
              id={`modal-book-test-drive-btn-${car.id}`}
              onClick={() => {
                onClose();
                onScheduleTestDrive(car);
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Test Drive</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
