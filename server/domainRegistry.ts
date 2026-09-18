import { UIQuestion, PrimaryRecommendation, CarPreferences } from '../src/types';
import { CAR_QUESTIONS, CAR_PREFERENCE_WEIGHTS, filterAndRankCars, ENRICHED_CARS } from './domains/carDomain';
import { LAPTOP_QUESTIONS, LAPTOPS_DATA } from './domains/laptopDomain';

export interface DomainMetadata {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  requiredPreferences: string[];
  optionalPreferences: string[];
  weights: Record<string, number>;
  questions: Record<string, UIQuestion>;
}

export class DomainRegistry {
  private domains = new Map<string, DomainMetadata>();

  constructor() {
    this.registerDomain({
      id: 'cars',
      name: '2026 Vehicles & Showroom',
      category: 'Automotive',
      tagline: 'Grounded 2026 Vehicle Recommendations',
      description: 'Find your ideal 2026 EV, hybrid, SUV, or sedan through progressive preference extraction.',
      requiredPreferences: ['budget', 'fuelType'],
      optionalPreferences: ['transmission', 'bodyType', 'usage', 'seats', 'brand', 'color', 'features'],
      weights: CAR_PREFERENCE_WEIGHTS,
      questions: CAR_QUESTIONS
    });

    this.registerDomain({
      id: 'laptops',
      name: 'Laptops & Workstations',
      category: 'Electronics',
      tagline: 'High-Performance Laptops for Devs & Creators',
      description: 'Extensible domain for laptops, ultrabooks, and workstations.',
      requiredPreferences: ['budget', 'usage'],
      optionalPreferences: ['operatingSystem', 'screenSize', 'brand'],
      weights: { budget: 35, usage: 35, operatingSystem: 20, brand: 10 },
      questions: LAPTOP_QUESTIONS
    });
  }

  public registerDomain(domain: DomainMetadata) {
    this.domains.set(domain.id, domain);
  }

  public getDomain(domainId: string): DomainMetadata {
    return this.domains.get(domainId) || this.domains.get('cars')!;
  }

  public getAllDomains(): DomainMetadata[] {
    return Array.from(this.domains.values());
  }

  public getQuestionsForDomain(domainId: string): Record<string, UIQuestion> {
    const domain = this.getDomain(domainId);
    return domain.questions;
  }
}

export const domainRegistry = new DomainRegistry();
