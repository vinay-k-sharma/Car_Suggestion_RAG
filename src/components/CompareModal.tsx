import React from 'react';
import { Car } from '../types';
import { X, Bot, Check, Trash2, Fuel, Gauge, Box, ShieldCheck, Users } from 'lucide-react';

interface CompareModalProps {
  cars: Car[];
  onClose: () => void;
  onRemoveCar: (carId: string) => void;
  onClearAll: () => void;
  onAskAICompare: (cars: Car[]) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  cars,
  onClose,
  onRemoveCar,
  onClearAll,
  onAskAICompare
}) => {
  if (cars.length === 0) return null;

  return (
    <div
      id="compare-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        id="compare-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-white max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="font-bold text-lg text-white">Vehicle Side-by-Side Comparison</h3>
            <p className="text-xs text-slate-400">Comparing {cars.length} vehicles</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="clear-all-compare-btn"
              onClick={onClearAll}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>

            <button
              id="close-compare-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Table / Grid */}
        <div className="p-5 overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left text-xs border-collapse min-w-[650px]">
            {/* Image & Title row */}
            <thead>
              <tr className="border-b border-slate-800">
                <th className="p-3 w-40 text-slate-400 font-semibold bg-slate-950/40 sticky left-0 z-10">
                  Vehicle
                </th>
                {cars.map((c) => (
                  <th key={c.id} className="p-3 w-64 align-top">
                    <div className="relative rounded-xl overflow-hidden mb-2 aspect-[16/10] bg-slate-950">
                      <img
                        src={c.imageUrl}
                        alt={c.model}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => onRemoveCar(c.id)}
                        className="absolute top-2 right-2 p-1 rounded-md bg-slate-900/80 hover:bg-red-500 text-slate-300 hover:text-white transition-colors"
                        title="Remove car"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="font-bold text-sm text-white">{c.year} {c.make} {c.model}</div>
                    <div className="text-[11px] text-slate-400">{c.trim}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {/* Price */}
              <tr>
                <td className="p-3 font-semibold text-slate-400 bg-slate-950/40 sticky left-0">Starting MSRP</td>
                {cars.map(c => (
                  <td key={c.id} className="p-3 font-bold text-amber-400 text-sm">
                    ${c.price.toLocaleString()}
                    <span className="block text-[11px] text-slate-400 font-normal">
                      est. ${c.leasePerMonth}/mo lease
                    </span>
                  </td>
                ))}
              </tr>

              {/* Powertrain & Fuel */}
              <tr>
                <td className="p-3 font-semibold text-slate-400 bg-slate-950/40 sticky left-0">Powertrain</td>
                {cars.map(c => (
                  <td key={c.id} className="p-3 text-slate-200">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-medium">
                      {c.fuelType}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Fuel Economy / Range */}
              <tr>
                <td className="p-3 font-semibold text-slate-400 bg-slate-950/40 sticky left-0">Efficiency / Range</td>
                {cars.map(c => (
                  <td key={c.id} className="p-3 text-slate-200 font-medium">
                    {c.fuelType === 'Electric'
                      ? `${c.electricRangeMiles} mi Pure EV Range`
                      : `${c.mpgCity || 30} City / ${c.mpgHwy || 38} Hwy MPG`}
                  </td>
                ))}
              </tr>

              {/* Horsepower & 0-60 */}
              <tr>
                <td className="p-3 font-semibold text-slate-400 bg-slate-950/40 sticky left-0">Performance</td>
                {cars.map(c => (
                  <td key={c.id} className="p-3 text-slate-200">
                    {c.horsepower} HP • 0-60 in {c.acceleration0to60}
                  </td>
                ))}
              </tr>

              {/* Drivetrain */}
              <tr>
                <td className="p-3 font-semibold text-slate-400 bg-slate-950/40 sticky left-0">Drivetrain</td>
                {cars.map(c => (
                  <td key={c.id} className="p-3 text-slate-200 font-medium">
                    {c.drivetrain}
                  </td>
                ))}
              </tr>

              {/* Cargo Space */}
              <tr>
                <td className="p-3 font-semibold text-slate-400 bg-slate-950/40 sticky left-0">Max Cargo Space</td>
                {cars.map(c => (
                  <td key={c.id} className="p-3 text-slate-200">
                    {c.cargoVolumeCuFt} cu ft ({c.seatingCapacity} seats)
                  </td>
                ))}
              </tr>

              {/* Safety */}
              <tr>
                <td className="p-3 font-semibold text-slate-400 bg-slate-950/40 sticky left-0">Safety Rating</td>
                {cars.map(c => (
                  <td key={c.id} className="p-3 text-emerald-400 font-medium">
                    {c.safetyRating}
                  </td>
                ))}
              </tr>

              {/* Pros */}
              <tr>
                <td className="p-3 font-semibold text-slate-400 bg-slate-950/40 sticky left-0">Key Pros</td>
                {cars.map(c => (
                  <td key={c.id} className="p-3 text-slate-300">
                    <ul className="space-y-1 text-[11px]">
                      {c.pros.slice(0, 2).map((p, idx) => (
                        <li key={idx}>✓ {p}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>

              {/* Cons */}
              <tr>
                <td className="p-3 font-semibold text-slate-400 bg-slate-950/40 sticky left-0">Considerations</td>
                {cars.map(c => (
                  <td key={c.id} className="p-3 text-slate-400">
                    <ul className="space-y-1 text-[11px]">
                      {c.cons.slice(0, 2).map((con, idx) => (
                        <li key={idx}>⚠️ {con}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Click below to generate an AI evaluation of trade-offs between these vehicles.
          </span>
          <button
            id="ai-compare-these-btn"
            onClick={() => {
              onClose();
              onAskAICompare(cars);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20"
          >
            <Bot className="w-4 h-4" />
            <span>Ask CarMatch AI to Compare</span>
          </button>
        </div>
      </div>
    </div>
  );
};
