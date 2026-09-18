import { Car, CarPreferences, UIQuestion, PrimaryRecommendation, BudgetPreference } from '../../src/types';
import { CARS_DATA } from '../../src/data/cars';

// Ensure all cars have transmission & color palettes assigned
export const ENRICHED_CARS: Car[] = CARS_DATA.map((car, index) => {
  const isEV = car.fuelType === 'Electric';
  const isHybrid = car.fuelType === 'Hybrid' || car.fuelType === 'Plug-in Hybrid';
  
  // Set transmission: EVs and Hybrids are Automatic; select sports/gas have Manual options
  const transmission: 'Automatic' | 'Manual' = (car.model.includes('Type R') || car.model.includes('GR') || index === 7) 
    ? 'Manual' 
    : 'Automatic';

  // Standard color options for modern 2026 automotive showrooms
  const baseColors = ['White', 'Black', 'Grey', 'Silver'];
  if (isEV) {
    baseColors.push('Blue', 'Midnight Blue', 'Red');
  } else if (car.bodyType === 'SUV') {
    baseColors.push('Blue', 'Army Green', 'Red');
  } else {
    baseColors.push('Blue', 'Red');
  }

  return {
    ...car,
    transmission,
    colors: baseColors
  };
});

// Configurable weights for transparent 0-100 match meter
export const CAR_PREFERENCE_WEIGHTS: Record<string, number> = {
  budget: 30,
  fuelType: 20,
  transmission: 15,
  bodyType: 15,
  usage: 10,
  features: 10
};

// UI Question Definitions with custom icons and chips
export const CAR_QUESTIONS: Record<string, UIQuestion> = {
  budget: {
    key: 'budget',
    type: 'budget_range',
    title: "What is your target budget range?",
    options: [
      { label: "Under $35,000 (~₹20 Lakh)", value: "under_35k", icon: "wallet", description: "Value & commuter friendly" },
      { label: "$35,000 – $50,000 (~₹20–35 Lakh)", value: "35k_50k", icon: "badge-percent", description: "Mid-tier hybrids & EVs" },
      { label: "$50,000 – $75,000 (~₹35–55 Lakh)", value: "50k_75k", icon: "gem", description: "Premium crossovers & luxury" },
      { label: "Over $75,000 (~₹55 Lakh+)", value: "over_75k", icon: "crown", description: "Flagship luxury & adventure" },
      { label: "Flexible budget", value: "flexible", icon: "sparkles", description: "Focus on best features" }
    ]
  },
  fuelType: {
    key: 'fuelType',
    type: 'single_select',
    title: "Which fuel type do you prefer?",
    options: [
      { label: "EV (Electric)", value: "ev", icon: "zap", description: "Zero emissions & home charging" },
      { label: "Hybrid", value: "hybrid", icon: "leaf", description: "40+ MPG without plugging in" },
      { label: "Plug-in Hybrid (PHEV)", value: "plugin_hybrid", icon: "battery-charging", description: "EV commute + gas road trips" },
      { label: "Petrol / Gasoline", value: "petrol", icon: "fuel", description: "Traditional power & quick refuel" },
      { label: "No preference", value: "any", icon: "sparkles", description: "Show me whatever fits best" }
    ]
  },
  transmission: {
    key: 'transmission',
    type: 'single_select',
    title: "Do you prefer automatic or manual?",
    options: [
      { label: "Automatic", value: "automatic", icon: "gauge", description: "Effortless stop-and-go driving" },
      { label: "Manual", value: "manual", icon: "sliders", description: "Hands-on driver engagement" },
      { label: "No preference", value: "any", icon: "sparkles", description: "Either is fine with me" }
    ]
  },
  bodyType: {
    key: 'bodyType',
    type: 'single_select',
    title: "What body style fits your lifestyle?",
    options: [
      { label: "SUV", value: "suv", icon: "car", description: "High seating & spacious cargo" },
      { label: "Crossover", value: "crossover", icon: "compass", description: "Agile, car-like handling" },
      { label: "Sedan", value: "sedan", icon: "shield", description: "Sleek, aerodynamic & efficient" },
      { label: "Truck", value: "truck", icon: "truck", description: "Towing & cargo bed utility" },
      { label: "No preference", value: "any", icon: "sparkles", description: "Open to recommendations" }
    ]
  },
  seats: {
    key: 'seats',
    type: 'single_select',
    title: "How many passenger seats do you need?",
    options: [
      { label: "5 Seats (Standard)", value: "5", icon: "users", description: "Couples & small families" },
      { label: "7+ Seats (3-Row)", value: "7", icon: "users", description: "Large families & carpooling" },
      { label: "Just 4-5 is fine", value: "any", icon: "check", description: "No large seating requirement" }
    ]
  },
  usage: {
    key: 'usage',
    type: 'single_select',
    title: "What is the primary way you'll use the car?",
    options: [
      { label: "Daily City Commuting", value: "daily_commute", icon: "building", description: "Low cost per mile & nimble parking" },
      { label: "Family & Road Trips", value: "family", icon: "smile", description: "Car seats, comfort & big luggage room" },
      { label: "Winter / Snow Driving", value: "snow_winter", icon: "snowflake", description: "All-wheel drive & safety ratings" },
      { label: "Outdoor Camping / Offroad", value: "offroad", icon: "mountain", description: "Ground clearance & rugged durability" }
    ]
  },
  color: {
    key: 'color',
    type: 'single_select',
    title: "Any preferred exterior color?",
    options: [
      { label: "Blue", value: "blue", icon: "palette" },
      { label: "White", value: "white", icon: "palette" },
      { label: "Black", value: "black", icon: "palette" },
      { label: "Grey / Silver", value: "grey", icon: "palette" },
      { label: "No preference", value: "any", icon: "sparkles" }
    ]
  }
};

