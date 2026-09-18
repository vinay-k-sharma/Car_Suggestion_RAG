import React, { useState, useEffect, useMemo } from 'react';
import { Car, FilterState } from './types';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { FilterBar } from './components/FilterBar';
import { CarCard } from './components/CarCard';
import { CarDetailsModal } from './components/CarDetailsModal';
import { CompareModal } from './components/CompareModal';
import { RAGInspectorModal } from './components/RAGInspectorModal';
import { TestDriveModal } from './components/TestDriveModal';
import { AttachedAssistant } from './components/AttachedAssistant';
import { PromptArchitectureModal } from './components/PromptArchitectureModal';
import { CARS_DATA } from './data/cars';
import { Sparkles, Layers, SlidersHorizontal, ArrowRight, Bot, X } from 'lucide-react';

export default function App() {
  const [cars, setCars] = useState<Car[]>(CARS_DATA);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    bodyType: 'All',
    fuelType: 'All',
    drivetrain: 'All',
    maxPrice: 100000,
    minSeats: 0,
    sortBy: 'recommended'
  });

  // Modals & Assistant State
  const [selectedCarForDetails, setSelectedCarForDetails] = useState<Car | null>(null);
  const [selectedCarForTestDrive, setSelectedCarForTestDrive] = useState<Car | null>(null);
  const [comparedCars, setComparedCars] = useState<Car[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isRAGInspectorOpen, setIsRAGInspectorOpen] = useState(false);
  const [isPromptInspectorOpen, setIsPromptInspectorOpen] = useState(false);
  const [lastExecutionPrompts, setLastExecutionPrompts] = useState<string[]>([]);

  // Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);
  const [assistantDockMode, setAssistantDockMode] = useState<'floating' | 'docked' | 'expanded'>('floating');
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  // Fetch cars from API with fallback to initial data
  const loadCars = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cars');
      if (res.ok) {
        const data = await res.json();
        if (data.cars && data.cars.length > 0) {
          setCars(data.cars);
        }
      }
    } catch (err) {
      console.warn('Using local vehicle dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCars();
  }, []);

  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      bodyType: 'All',
      fuelType: 'All',
      drivetrain: 'All',
      maxPrice: 100000,
      minSeats: 0,
      sortBy: 'recommended'
    });
  };

  // Compare Toggle Handler
  const handleToggleCompare = (car: Car) => {
    setComparedCars(prev => {
      const exists = prev.some(c => c.id === car.id);
      if (exists) {
        return prev.filter(c => c.id !== car.id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, car];
    });
  };

  const handleRemoveComparedCar = (carId: string) => {
    setComparedCars(prev => prev.filter(c => c.id !== carId));
  };

  // Trigger Assistant with customized queries
  const handleAskAIAboutCar = (car: Car) => {
    const prompt = `Give me a comprehensive recommendation breakdown of the ${car.year} ${car.make} ${car.model} (${car.trim}). What are its biggest advantages, fuel economy, and potential drawbacks?`;
    setPendingPrompt(prompt);
    setIsAssistantOpen(true);
  };

  const handleAskAICompare = (carsToCompare: Car[]) => {
    const names = carsToCompare.map(c => `${c.year} ${c.make} ${c.model}`).join(' vs ');
    const prompt = `Compare the following vehicles side-by-side: ${names}. Which is the best choice for everyday driving, efficiency, and reliability?`;
    setPendingPrompt(prompt);
    setIsAssistantOpen(true);
  };

  const handleHeroQuickPrompt = (promptText: string) => {
    setPendingPrompt(promptText);
    setIsAssistantOpen(true);
  };

  // Filtered and sorted cars
  const filteredCars = useMemo(() => {
    let result = [...cars];

    if (filters.bodyType !== 'All') {
      result = result.filter(c => c.bodyType.toLowerCase() === filters.bodyType.toLowerCase());
    }

    if (filters.fuelType !== 'All') {
      result = result.filter(c => c.fuelType.toLowerCase() === filters.fuelType.toLowerCase());
    }

    if (filters.drivetrain !== 'All') {
      result = result.filter(c => c.drivetrain.toLowerCase() === filters.drivetrain.toLowerCase());
    }

    if (filters.maxPrice < 100000) {
      result = result.filter(c => c.price <= filters.maxPrice);
    }

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        c =>
          c.make.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q) ||
          c.trim.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.idealFor.toLowerCase().includes(q) ||
          c.keyFeatures.some(f => f.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'efficiency':
        result.sort((a, b) => {
          const effA = a.electricRangeMiles || a.mpgHwy || 0;
          const effB = b.electricRangeMiles || b.mpgHwy || 0;
          return effB - effA;
        });
        break;
      case 'hp':
        result.sort((a, b) => b.horsepower - a.horsepower);
        break;
      default: // recommended
        result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [cars, filters]);

  // Adjust page margin when assistant is docked to side
  const shouldDockOffset = isAssistantOpen && assistantDockMode === 'docked';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        onOpenRAGInspector={() => setIsRAGInspectorOpen(true)}
        onOpenPromptInspector={() => setIsPromptInspectorOpen(true)}
        onToggleAssistant={() => setIsAssistantOpen(prev => !prev)}
        isAssistantOpen={isAssistantOpen}
        totalCarsCount={cars.length}
      />

      {/* Main Website View Container */}
      <div className={`flex-1 transition-all duration-300 ${shouldDockOffset ? 'lg:mr-[460px] xl:mr-[500px]' : ''}`}>
        {/* Hero Showcase Banner */}
        <HeroBanner onQuickPrompt={handleHeroQuickPrompt} />

        {/* Catalog Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Interactive Filter Controls */}
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            resultsCount={filteredCars.length}
          />

          {/* Vehicle Grid */}
          {filteredCars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCars.map(car => (
                <CarCard
                  key={car.id}
                  car={car}
                  onSelect={setSelectedCarForDetails}
                  onAskAI={handleAskAIAboutCar}
                  onToggleCompare={handleToggleCompare}
                  isCompared={comparedCars.some(c => c.id === car.id)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800 p-8">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">No vehicles match your filters</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Try widening your price range, clearing fuel filters, or ask our attached AI assistant to find similar models.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                >
                  Reset All Filters
                </button>
                <button
                  onClick={() => {
                    setPendingPrompt(`Find me vehicles matching "${filters.search || 'my criteria'}" even if not in standard inventory`);
                    setIsAssistantOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Ask AI Assistant</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Bottom Comparison Drawer (when 1 or more cars are selected) */}
      {comparedCars.length > 0 && (
        <div
          id="floating-compare-bar"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-3 px-4 flex items-center gap-4 text-white max-w-[90vw] sm:max-w-xl"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold whitespace-nowrap">
              {comparedCars.length} / 4 Comparing
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {comparedCars.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-lg text-xs border border-slate-700 shrink-0"
              >
                <span className="truncate max-w-[90px] font-medium">{c.model}</span>
                <button
                  onClick={() => handleRemoveComparedCar(c.id)}
                  className="text-slate-400 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <button
            id="open-compare-modal-btn"
            onClick={() => setIsCompareModalOpen(true)}
            className="ml-auto px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold whitespace-nowrap shadow-md shadow-amber-500/20"
          >
            Compare Side-by-Side
          </button>
        </div>
      )}

      {/* ATTACHED AI ASSISTANT (Chatbot attached to website) */}
      <AttachedAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onOpen={() => setIsAssistantOpen(true)}
        dockMode={assistantDockMode}
        onSetDockMode={setAssistantDockMode}
        onSelectCar={setSelectedCarForDetails}
        onScheduleTestDrive={setSelectedCarForTestDrive}
        pendingPrompt={pendingPrompt}
        onClearPendingPrompt={() => setPendingPrompt(null)}
        onOpenPromptInspector={() => setIsPromptInspectorOpen(true)}
        onExecutionPromptsUpdate={setLastExecutionPrompts}
      />

      {/* 15-Layer Prompt Architecture Inspector Modal */}
      <PromptArchitectureModal
        isOpen={isPromptInspectorOpen}
        onClose={() => setIsPromptInspectorOpen(false)}
        lastExecutionPrompts={lastExecutionPrompts}
        onTestPrompt={(p) => {
          handleHeroQuickPrompt(p);
          setIsPromptInspectorOpen(false);
        }}
      />

      {/* Vehicle Deep Dive Specs Modal */}
      <CarDetailsModal
        car={selectedCarForDetails}
        onClose={() => setSelectedCarForDetails(null)}
        onAskAI={handleAskAIAboutCar}
        onScheduleTestDrive={setSelectedCarForTestDrive}
        onToggleCompare={handleToggleCompare}
        isCompared={selectedCarForDetails ? comparedCars.some(c => c.id === selectedCarForDetails.id) : false}
      />

      {/* Multi-Car Comparison Modal */}
      <CompareModal
        cars={comparedCars}
        onClose={() => setIsCompareModalOpen(false)}
        onRemoveCar={handleRemoveComparedCar}
        onClearAll={() => setComparedCars([])}
        onAskAICompare={handleAskAICompare}
      />

      {/* RAG Knowledge Base Inspector Modal */}
      <RAGInspectorModal
        isOpen={isRAGInspectorOpen}
        onClose={() => setIsRAGInspectorOpen(false)}
        onRefreshData={loadCars}
      />

      {/* Schedule Test Drive Modal */}
      <TestDriveModal
        car={selectedCarForTestDrive}
        onClose={() => setSelectedCarForTestDrive(null)}
      />
    </div>
  );
}
