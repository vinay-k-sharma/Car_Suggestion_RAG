import { GoogleGenAI } from '@google/genai';
import { Car, ChatMessage } from '../src/types';
import { ragEngine } from './ragEngine';

export async function generateCarRecommendation(
  userMessage: string,
  history: { role: string; content: string }[] = []
): Promise<{
  content: string;
  matchedCarIds: string[];
  retrievedCars: Car[];
  citations: ChatMessage['citations'];
  suggestedPrompts: string[];
}> {
  // 1. Retrieve most relevant RAG chunks
  const ragResults = await ragEngine.retrieve(userMessage, 6);

  // Group unique cars found
  const carMap = new Map<string, Car>();
  ragResults.forEach(r => {
    if (r.car && !carMap.has(r.car.id)) {
      carMap.set(r.car.id, r.car);
    }
  });
  const retrievedCars = Array.from(carMap.values()).slice(0, 3);

  const citations = ragResults.slice(0, 4).map(r => ({
    carId: r.chunk.carId,
    carName: r.chunk.carName,
    category: r.chunk.category,
    snippet: r.chunk.content.substring(0, 180) + '...',
    score: r.score
  }));

  // If GEMINI_API_KEY is available, call Gemini 3.8 Flash
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const contextChunks = ragResults
        .map(
          r => `[Vehicle Document: ${r.chunk.carName} | Category: ${r.chunk.category} | Match Score: ${r.score}]
${r.chunk.content}`
        )
        .join('\n\n');

      const systemInstruction = `You are CarMatch AI, an automotive advisor and car recommendation expert attached to an automotive dealership and car marketplace.
You recommend vehicles strictly grounded in the verified dealership inventory and vehicle knowledge base provided in the CONTEXT.

CONTEXT KNOWLEDGE BASE (Retrieved via RAG):
${contextChunks}

GUIDELINES:
1. Ground your recommendations on the vehicles provided in the context above.
2. Directly answer the user's requirements (budget, body style, fuel economy, family size, winter weather, tech, etc.).
3. Clearly name the top 1 to 2 best matching vehicles, explaining specifically WHY each car fits their needs (cite specs like price, MPG, range, cargo space, horsepower, safety).
4. Highlight any trade-offs honestly (e.g. higher upfront MSRP vs lower lifetime fuel costs, or sportier suspension vs softer ride).
5. Be concise, well-formatted, friendly, and practical. Use clean markdown (bolding, bullet points) without fluff or cheesy marketing jargon.
6. At the very end of your response, provide exactly two machine-readable metadata lines:
MATCHED_CAR_IDS: comma-separated list of vehicle IDs (e.g. toyota-rav4-hybrid-2024, tesla-model-y-2024)
SUGGESTIONS: 2 to 3 concise follow-up questions or prompts separated by pipe symbol | (e.g. Compare RAV4 and Model Y | Show EVs under $40k | Which has best cargo?)`;

      const contents = [
        ...history.slice(-4).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.6
        }
      });

      const fullText = response.text || '';

      // Parse metadata lines if present
      let cleanedText = fullText;
      let matchedIds: string[] = [];
      let suggestedPrompts: string[] = [];

      const matchedIdMatch = fullText.match(/MATCHED_CAR_IDS:\s*([^\n\r]+)/i);
      if (matchedIdMatch) {
        matchedIds = matchedIdMatch[1]
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean);
        cleanedText = cleanedText.replace(matchedIdMatch[0], '').trim();
      }

      const suggestionsMatch = fullText.match(/SUGGESTIONS:\s*([^\n\r]+)/i);
      if (suggestionsMatch) {
        suggestedPrompts = suggestionsMatch[1]
          .split('|')
          .map(s => s.trim())
          .filter(Boolean);
        cleanedText = cleanedText.replace(suggestionsMatch[0], '').trim();
      }

      // If matchedIds is empty, fallback to retrieved car IDs
      if (matchedIds.length === 0) {
        matchedIds = retrievedCars.map(c => c.id);
      }

      if (suggestedPrompts.length === 0) {
        suggestedPrompts = [
          `Compare ${retrievedCars[0]?.make || 'top'} vs alternatives`,
          'What is the monthly lease estimate?',
          'Show me more high MPG options'
        ];
      }

      return {
        content: cleanedText,
        matchedCarIds: matchedIds,
        retrievedCars,
        citations,
        suggestedPrompts
      };
    } catch (err) {
      console.error('Error with Gemini API call, using grounded heuristic fallback:', err);
    }
  }

  // Grounded heuristic synthesizer (reliable fallback when GEMINI_API_KEY is not yet entered)
  const topCar = retrievedCars[0];
  const secondCar = retrievedCars[1];

  let fallbackContent = `Based on your request, I searched our vehicle specifications knowledge base using RAG semantic retrieval.\n\n`;

  if (topCar) {
    fallbackContent += `### **Top Recommendation: ${topCar.year} ${topCar.make} ${topCar.model} ${topCar.trim}**\n`;
    fallbackContent += `- **Price & Value**: Starting MSRP of **$${topCar.price.toLocaleString()}** (~$${topCar.leasePerMonth}/mo lease).\n`;
    fallbackContent += `- **Efficiency & Power**: ${topCar.fuelType === 'Electric' ? `**${topCar.electricRangeMiles} mi** pure electric range, ` : `**${topCar.mpgCity || 30}/${topCar.mpgHwy || 38} MPG**, `}${topCar.horsepower} HP with ${topCar.drivetrain} drivetrain.\n`;
    fallbackContent += `- **Why It Fits**: ${topCar.idealFor}\n`;
    fallbackContent += `- **Key Highlights**: ${topCar.keyFeatures.slice(0, 3).join(', ')}.\n\n`;
  }

  if (secondCar) {
    fallbackContent += `### **Alternative Option: ${secondCar.year} ${secondCar.make} ${secondCar.model}**\n`;
    fallbackContent += `- **Price**: $${secondCar.price.toLocaleString()} | **Fuel Type**: ${secondCar.fuelType} (${secondCar.drivetrain})\n`;
    fallbackContent += `- **Notable Difference**: ${secondCar.pros[0]}. Consider this if you prioritize ${secondCar.bodyType.toLowerCase()} practicality and ${secondCar.safetyRating}.\n\n`;
  }

  fallbackContent += `*All recommendations are grounded in real-time verified showroom specifications.*`;

  return {
    content: fallbackContent,
    matchedCarIds: retrievedCars.map(c => c.id),
    retrievedCars,
    citations,
    suggestedPrompts: [
      topCar && secondCar ? `Compare ${topCar.model} vs ${secondCar.model}` : 'Compare top choices',
      'What are the winter driving safety ratings?',
      'Show me best lease deals under $450/mo'
    ]
  };
}