// Deterministic Match Calculation (Rule 8 & Match Meter)
// Scores ONLY criteria for which the user actually has expressed preferences!
export function calculateCarMatchScore(
  car: Car,
  preferences: CarPreferences
): {
  totalScore: number;
  breakdown: { criterion: string; weight: number; score: number; description: string }[];
  matchedPreferences: string[];
} {
  const breakdown: { criterion: string; weight: number; score: number; description: string }[] = [];
  const matchedPreferences: string[] = [];

  let earnedWeightedPoints = 0;
  let totalPossibleWeight = 0;

  // 1. Budget Match (Weight 30)
  if (preferences.budget) {
    const w = CAR_PREFERENCE_WEIGHTS.budget || 30;
    totalPossibleWeight += w;
    let score = 1.0;
    let desc = '';

    // Convert INR to USD estimate for unified catalog matching: 1 USD ~ 83 INR
    let maxUSD = preferences.budget.max;
    let minUSD = preferences.budget.min;
    if (preferences.budget.currency === 'INR') {
      if (maxUSD) maxUSD = Math.round(maxUSD / 83);
      if (minUSD) minUSD = Math.round(minUSD / 83);
    }

    if (maxUSD && car.price <= maxUSD) {
      score = 1.0;
      desc = `Within budget ($${car.price.toLocaleString()})`;
      matchedPreferences.push(
        preferences.budget.currency === 'INR'
          ? `Within your ₹${(car.price * 83 / 100000).toFixed(1)} Lakh budget`
          : `Within your $${maxUSD.toLocaleString()} budget`
      );
    } else if (maxUSD && car.price <= maxUSD * 1.12) {
      // Slight stretch within 12%
      score = 0.75;
      desc = `Close to budget ceiling ($${car.price.toLocaleString()})`;
      matchedPreferences.push(`Near your target price point`);
    } else if (maxUSD) {
      score = Math.max(0.2, 1 - (car.price - maxUSD) / maxUSD);
      desc = `Above requested budget limit`;
    } else {
      score = 1.0;
      desc = `Fits budget`;
    }

    earnedWeightedPoints += score * w;
    breakdown.push({
      criterion: 'Budget',
      weight: w,
      score: Math.round(score * 100),
      description: desc
    });
  }

  // 2. Fuel Type Match (Weight 20)
  if (preferences.fuelType && preferences.fuelType !== 'any') {
    const w = CAR_PREFERENCE_WEIGHTS.fuelType || 20;
    totalPossibleWeight += w;
    let score = 0;
    let desc = '';

    const prefFuel = preferences.fuelType.toLowerCase();
    const carFuel = car.fuelType.toLowerCase();

    if (prefFuel === 'ev' && carFuel === 'electric') {
      score = 1.0;
      desc = 'Pure Electric (EV) powertrain';
      matchedPreferences.push('100% Electric (Zero Tailpipe Emissions)');
    } else if (prefFuel === 'hybrid' && carFuel.includes('hybrid')) {
      score = 1.0;
      desc = 'High-efficiency Hybrid powertrain';
      matchedPreferences.push('High-efficiency Hybrid (40+ MPG)');
    } else if (prefFuel === 'plugin_hybrid' && carFuel === 'plug-in hybrid') {
      score = 1.0;
      desc = 'Plug-in Hybrid (PHEV)';
      matchedPreferences.push('Plug-in Hybrid with electric commute');
    } else if (prefFuel === 'petrol' && carFuel === 'gasoline') {
      score = 1.0;
      desc = 'Gasoline / Petrol engine';
      matchedPreferences.push('Refined Gasoline Engine');
    } else {
      score = 0.2;
      desc = `Different fuel type (${car.fuelType})`;
    }

    earnedWeightedPoints += score * w;
    breakdown.push({
      criterion: 'Fuel Type',
      weight: w,
      score: Math.round(score * 100),
      description: desc
    });
  }

  // 3. Transmission Match (Weight 15)
  if (preferences.transmission && preferences.transmission !== 'any') {
    const w = CAR_PREFERENCE_WEIGHTS.transmission || 15;
    totalPossibleWeight += w;
    let score = 0;
    let desc = '';

    const prefTrans = preferences.transmission.toLowerCase();
    const carTrans = (car.transmission || 'Automatic').toLowerCase();

    if (prefTrans === carTrans) {
      score = 1.0;
      desc = `Equipped with ${car.transmission} transmission`;
      matchedPreferences.push(`${car.transmission} Transmission`);
    } else {
      score = 0.25;
      desc = `Has ${car.transmission} transmission`;
    }

    earnedWeightedPoints += score * w;
    breakdown.push({
      criterion: 'Transmission',
      weight: w,
      score: Math.round(score * 100),
      description: desc
    });
  }

  // 4. Body Type Match (Weight 15)
  if (preferences.bodyType && preferences.bodyType !== 'any') {
    const w = CAR_PREFERENCE_WEIGHTS.bodyType || 15;
    totalPossibleWeight += w;
    let score = 0;
    let desc = '';

    const prefBody = preferences.bodyType.toLowerCase();
    const carBody = car.bodyType.toLowerCase();

    if (prefBody === carBody) {
      score = 1.0;
      desc = `Exact ${car.bodyType} styling`;
      matchedPreferences.push(`${car.bodyType} body style`);
    } else if ((prefBody === 'suv' && carBody === 'crossover') || (prefBody === 'crossover' && carBody === 'suv')) {
      score = 0.85;
      desc = `Compatible crossover/SUV format`;
      matchedPreferences.push(`Elevated driving position`);
    } else {
      score = 0.3;
      desc = `${car.bodyType} format`;
    }

    earnedWeightedPoints += score * w;
    breakdown.push({
      criterion: 'Body Style',
      weight: w,
      score: Math.round(score * 100),
      description: desc
    });
  }

  // 5. Usage Match (Weight 10)
  if (preferences.usage) {
    const w = CAR_PREFERENCE_WEIGHTS.usage || 10;
    totalPossibleWeight += w;
    let score = 0.5;
    let desc = 'Balanced general usage';

    if (preferences.usage === 'snow_winter') {
      if (car.drivetrain === 'AWD') {
        score = 1.0;
        desc = 'Standard All-Wheel Drive for snow & ice';
        matchedPreferences.push('Confidence-inspiring AWD for winter');
      } else {
        score = 0.4;
        desc = 'Front-wheel drive';
      }
    } else if (preferences.usage === 'family') {
      if (car.seatingCapacity >= 5 && car.cargoVolumeCuFt >= 60) {
        score = 1.0;
        desc = `Spacious ${car.seatingCapacity}-passenger cabin & ${car.cargoVolumeCuFt} cu ft cargo`;
        matchedPreferences.push('Family-ready cabin with expansive cargo room');
      } else {
        score = 0.6;
        desc = 'Compact family layout';
      }
    } else if (preferences.usage === 'daily_commute' || preferences.usage === 'budget_commuter') {
      if (car.fuelType === 'Electric' || (car.mpgCity && car.mpgCity >= 38)) {
        score = 1.0;
        desc = 'Ultra-low cost per mile commuter';
        matchedPreferences.push('Exceptional fuel / energy economy');
      } else {
        score = 0.7;
        desc = 'Solid commuter';
      }
    } else if (preferences.usage === 'offroad') {
      if (car.drivetrain === 'AWD' && (car.model.includes('Outback') || car.model.includes('R1S') || car.model.includes('Lightning'))) {
        score = 1.0;
        desc = 'High ground clearance and trail capability';
        matchedPreferences.push('Rugged trail and outdoor prowess');
      } else {
        score = 0.5;
        desc = 'Light unpaved capability';
      }
    }

    earnedWeightedPoints += score * w;
    breakdown.push({
      criterion: 'Lifestyle / Usage',
      weight: w,
      score: Math.round(score * 100),
      description: desc
    });
  }

  // 6. Color Match
  if (preferences.color && preferences.color !== 'any') {
    const prefColor = preferences.color.toLowerCase();
    const hasColor = car.colors?.some(c => c.toLowerCase().includes(prefColor));
    if (hasColor) {
      matchedPreferences.push(`Available in your preferred ${preferences.color} exterior`);
    }
  }

  // 7. Seating Match
  if (preferences.seats && preferences.seats > 0) {
    if (car.seatingCapacity >= preferences.seats) {
      matchedPreferences.push(`Seats ${car.seatingCapacity} passengers comfortably`);
    }
  }

  // Calculate final score strictly normalized to the weights of criteria provided
  const finalScore = totalPossibleWeight > 0
    ? Math.round((earnedWeightedPoints / totalPossibleWeight) * 100)
    : 90; // Default high baseline if broad request

  return {
    totalScore: Math.min(99, Math.max(15, finalScore)),
    breakdown,
    matchedPreferences
  };
}

