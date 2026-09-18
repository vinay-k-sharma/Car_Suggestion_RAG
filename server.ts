import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { CARS_DATA } from './src/data/cars';
import { ragEngine } from './server/ragEngine';
import { generateCarRecommendation } from './server/geminiService';
import { promptEngine } from './server/promptEngine';
import { domainRegistry } from './server/domainRegistry';
import { RecommendationState } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get all vehicles with optional filters
  app.get('/api/cars', (req, res) => {
    const { bodyType, fuelType, maxPrice, search } = req.query;
    let cars = ragEngine.getCars();

    if (bodyType && typeof bodyType === 'string' && bodyType !== 'All') {
      cars = cars.filter(c => c.bodyType.toLowerCase() === bodyType.toLowerCase());
    }

    if (fuelType && typeof fuelType === 'string' && fuelType !== 'All') {
      cars = cars.filter(c => c.fuelType.toLowerCase() === fuelType.toLowerCase());
    }

    if (maxPrice && typeof maxPrice === 'string') {
      const priceNum = Number(maxPrice);
      if (!isNaN(priceNum) && priceNum > 0) {
        cars = cars.filter(c => c.price <= priceNum);
      }
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      cars = cars.filter(
        c =>
          c.make.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.idealFor.toLowerCase().includes(q)
      );
    }

    res.json({ cars, total: cars.length });
  });

  // Get single vehicle
  app.get('/api/cars/:id', (req, res) => {
    const car = ragEngine.getCarById(req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ car });
  });

  // Prompt-Driven Recommendation Chat Endpoint
  app.post('/api/recommendation/chat', async (req, res) => {
    try {
      const { message, state } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message string is required' });
      }

      const currentState: RecommendationState = state || {
        domain: 'cars',
        intent: 'car_recommendation',
        preferences: {},
        askedQuestions: [],
        confidence: 0,
        readyForRecommendation: false
      };

      const response = await promptEngine.processTurn(message, currentState);
      res.json(response);
    } catch (err: any) {
      console.error('Recommendation engine turn error:', err);
      res.status(500).json({ error: err.message || 'Failed to process recommendation turn' });
    }
  });

  // Get prompts.json modular prompt layers
  app.get('/api/prompts', (req, res) => {
    res.json(promptEngine.getPromptsConfig());
  });

  // Update a specific prompt template in prompts.json
  app.put('/api/prompts/:id', (req, res) => {
    const { template } = req.body;
    if (!template || typeof template !== 'string') {
      return res.status(400).json({ error: 'Template string is required' });
    }
    const success = promptEngine.updatePromptTemplate(req.params.id, template);
    if (!success) {
      return res.status(404).json({ error: 'Prompt layer not found' });
    }
    res.json({ success: true, updatedConfig: promptEngine.getPromptsConfig() });
  });

  // Get registered recommendation domains
  app.get('/api/domains', (req, res) => {
    res.json({ domains: domainRegistry.getAllDomains() });
  });

  // Chat endpoint powered by RAG + Gemini
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message string is required' });
      }

      const result = await generateCarRecommendation(message, history || []);
      res.json(result);
    } catch (err: any) {
      console.error('Chat endpoint error:', err);
      res.status(500).json({ error: err.message || 'Failed to process recommendation' });
    }
  });

  // Direct RAG search endpoint for debugging or live search
  app.post('/api/rag/search', async (req, res) => {
    try {
      const { query, topK } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      const results = await ragEngine.retrieve(query, topK || 5);
      res.json({ results });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Retrieval failed' });
    }
  });

  // View all indexed RAG knowledge chunks
  app.get('/api/rag/chunks', (req, res) => {
    const chunks = ragEngine.getAllChunks();
    res.json({ chunks, total: chunks.length });
  });

  // Add custom car document / spec sheet to RAG knowledge base
  app.post('/api/rag/add-document', (req, res) => {
    try {
      const { carName, title, category, content, tags } = req.body;
      if (!carName || !title || !content) {
        return res.status(400).json({ error: 'carName, title, and content are required' });
      }

      const newChunk = ragEngine.addCustomDocument({
        carName,
        title,
        category: category || 'overview',
        content,
        tags: tags || []
      });

      res.json({ success: true, chunk: newChunk });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to add document' });
    }
  });

  // Ingest CSV dataset into RAG pipeline
  app.post('/api/rag/ingest-csv', (req, res) => {
    try {
      const { csvContent } = req.body;
      if (!csvContent || typeof csvContent !== 'string') {
        return res.status(400).json({ error: 'csvContent string is required' });
      }

      const result = ragEngine.ingestCSV(csvContent);
      res.json({
        success: true,
        ...result,
        totalCars: ragEngine.getCars().length,
        totalChunks: ragEngine.getAllChunks().length
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to ingest CSV dataset' });
    }
  });

  // Vite middleware for dev or static dist for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CarMatch AI Server running on port ${PORT}`);
  });
}

startServer();
