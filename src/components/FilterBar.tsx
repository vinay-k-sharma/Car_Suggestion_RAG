import React from 'react';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
  resultsCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  resultsCount
}) => {
  const bodyTypes = ['All', 'SUV', 'Sedan', 'Crossover', 'Truck', 'Wagon', 'Coupe'];
  const fuelTypes = ['All', 'Hybrid', 'Electric', 'Plug-in Hybrid', 'Gasoline'];
  const drivetrains = ['All', 'AWD', 'FWD', 'RWD'];

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm my-6">
      {/* Search and Sort row */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pb-4 border-b border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="car-search-input"
            type="text"
            value={filters.search}
            onChange={e => onFilterChange({ search: e.target.value })}
            placeholder="Search by make, model, features, or keyword (e.g. 'hybrid', 'leather', 'towing')..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300 whitespace-nowrap">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Sort by:</span>
            <select
              id="car-sort-select"
              value={filters.sortBy}
              onChange={e => onFilterChange({ sortBy: e.target.value as any })}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="recommended">Best Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="efficiency">Highest Efficiency / Range</option>
              <option value="hp">Highest Horsepower</option>
            </select>
          </div>

          <button
            id="reset-filters-btn"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Body Types Pill Selector */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-xs font-medium text-slate-400 w-20 shrink-0">Body Style:</span>
        <div className="flex flex-wrap gap-1.5">
          {bodyTypes.map(bt => (
            <button
              key={bt}
              id={`filter-body-${bt.toLowerCase()}`}
              onClick={() => onFilterChange({ bodyType: bt })}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filters.bodyType === bt
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
              }`}
            >
              {bt}
            </button>
          ))}
        </div>
      </div>

      {/* Fuel Types & Drivetrain */}
      <div className="pt-3 flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-xs font-medium text-slate-400 w-20 shrink-0">Powertrain:</span>
        <div className="flex flex-wrap gap-1.5">
          {fuelTypes.map(ft => (
            <button
              key={ft}
              id={`filter-fuel-${ft.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => onFilterChange({ fuelType: ft })}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filters.fuelType === ft
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
              }`}
            >
              {ft}
            </button>
          ))}
        </div>
      </div>

      {/* Price Cap & Drivetrain Row */}
      <div className="pt-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 w-20 shrink-0">Drivetrain:</span>
          <div className="flex gap-1.5">
            {drivetrains.map(dt => (
              <button
                key={dt}
                id={`filter-drivetrain-${dt.toLowerCase()}`}
                onClick={() => onFilterChange({ drivetrain: dt })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  filters.drivetrain === dt
                    ? 'bg-purple-500 text-white font-semibold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
                }`}
              >
                {dt}
              </button>
            ))}
          </div>
        </div>

        {/* Max Price Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Max MSRP:</span>
          <span className="text-xs font-bold text-amber-400 w-16">
            {filters.maxPrice >= 100000 ? 'Any' : `$${filters.maxPrice.toLocaleString()}`}
          </span>
          <input
            id="filter-max-price-range"
            type="range"
            min="25000"
            max="100000"
            step="5000"
            value={filters.maxPrice}
            onChange={e => onFilterChange({ maxPrice: Number(e.target.value) })}
            className="w-28 sm:w-36 accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Results Count Tag */}
        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-white">{resultsCount}</span> vehicles
        </div>
      </div>
    </div>
  );
};