// Deterministic Candidate Filter & Rank
export function filterAndRankCars(
  preferences: CarPreferences,
  carsList: Car[] = ENRICHED_CARS
): {
  primary: PrimaryRecommendation;
  alternatives: PrimaryRecommendation[];
} {
  const scored = carsList.map(car => {
    const { totalScore, breakdown, matchedPreferences } = calculateCarMatchScore(car, preferences);

    // Format currency display (supporting USD and INR Lakhs)
    const isINR = preferences.budget?.currency === 'INR';
    const inrLakh = ((car.price * 83) / 100000).toFixed(2);

    const priceDisplay = isINR
      ? `₹${inrLakh} Lakh (~$${car.price.toLocaleString()})`
      : `$${car.price.toLocaleString()}`;

    // Craft concise reason
    let reason = car.idealFor;
    if (matchedPreferences.length > 0) {
      reason = `${car.make} ${car.model} is your strongest match: it delivers ${matchedPreferences.slice(0, 3).join(', ')}.`;
    }

    const rec: PrimaryRecommendation = {
      id: car.id,
      name: `${car.year} ${car.make} ${car.model} ${car.trim}`,
      make: car.make,
      model: car.model,
      year: car.year,
      matchScore: totalScore,
      price: {
        amount: car.price,
        currency: isINR ? 'INR' : 'USD',
        display: priceDisplay,
        type: 'ex_showroom',
        leasePerMonth: car.leasePerMonth
      },
      specifications: {
        'Fuel Type': car.fuelType,
        'Transmission': car.transmission || 'Automatic',
        'Horsepower': `${car.horsepower} HP`,
        'Drivetrain': car.drivetrain,
        'Seating': `${car.seatingCapacity} Passengers`,
        'Efficiency': car.fuelType === 'Electric' ? `${car.electricRangeMiles} mi Range` : `${car.mpgCity || 35} City / ${car.mpgHwy || 40} Hwy MPG`,
        'Safety': car.safetyRating
      },
      matchedPreferences,
      reason,
      imageUrl: car.imageUrl,
      carData: car,
      scoreBreakdown: breakdown
    };

    return { car, rec, totalScore };
  });

  // Sort descending by match score, tie-break by popularity / rating
  scored.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return b.car.rating - a.car.rating;
  });

  const primary = scored[0].rec;
  const alternatives = scored.slice(1, 3).map(s => s.rec);

  return { primary, alternatives };
}
