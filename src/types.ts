export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  bodyType: 'SUV' | 'Sedan' | 'Truck' | 'Crossover' | 'Wagon' | 'Coupe';
  fuelType: 'Gasoline' | 'Hybrid' | 'Plug-in Hybrid' | 'Electric';
  transmission?: 'Automatic' | 'Manual';
  colors?: string[];
  price: number;
  leasePerMonth: number;
  mpgCity?: number;
  mpgHwy?: number;
  electricRangeMiles?: number;
  horsepower: number;
  drivetrain: 'FWD' | 'RWD' | 'AWD';
  seatingCapacity: number;
  cargoVolumeCuFt: number;
  safetyRating: string; // e.g. '5-Star NHTSA / IIHS Top Safety Pick+'
  acceleration0to60: string;
  keyFeatures: string[];
  description: string;
  pros: string[];
  cons: string[];
  idealFor: string;
  imageUrl: string;
  inStockCount: number;
  rating: number;
}

export interface BudgetPreference {
  min?: number;
  max?: number;
  currency: 'USD' | 'INR';
  rawText?: string;
  display?: string;
}

export interface CarPreferences {
  purchaseYear?: number;
  budget?: BudgetPreference | null;
  fuelType?: 'ev' | 'petrol' | 'diesel' | 'hybrid' | 'plugin_hybrid' | 'any' | null;
  transmission?: 'automatic' | 'manual' | 'any' | null;
  bodyType?: 'suv' | 'sedan' | 'crossover' | 'truck' | 'wagon' | 'any' | null;
  usage?: 'daily_commute' | 'family' | 'highway_roadtrips' | 'snow_winter' | 'offroad' | 'budget_commuter' | null;
  seats?: number | null;
  brand?: string | null;
  color?: string | null;
  features?: string[];
  [key: string]: any;
}

export interface RecommendationState {
  domain: string;
  intent: 'car_recommendation' | 'product_recommendation' | 'comparison' | 'general_query';
  preferences: CarPreferences;
  askedQuestions: string[];
  confidence: number; // 0 to 1
  readyForRecommendation: boolean;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface UIOption {
  label: string;
  value: string;
  icon?: string;
  description?: string;
  badge?: string;
}

export interface UIQuestion {
  key: string;
  type: 'single_select' | 'multi_select' | 'budget_range' | 'text';
  title?: string;
  options: UIOption[];
}

export interface RecommendationPrice {
  amount: number;
  currency: string;
  display: string;
  type?: string; // e.g. 'MSRP' | 'ex_showroom'
  leasePerMonth?: number;
}

export interface PrimaryRecommendation {
  id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  matchScore: number; // 0 to 100
  price: RecommendationPrice;
  specifications: Record<string, string>;
  matchedPreferences: string[];
  reason: string;
  imageUrl: string;
  carData?: Car;
  scoreBreakdown?: {
    criterion: string;
    weight: number;
    score: number;
    description: string;
  }[];
}

export type RecommendationAction = 'question' | 'recommendation' | 'clarification' | 'fallback';

export interface RecommendationApiResponse {
  action: RecommendationAction;
  message: string;
  updates: {
    preferences: CarPreferences;
    askedQuestions: string[];
    confidence: number;
    readyForRecommendation: boolean;
  };
  question?: UIQuestion;
  recommendation?: PrimaryRecommendation;
  debugPromptFlow?: {
    promptsTriggered: string[];
    extractedInTurn: Partial<CarPreferences>;
    ruleTriggered?: string;
  };
}

export interface RAGChunk {
  id: string;
  carId: string;
  carName: string;
  category: 'overview' | 'specs' | 'efficiency' | 'safety_tech' | 'practicality' | 'verdict';
  title: string;
  content: string;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  retrievedCars?: Car[];
  citations?: {
    carId: string;
    carName: string;
    category: string;
    snippet: string;
    score: number;
  }[];
  suggestedPrompts?: string[];
  isStreaming?: boolean;
  recommendationApiResponse?: RecommendationApiResponse;
}

export interface FilterState {
  search: string;
  bodyType: string;
  fuelType: string;
  drivetrain: string;
  maxPrice: number;
  minSeats: number;
  sortBy: 'recommended' | 'price-asc' | 'price-desc' | 'efficiency' | 'hp';
}
