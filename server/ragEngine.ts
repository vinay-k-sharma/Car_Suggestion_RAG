import { Car, RAGChunk } from '../src/types';
import { CARS_DATA, INITIAL_RAG_CHUNKS } from '../src/data/cars';
import { GoogleGenAI } from '@google/genai';

interface EmbeddedChunk extends RAGChunk {
  embedding?: number[];
}

export class RAGEngine {
  private chunks: EmbeddedChunk[] = [];
  private carsMap: Map<string, Car> = new Map();
  private embeddingCache: Map<string, number[]> = new Map();
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    this.chunks = [...INITIAL_RAG_CHUNKS];
    CARS_DATA.forEach(c => this.carsMap.set(c.id, c));
  }

  public getCars(): Car[] {
    return Array.from(this.carsMap.values());
  }

  public getCarById(id: string): Car | undefined {
    return this.carsMap.get(id);
  }

  public getAllChunks(): RAGChunk[] {
    return this.chunks.map(({ embedding, ...rest }) => rest);
  }

  public addCustomDocument(doc: {
    carId?: string;
    carName: string;
    title: string;
    category: RAGChunk['category'];
    content: string;
    tags?: string[];
  }): RAGChunk {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newChunk: EmbeddedChunk = {
      id,
      carId: doc.carId || 'custom-car',
      carName: doc.carName,
      title: doc.title,
      category: doc.category || 'overview',
      content: doc.content,
      tags: doc.tags || ['custom', doc.carName.toLowerCase()]
    };
    this.chunks.unshift(newChunk);
    return newChunk;
  }

  // Ingest vehicles from a CSV dataset string
  public ingestCSV(csvText: string): { importedCount: number; newChunksCount: number; errors: string[] } {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { importedCount: 0, newChunksCount: 0, errors: ['CSV file must have at least a header and 1 data row'] };
    }

    // Basic CSV line parser handling quotes
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    const headerMap: Record<string, number> = {};
    headers.forEach((h, idx) => {
      headerMap[h] = idx;
    });

    let importedCount = 0;
    let newChunksCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const row = parseCSVLine(lines[i]);
        if (row.length < 3) continue;

        const getVal = (col: string, fallback: string = ''): string => {
          const idx = headerMap[col.toLowerCase()];
          return idx !== undefined && row[idx] !== undefined ? row[idx] : fallback;
        };

        const make = getVal('make', 'Custom');
        const model = getVal('model', `Car-${i}`);
        const year = parseInt(getVal('year', '2026')) || 2026;
        const trim = getVal('trim', 'Standard');
        const carId = getVal('id', `${make.toLowerCase()}-${model.toLowerCase().replace(/\s+/g, '-')}-${year}`);
        const bodyType = (getVal('bodytype', 'SUV') as any) || 'SUV';
        const fuelType = (getVal('fueltype', 'Gasoline') as any) || 'Gasoline';
        const price = parseInt(getVal('price', '35000')) || 35000;
        const leasePerMonth = parseInt(getVal('leasepermonth', '399')) || Math.round(price * 0.011);
        const horsepower = parseInt(getVal('horsepower', '220')) || 220;
        const drivetrain = (getVal('drivetrain', 'AWD') as any) || 'AWD';
        const seatingCapacity = parseInt(getVal('seatingcapacity', '5')) || 5;
        const cargoVolumeCuFt = parseFloat(getVal('cargovolumecuft', '50')) || 50;
        const safetyRating = getVal('safetyrating', '5-Star NHTSA / IIHS Top Safety Pick');
        const acceleration0to60 = getVal('acceleration0to60', '6.9 sec');
        const idealFor = getVal('idealfor', 'Commuters and families seeking modern comfort and reliability');
        const description = getVal('description', `${year} ${make} ${model} offering balanced performance, modern technology, and comfort.`);
        const imageUrl = getVal('imageurl', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80');

        const carObj: Car = {
          id: carId,
          make,
          model,
          year,
          trim,
          bodyType,
          fuelType,
          price,
          leasePerMonth,
          mpgCity: fuelType === 'Electric' ? undefined : parseInt(getVal('mpgcity', '30')),
          mpgHwy: fuelType === 'Electric' ? undefined : parseInt(getVal('mpghwy', '38')),
          electricRangeMiles: fuelType === 'Electric' ? (parseInt(getVal('electricrangemiles', '300')) || 300) : undefined,
          horsepower,
          drivetrain,
          seatingCapacity,
          cargoVolumeCuFt,
          safetyRating,
          acceleration0to60,
          keyFeatures: [
            `${horsepower} HP ${fuelType} powertrain with ${drivetrain}`,
            `${seatingCapacity}-passenger seating with ${cargoVolumeCuFt} cu ft cargo`,
            `${safetyRating}`
          ],
          description,
          pros: ['Strong value and modern technology', 'Grounded reliability rating', 'Fuel efficient performance'],
          cons: ['Dealer availability may vary by region'],
          idealFor,
          imageUrl,
          inStockCount: 3,
          rating: 4.8
        };

        this.carsMap.set(carId, carObj);
        importedCount++;

        // Generate RAG knowledge chunks for this vehicle
        const carName = `${year} ${make} ${model} ${trim}`;

        // Overview chunk
        const overviewChunk: EmbeddedChunk = {
          id: `${carId}-csv-overview`,
          carId,
          carName,
          category: 'overview',
          title: `${carName} Overview & Pricing`,
          content: `${carName} is a ${bodyType} with an MSRP of $${price.toLocaleString()} (~$${leasePerMonth}/month lease). Powertrain: ${fuelType} with ${drivetrain} and ${horsepower} HP. Overview: ${description} Ideal for: ${idealFor}.`,
          tags: [make.toLowerCase(), model.toLowerCase(), bodyType.toLowerCase(), fuelType.toLowerCase(), drivetrain.toLowerCase()]
        };

        // Efficiency chunk
        const efficiencyChunk: EmbeddedChunk = {
          id: `${carId}-csv-efficiency`,
          carId,
          carName,
          category: 'efficiency',
          title: `${carName} Efficiency & Performance`,
          content: fuelType === 'Electric'
            ? `${carName} is 100% electric with an estimated range of ${carObj.electricRangeMiles || 300} miles. Delivers ${horsepower} HP and 0-60 in ${acceleration0to60}. Zero tailpipe emissions.`
            : `${carName} achieves ${carObj.mpgCity || 30} MPG City / ${carObj.mpgHwy || 38} MPG Highway. Features a ${horsepower} HP engine and accelerates 0-60 in ${acceleration0to60}.`,
          tags: ['efficiency', fuelType.toLowerCase(), 'mpg', 'performance']
        };

        // Practicality & Safety chunk
        const practicalityChunk: EmbeddedChunk = {
          id: `${carId}-csv-practicality`,
          carId,
          carName,
          category: 'practicality',
          title: `${carName} Space & Safety Standards`,
          content: `${carName} accommodates ${seatingCapacity} passengers with ${cargoVolumeCuFt} cu ft of cargo capacity. Drivetrain: ${drivetrain}. Crash safety rating: ${safetyRating}. Target buyer: ${idealFor}.`,
          tags: ['safety', 'cargo', 'seating', 'practicality', drivetrain.toLowerCase()]
        };

        this.chunks.unshift(overviewChunk, efficiencyChunk, practicalityChunk);
        newChunksCount += 3;
      } catch (err: any) {
        errors.push(`Row ${i}: ${err.message}`);
      }
    }

    return { importedCount, newChunksCount, errors };
  }

  private getAI(): GoogleGenAI | null {
    if (!process.env.GEMINI_API_KEY) return null;
    if (!this.aiClient) {
      this.aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
    return this.aiClient;
  }

  // Generate embedding using gemini-embedding-2-preview if key is available
  private async getEmbedding(text: string): Promise<number[] | null> {
    const cached = this.embeddingCache.get(text);
    if (cached) return cached;

    const ai = this.getAI();
    if (!ai) return null;

    try {
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: text
      });
      const values = response.embeddings?.[0]?.values || (response as any).embedding?.values;
      if (values && values.length > 0) {
        this.embeddingCache.set(text, values);
        return values;
      }
    } catch (err) {
      console.warn('Embedding generation warning, falling back to lexical search:', err instanceof Error ? err.message : err);
    }
    return null;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Lexical / Keyword matching & attribute boost
  private calculateLexicalScore(query: string, chunk: RAGChunk): number {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (queryTerms.length === 0) return 0.5;

    const textToSearch = `${chunk.title} ${chunk.content} ${chunk.tags.join(' ')}`.toLowerCase();
    let matches = 0;

    for (const term of queryTerms) {
      if (textToSearch.includes(term)) {
        matches += 1;
        // High bonus if title or tags match directly
        if (chunk.title.toLowerCase().includes(term)) matches += 0.8;
        if (chunk.tags.some(t => t.includes(term))) matches += 0.5;
      }
    }

    // Specific intent boosts
    const qLower = query.toLowerCase();
    const car = this.carsMap.get(chunk.carId);

    let intentBoost = 0;
    if (car) {
      // Budget mentions like 30k, 35000, under 40k
      const budgetMatch = qLower.match(/under\s*\$?(\d+)k?/i) || qLower.match(/\$?(\d+),?000/);
      if (budgetMatch) {
        let maxVal = parseInt(budgetMatch[1], 10);
        if (maxVal < 1000) maxVal *= 1000;
        if (car.price <= maxVal) {
          intentBoost += 0.4;
        } else if (car.price > maxVal * 1.15) {
          intentBoost -= 0.4;
        }
      }

      // Fuel types
      if (qLower.includes('electric') || qLower.includes('ev')) {
        if (car.fuelType === 'Electric') intentBoost += 0.5;
      }
      if (qLower.includes('hybrid')) {
        if (car.fuelType === 'Hybrid' || car.fuelType === 'Plug-in Hybrid') intentBoost += 0.5;
      }

      // AWD / Snow / Winter
      if (qLower.includes('snow') || qLower.includes('winter') || qLower.includes('awd') || qLower.includes('all-wheel')) {
        if (car.drivetrain === 'AWD') intentBoost += 0.4;
      }

      // Family / 7 seats / 3 row
      if (qLower.includes('family') || qLower.includes('7 seat') || qLower.includes('3 row') || qLower.includes('third row')) {
        if (car.seatingCapacity >= 7) intentBoost += 0.5;
        else if (car.bodyType === 'SUV' && car.cargoVolumeCuFt > 60) intentBoost += 0.2;
      }

      // Commuter / MPG / Gas mileage
      if (qLower.includes('commute') || qLower.includes('mpg') || qLower.includes('mileage') || qLower.includes('efficient')) {
        if ((car.mpgHwy && car.mpgHwy >= 38) || car.fuelType === 'Electric' || car.fuelType === 'Plug-in Hybrid') {
          intentBoost += 0.4;
        }
      }

      // Luxury
      if (qLower.includes('luxury') || qLower.includes('premium')) {
        if (['BMW', 'Lexus', 'Genesis', 'Rivian'].includes(car.make)) intentBoost += 0.4;
      }
    }

    const baseLexical = matches / queryTerms.length;
    return Math.min(1.0, Math.max(0.05, baseLexical * 0.7 + intentBoost * 0.3));
  }

  // Perform Hybrid Retrieval (Vector + BM25 Lexical)
  public async retrieve(query: string, topK: number = 5): Promise<{
    chunk: RAGChunk;
    score: number;
    car?: Car;
  }[]> {
    const queryEmbedding = await this.getEmbedding(query);

    const scoredResults: {
      chunk: RAGChunk;
      score: number;
      car?: Car;
    }[] = [];

    for (const chunk of this.chunks) {
      const lexicalScore = this.calculateLexicalScore(query, chunk);
      let semanticScore = 0;

      if (queryEmbedding) {
        if (!chunk.embedding) {
          chunk.embedding = (await this.getEmbedding(chunk.content)) || undefined;
        }
        if (chunk.embedding) {
          semanticScore = this.cosineSimilarity(queryEmbedding, chunk.embedding);
        }
      }

      // Blend semantic and lexical scores
      const finalScore = queryEmbedding
        ? semanticScore * 0.65 + lexicalScore * 0.35
        : lexicalScore;

      scoredResults.push({
        chunk,
        score: Math.round(finalScore * 100) / 100,
        car: this.carsMap.get(chunk.carId)
      });
    }

    // Sort by score descending
    scoredResults.sort((a, b) => b.score - a.score);

    return scoredResults.slice(0, topK);
  }
}

export const ragEngine = new RAGEngine();
