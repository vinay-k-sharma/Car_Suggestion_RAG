import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import {
  RecommendationState,
  CarPreferences,
  RecommendationApiResponse,
  PrimaryRecommendation,
  UIQuestion,
  BudgetPreference
} from '../src/types';
import { domainRegistry } from './domainRegistry';
import { filterAndRankCars, ENRICHED_CARS, CAR_QUESTIONS } from './domains/carDomain';

export interface PromptDefinition {
  id: string;
  name: string;
  layer: number;
  purpose: string;
  template: string;
}

export interface PromptsConfig {
  version: string;
  name: string;
  description: string;
  prompts: Record<string, PromptDefinition>;
}

export class PromptEngine {
  private promptsConfig: PromptsConfig;
  private promptsFilePath: string;
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    this.promptsFilePath = path.join(process.cwd(), 'prompts.json');
    this.promptsConfig = this.loadPrompts();
  }

  // Load prompts from prompts.json dynamically
  public loadPrompts(): PromptsConfig {
    try {
      if (fs.existsSync(this.promptsFilePath)) {
        const raw = fs.readFileSync(this.promptsFilePath, 'utf-8');
        this.promptsConfig = JSON.parse(raw);
        return this.promptsConfig;
      }
    } catch (err) {
      console.warn('Warning: Failed to read prompts.json from filesystem, using fallback:', err);
    }

    return {
      version: '1.0.0',
      name: 'Fallback Prompts',
      description: 'Default modular prompt templates',
      prompts: {}
    };
  }

  public getPromptsConfig(): PromptsConfig {
    return this.promptsConfig;
  }

  public updatePromptTemplate(promptId: string, newTemplate: string): boolean {
    if (this.promptsConfig.prompts[promptId]) {
      this.promptsConfig.prompts[promptId].template = newTemplate;
      try {
        fs.writeFileSync(this.promptsFilePath, JSON.stringify(this.promptsConfig, null, 2), 'utf-8');
        return true;
      } catch (err) {
        console.error('Failed to write updated prompts.json:', err);
      }
    }
    return false;
  }

  private getAI(): GoogleGenAI | null {
    if (!process.env.GEMINI_API_KEY) return null;
    if (!this.aiClient) {
      this.aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
    }
    return this.aiClient;
  }

  // 1. EXTRACT BEFORE ASKING (Rule 1)
  // Deterministic + LLM entity extraction from user message
  public extractPreferencesFromText(text: string, currentPreferences: CarPreferences): {
    extracted: Partial<CarPreferences>;
    hasExtraction: boolean;
  } {
    const lower = text.toLowerCase();
    const extracted: Partial<CarPreferences> = {};
    let hasExtraction = false;

    // A. Budget & Currency Extraction (USD or INR Lakhs)
    // Examples: "₹15–20 lakh", "15 to 20 lakhs", "₹20L", "under 40k", "$35,000", "around $40k"
    const inrLakhMatch = lower.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l|lac|lacs)/i)
      || lower.match(/(?:under|around|approx|upto|up to|below|max)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l|lac|lacs)/i);

    if (inrLakhMatch) {
      if (inrLakhMatch[2]) {
        const minLakh = parseFloat(inrLakhMatch[1]);
        const maxLakh = parseFloat(inrLakhMatch[2]);
        extracted.budget = {
          min: Math.round(minLakh * 100000),
          max: Math.round(maxLakh * 100000),
          currency: 'INR',
          display: `₹${minLakh}–${maxLakh} Lakh`,
          rawText: inrLakhMatch[0]
        };
      } else {
        const maxLakh = parseFloat(inrLakhMatch[1]);
        extracted.budget = {
          min: Math.round(maxLakh * 0.7 * 100000),
          max: Math.round(maxLakh * 100000),
          currency: 'INR',
          display: `Up to ₹${maxLakh} Lakh`,
          rawText: inrLakhMatch[0]
        };
      }
      hasExtraction = true;
    } else {
      // USD Budget matches ($35k, $30000, 35k to 45k)
      const usdRangeMatch = lower.match(/\$?\s*(\d+)(?:k|000)?\s*(?:-|to|–)\s*\$?\s*(\d+)(?:k|000)?/i);
      const usdSingleMatch = lower.match(/(?:under|around|below|upto|budget of|max)\s*\$?\s*(\d+)(?:k|000)?/i);

      if (usdRangeMatch) {
        let min = parseInt(usdRangeMatch[1]);
        let max = parseInt(usdRangeMatch[2]);
        if (min < 500) min *= 1000;
        if (max < 500) max *= 1000;
        extracted.budget = {
          min,
          max,
          currency: 'USD',
          display: `$${min.toLocaleString()} – $${max.toLocaleString()}`,
          rawText: usdRangeMatch[0]
        };
        hasExtraction = true;
      } else if (usdSingleMatch) {
        let max = parseInt(usdSingleMatch[1]);
        if (max < 500) max *= 1000;
        extracted.budget = {
          min: Math.round(max * 0.75),
          max,
          currency: 'USD',
          display: `Under $${max.toLocaleString()}`,
          rawText: usdSingleMatch[0]
        };
        hasExtraction = true;
      } else if (lower.includes('under_35k')) {
        extracted.budget = { min: 20000, max: 35000, currency: 'USD', display: 'Under $35,000' };
        hasExtraction = true;
      } else if (lower.includes('35k_50k')) {
        extracted.budget = { min: 35000, max: 50000, currency: 'USD', display: '$35,000 – $50,000' };
        hasExtraction = true;
      } else if (lower.includes('50k_75k')) {
        extracted.budget = { min: 50000, max: 75000, currency: 'USD', display: '$50,000 – $75,000' };
        hasExtraction = true;
      } else if (lower.includes('over_75k')) {
        extracted.budget = { min: 75000, max: 150000, currency: 'USD', display: 'Over $75,000' };
        hasExtraction = true;
      }
    }

    // B. Fuel Type
    if (lower.includes('electric') || lower.includes('ev') || lower.includes('zero emission') || lower.includes('battery')) {
      extracted.fuelType = 'ev';
      hasExtraction = true;
    } else if (lower.includes('plug-in') || lower.includes('phev')) {
      extracted.fuelType = 'plugin_hybrid';
      hasExtraction = true;
    } else if (lower.includes('hybrid')) {
      extracted.fuelType = 'hybrid';
      hasExtraction = true;
    } else if (lower.includes('petrol') || lower.includes('gasoline') || lower.includes('gas engine')) {
      extracted.fuelType = 'petrol';
      hasExtraction = true;
    } else if (lower.includes('diesel')) {
      extracted.fuelType = 'diesel';
      hasExtraction = true;
    }

    // C. Transmission
    if (lower.includes('automatic') || lower.includes('auto') || lower.includes('cvt') || lower.includes('paddle')) {
      extracted.transmission = 'automatic';
      hasExtraction = true;
    } else if (lower.includes('manual') || lower.includes('stick shift') || lower.includes('manual transmission')) {
      extracted.transmission = 'manual';
      hasExtraction = true;
    }

    // D. Body Type
    if (lower.includes('suv')) {
      extracted.bodyType = 'suv';
      hasExtraction = true;
    } else if (lower.includes('sedan') || lower.includes('saloon')) {
      extracted.bodyType = 'sedan';
      hasExtraction = true;
    } else if (lower.includes('crossover')) {
      extracted.bodyType = 'crossover';
      hasExtraction = true;
    } else if (lower.includes('truck') || lower.includes('pickup')) {
      extracted.bodyType = 'truck';
      hasExtraction = true;
    } else if (lower.includes('wagon')) {
      extracted.bodyType = 'wagon';
      hasExtraction = true;
    }

    // E. Color Preference
    const colors = ['blue', 'black', 'white', 'grey', 'gray', 'silver', 'red', 'green'];
    for (const c of colors) {
      if (new RegExp(`\\b${c}\\b`, 'i').test(lower)) {
        extracted.color = c.charAt(0).toUpperCase() + c.slice(1);
        hasExtraction = true;
        break;
      }
    }

    // F. Seating Requirements
    if (lower.includes('7 seat') || lower.includes('7-seat') || lower.includes('7 passengers') || lower.includes('3 row') || lower.includes('3-row') || lower.includes('family of 6') || lower.includes('family of 7')) {
      extracted.seats = 7;
      hasExtraction = true;
    } else if (lower.includes('5 seat') || lower.includes('5-seat') || lower.includes('5 passengers') || lower.includes('small family')) {
      extracted.seats = 5;
      hasExtraction = true;
    }

    // G. Usage / Lifestyle
    if (lower.includes('winter') || lower.includes('snow') || lower.includes('ice') || lower.includes('cold weather')) {
      extracted.usage = 'snow_winter';
      hasExtraction = true;
    } else if (lower.includes('family') || lower.includes('kids') || lower.includes('stroller') || lower.includes('road trip')) {
      extracted.usage = 'family';
      hasExtraction = true;
    } else if (lower.includes('commute') || lower.includes('commuter') || lower.includes('daily drive') || lower.includes('city driving')) {
      extracted.usage = 'daily_commute';
      hasExtraction = true;
    } else if (lower.includes('offroad') || lower.includes('camping') || lower.includes('trail') || lower.includes('outdoor')) {
      extracted.usage = 'offroad';
      hasExtraction = true;
    }

    // H. Year
    if (lower.includes('2026')) {
      extracted.purchaseYear = 2026;
      hasExtraction = true;
    }

    // I. Brand Preference
    const brands = ['toyota', 'tesla', 'honda', 'hyundai', 'kia', 'bmw', 'subaru', 'ford', 'rivian', 'genesis', 'volvo', 'audi', 'mercedes'];
    for (const b of brands) {
      if (new RegExp(`\\b${b}\\b`, 'i').test(lower)) {
        extracted.brand = b.charAt(0).toUpperCase() + b.slice(1);
        hasExtraction = true;
        break;
      }
    }

    return { extracted, hasExtraction };
  }

  // 2. ORCHESTRATE CONVERSATIONAL TURN
  public async processTurn(
    userMessage: string,
    currentState: RecommendationState
  ): Promise<RecommendationApiResponse> {
    const triggeredPrompts: string[] = ['system_orchestrator'];
    const domain = domainRegistry.getDomain(currentState.domain || 'cars');

    // Rule 1: Extract Before Asking
    triggeredPrompts.push('preference_extraction');
    const { extracted, hasExtraction } = this.extractPreferencesFromText(userMessage, currentState.preferences);

    // Rule 7 & Context Prompt: Merge newly extracted into existing state (Latest explicit overrides older)
    triggeredPrompts.push('conversation_context');
    const mergedPreferences: CarPreferences = {
      ...currentState.preferences,
      ...extracted
    };

    // Calculate confidence score based on how many core attributes are resolved
    let confidencePoints = 0;
    if (mergedPreferences.budget) confidencePoints += 0.35;
    if (mergedPreferences.fuelType) confidencePoints += 0.25;
    if (mergedPreferences.bodyType) confidencePoints += 0.20;
    if (mergedPreferences.transmission) confidencePoints += 0.10;
    if (mergedPreferences.usage) confidencePoints += 0.10;
    const confidence = Math.min(1.0, confidencePoints);

    // Rule 3: Keep Conversation Small & Question Completion Prompt
    triggeredPrompts.push('question_completion');
    const totalQuestionsAsked = currentState.askedQuestions.length;

    // Check if user is asking to recommend directly or if we have enough info
    const lowerMsg = userMessage.toLowerCase();
    const explicitRecommend =
      lowerMsg.includes('recommend') ||
      lowerMsg.includes('show me') ||
      lowerMsg.includes('what car') ||
      lowerMsg.includes('best car') ||
      lowerMsg.includes('ready') ||
      lowerMsg.includes('suggest');

    // Completion condition:
    // 1) User provided at least 2 strong key criteria (e.g. budget + fuelType, or budget + bodyType, or fuelType + transmission + color)
    // 2) OR confidence >= 0.55
    // 3) OR user has answered 2 or more questions
    // 4) OR user explicitly requested a recommendation
    const hasEnoughToRecommend =
      explicitRecommend ||
      confidence >= 0.55 ||
      (mergedPreferences.budget && (mergedPreferences.fuelType || mergedPreferences.bodyType)) ||
      (mergedPreferences.fuelType && mergedPreferences.transmission) ||
      totalQuestionsAsked >= 2;

    if (hasEnoughToRecommend) {
      return await this.generateRecommendationResponse(mergedPreferences, currentState, triggeredPrompts, extracted);
    }

    // Otherwise, generate the Next Best Question
    return await this.generateNextQuestionResponse(mergedPreferences, currentState, triggeredPrompts, extracted);
  }

  // Generate Warm Recommendation Action
  private async generateRecommendationResponse(
    preferences: CarPreferences,
    currentState: RecommendationState,
    triggeredPrompts: string[],
    extractedInTurn: Partial<CarPreferences>
  ): Promise<RecommendationApiResponse> {
    triggeredPrompts.push('match_score_input', 'final_card_structurer', 'recommendation_explanation');

    // Rule 8: Deterministic filter & rank using application logic
    const { primary, alternatives } = filterAndRankCars(preferences, ENRICHED_CARS);

    // Warm, humanized message
    let message = `Based on what you've shared, this looks like your strongest match! 🚗`;
    if (preferences.fuelType === 'ev') {
      message = `Found it! ⚡ An all-electric standout that fits your budget and driving needs:`;
    } else if (preferences.budget?.currency === 'INR') {
      message = `Here is our top 2026 recommendation within your ₹${preferences.budget.display || 'budget'}:`;
    } else if (preferences.color) {
      message = `Great choice! Here is a premier option available in ${preferences.color} that matches your checklist:`;
    }

    // Use Gemini for warm personalized explanation if available
    const ai = this.getAI();
    if (ai) {
      try {
        const warmPrompt = `User preferences: ${JSON.stringify(preferences)}. Top car: ${primary.name}, Price: ${primary.price.display}, Match score: ${primary.matchScore}/100.
Write 1 brief, warm, friendly conversational sentence (maximum 22 words) presenting this car as the ideal recommendation. Be human, warm, and concise.`;

        const resp = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: warmPrompt,
          config: { temperature: 0.5 }
        });
        if (resp.text && resp.text.trim().length > 5) {
          message = resp.text.trim().replace(/^["']|["']$/g, '');
        }
      } catch (err) {
        console.warn('Gemini recommendation text fallback to deterministic message');
      }
    }

    return {
      action: 'recommendation',
      message,
      updates: {
        preferences,
        askedQuestions: currentState.askedQuestions,
        confidence: 0.95,
        readyForRecommendation: true
      },
      recommendation: primary,
      debugPromptFlow: {
        promptsTriggered: triggeredPrompts,
        extractedInTurn,
        ruleTriggered: 'Question Completion Reached -> Deterministic 0-100 Match Meter & Primary Card'
      }
    };
  }

  // Generate Next Best Question Action
  private async generateNextQuestionResponse(
    preferences: CarPreferences,
    currentState: RecommendationState,
    triggeredPrompts: string[],
    extractedInTurn: Partial<CarPreferences>
  ): Promise<RecommendationApiResponse> {
    triggeredPrompts.push('missing_information', 'non_recurring_guard', 'next_best_question', 'ui_selection', 'warm_humanized_response');

    // Rule 2: Never Ask the Same Question Twice (Guard)
    const askedSet = new Set(currentState.askedQuestions);

    // Identify which question to ask next dynamically
    let nextKey = '';
    let warmPrefix = 'Got it! ';

    if (Object.keys(extractedInTurn).length > 0) {
      const keys = Object.keys(extractedInTurn);
      if (keys.includes('fuelType')) {
        warmPrefix = `Awesome! ⚡ EV & hybrid choices are fantastic. `;
      } else if (keys.includes('budget')) {
        warmPrefix = `Noted on the budget! `;
      } else if (keys.includes('transmission')) {
        warmPrefix = `Got it on the ${extractedInTurn.transmission} transmission! `;
      } else {
        warmPrefix = `Sounds great! `;
      }
    }

    // Dynamic question selection (Rule 4)
    if (!preferences.budget && !askedSet.has('budget')) {
      nextKey = 'budget';
    } else if (!preferences.fuelType && !askedSet.has('fuelType')) {
      nextKey = 'fuelType';
    } else if (!preferences.transmission && !askedSet.has('transmission')) {
      nextKey = 'transmission';
    } else if (!preferences.bodyType && !askedSet.has('bodyType')) {
      nextKey = 'bodyType';
    } else if (!preferences.usage && !askedSet.has('usage')) {
      nextKey = 'usage';
    } else {
      // If all critical questions asked, immediately recommend
      return await this.generateRecommendationResponse(preferences, currentState, triggeredPrompts, extractedInTurn);
    }

    const questionDef = CAR_QUESTIONS[nextKey] || CAR_QUESTIONS.budget;
    const humanQuestionMsg = `${warmPrefix}${questionDef.title}`;

    return {
      action: 'question',
      message: humanQuestionMsg,
      updates: {
        preferences,
        askedQuestions: [...currentState.askedQuestions, nextKey],
        confidence: Math.min(0.85, (currentState.askedQuestions.length + 1) * 0.25),
        readyForRecommendation: false
      },
      question: questionDef,
      debugPromptFlow: {
        promptsTriggered: triggeredPrompts,
        extractedInTurn,
        ruleTriggered: `Next Best Question: ${nextKey} (Protected by Non-Recurring Guard)`
      }
    };
  }
}

export const promptEngine = new PromptEngine();
