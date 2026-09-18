import React, { useState, useEffect } from 'react';
import { Database, Search, Sparkles, X, Plus, Check, FileText, Tag, Layers, RefreshCw, Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { RAGChunk } from '../types';

interface RAGInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const RAGInspectorModal: React.FC<RAGInspectorModalProps> = ({
  isOpen,
  onClose,
  onRefreshData
}) => {
  const [chunks, setChunks] = useState<RAGChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chunks' | 'test' | 'add' | 'csv'>('chunks');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [chunkSearch, setChunkSearch] = useState('');

  // RAG Search Tester State
  const [testQuery, setTestQuery] = useState('Reliable hybrid SUV under $40k for snowy winters');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testLoading, setTestLoading] = useState(false);

  // Add Document State
  const [newCarName, setNewCarName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<RAGChunk['category']>('overview');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);

  // CSV Ingestion State
  const [csvInput, setCsvInput] = useState<string>(
`id,make,model,year,trim,bodyType,fuelType,price,leasePerMonth,mpgCity,mpgHwy,electricRangeMiles,horsepower,drivetrain,seatingCapacity,cargoVolumeCuFt,safetyRating,acceleration0to60,idealFor,description
toyota-corolla-cross-2026,Toyota,Corolla Cross Hybrid,2026,Nightshade AWD,Crossover,Hybrid,32950,329,45,38,,196,AWD,5,61.8,5-Star NHTSA / IIHS Top Safety Pick,7.9 sec,"Budget-conscious commuters needing AWD snow capability and 42 combined MPG","Subcompact hybrid crossover with high ground clearance, electronic AWD, and Toyota Safety Sense 3.0."
audi-q6-etron-2026,Audi,Q6 e-tron,2026,Premium Plus Quattro,SUV,Electric,63800,679,,,307,422,AWD,5,60.1,5-Star EuroNCAP,4.9 sec,"Luxury EV buyers desiring fast 800V road-trip charging and serene interior acoustics","Built on the PPE platform with 100 kWh battery, 270 kW charging speed, and augmented reality head-up display."`
  );
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvFeedback, setCsvFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchChunks();
    }
  }, [isOpen]);

  const fetchChunks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rag/chunks');
      const data = await res.json();
      setChunks(data.chunks || []);
    } catch (err) {
      console.error('Failed to load chunks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSearch = async () => {
    if (!testQuery.trim()) return;
    setTestLoading(true);
    try {
      const res = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery, topK: 5 })
      });
      const data = await res.json();
      setTestResults(data.results || []);
    } catch (err) {
      console.error('Test search failed:', err);
    } finally {
      setTestLoading(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCarName || !newTitle || !newContent) return;

    try {
      const res = await fetch('/api/rag/add-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carName: newCarName,
          title: newTitle,
          category: newCategory,
          content: newContent,
          tags: newTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        })
      });

      if (res.ok) {
        setAddSuccess(true);
        setTimeout(() => setAddSuccess(false), 3000);
        setNewCarName('');
        setNewTitle('');
        setNewContent('');
        setNewTags('');
        fetchChunks();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error('Failed to add document:', err);
    }
  };

  const handleIngestCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvInput.trim()) return;

    setCsvLoading(true);
    setCsvFeedback(null);
    try {
      const res = await fetch('/api/rag/ingest-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: csvInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCsvFeedback({
          message: `Successfully ingested ${data.importedCount} vehicles and indexed ${data.newChunksCount} RAG chunks into the knowledge base!`,
          isError: false
        });
        fetchChunks();
        if (onRefreshData) onRefreshData();
      } else {
        setCsvFeedback({
          message: data.error || 'Failed to ingest CSV dataset',
          isError: true
        });
      }
    } catch (err: any) {
      setCsvFeedback({
        message: err.message || 'Network error during CSV ingestion',
        isError: true
      });
    } finally {
      setCsvLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvInput(content);
        setCsvFeedback({
          message: `Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB). Click "Ingest & Index CSV" to apply.`,
          isError: false
        });
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const filteredChunks = chunks.filter(c => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (chunkSearch.trim()) {
      const q = chunkSearch.toLowerCase();
      return (
        c.carName.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div
      id="rag-inspector-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        id="rag-inspector-modal"
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-white max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">RAG Knowledge Base & Retrieval Inspector</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                  {chunks.length} Chunks Indexed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transparent view into vector embeddings, semantic chunks, and hybrid retrieval
              </p>
            </div>
          </div>

          <button
            id="close-rag-inspector-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs shrink-0">
          <button
            id="tab-view-chunks"
            onClick={() => setActiveTab('chunks')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'chunks'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Indexed Chunks ({chunks.length})
          </button>

          <button
            id="tab-test-retrieval"
            onClick={() => {
              setActiveTab('test');
              if (testResults.length === 0) handleTestSearch();
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'test'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Retrieval Simulator
          </button>

          <button
            id="tab-add-chunk"
            onClick={() => setActiveTab('add')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'add'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            + Ingest Custom Doc
          </button>

          <button
            id="tab-csv-dataset"
            onClick={() => setActiveTab('csv')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'csv'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Dataset & Colab</span>
          </button>

          <button
            onClick={fetchChunks}
            className="ml-auto p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh knowledge base"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* TAB 1: VIEW CHUNKS */}
          {activeTab === 'chunks' && (
            <div className="space-y-4">
              {/* Filter / Search Row */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={chunkSearch}
                    onChange={e => setChunkSearch(e.target.value)}
                    placeholder="Search chunk contents, title, or tags..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto text-[11px]">
                  {['all', 'overview', 'specs', 'efficiency', 'safety_tech', 'practicality', 'verdict'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap ${
                        categoryFilter === cat
                          ? 'bg-cyan-500 text-slate-950 font-semibold'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {cat.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chunks List */}
              <div className="space-y-3">
                {filteredChunks.map(chunk => (
                  <div
                    key={chunk.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs space-y-2 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-300">{chunk.carName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase tracking-wider font-semibold border border-slate-700">
                          {chunk.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{chunk.id}</span>
                    </div>

                    <p className="font-semibold text-white">{chunk.title}</p>
                    <p className="text-slate-300 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60 font-mono text-[11px]">
                      {chunk.content}
                    </p>

                    <div className="flex flex-wrap gap-1 items-center pt-1 text-[10px] text-slate-400">
                      <Tag className="w-3 h-3 text-slate-500" />
                      {chunk.tags.map((t, idx) => (
                        <span key={idx} className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: RETRIEVAL SIMULATOR */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  Simulate User Search Query (Tests Semantic Cosine + BM25 Lexical Ranking):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testQuery}
                    onChange={e => setTestQuery(e.target.value)}
                    placeholder="Enter query to test retrieval..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleTestSearch}
                    disabled={testLoading}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{testLoading ? 'Retrieving...' : 'Run Retrieval'}</span>
                  </button>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  Retrieved Chunks Passed to Gemini Context:
                </h4>
                {testResults.map((res, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white">{res.chunk.carName}</span>
                        <span className="text-[10px] text-slate-400">({res.chunk.category})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold font-mono text-[11px] border border-emerald-500/30">
                        Score: {res.score}
                      </span>
                    </div>

                    <p className="text-slate-300 font-mono text-[11px] bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                      {res.chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: INGEST CUSTOM DOCUMENT */}
          {activeTab === 'add' && (
            <form onSubmit={handleAddDocument} className="space-y-4 max-w-xl mx-auto">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Ingest New Vehicle Specification Snippet
                </h4>
                <p className="text-[11px] text-slate-400">
                  Add custom dealership specs, warranty details, or newly arrived vehicles into the live RAG vector store.
                </p>

                {addSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Document successfully indexed into RAG knowledge base!</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Vehicle Name</label>
                  <input
                    type="text"
                    value={newCarName}
                    onChange={e => setNewCarName(e.target.value)}
                    placeholder="e.g. 2024 Honda Civic Sport"
                    required
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Document Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Certified Pre-Owned Warranty & Inspection Guarantee"
                    required
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="overview">Overview</option>
                    <option value="specs">Specs & Power</option>
                    <option value="efficiency">Efficiency & Fuel</option>
                    <option value="safety_tech">Safety & Tech</option>
                    <option value="practicality">Practicality & Space</option>
                    <option value="verdict">Verdict & Review</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Document Knowledge Content</label>
                  <textarea
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    rows={4}
                    placeholder="Enter factual vehicle knowledge to be indexed for semantic retrieval..."
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                    placeholder="warranty, certified, sedan, maintenance"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Index Document into RAG Knowledge Base</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: CSV DATASET & JUPYTER / COLAB PIPELINE */}
          {activeTab === 'csv' && (
            <div className="space-y-5">
              {/* Jupyter Notebook Download Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h4 className="font-bold text-sm text-white">Interactive Jupyter / Colab RAG Pipeline (.ipynb)</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Pre-configured with end-to-end Python code: CSV parser, <code>gemini-embedding-2-preview</code> embeddings, cosine retriever, and <code>gemini-3.8-flash</code> reasoning.
                  </p>
                </div>
                <a
                  href="/car_recommendation_rag_pipeline.ipynb"
                  download="car_recommendation_rag_pipeline.ipynb"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .ipynb</span>
                </a>
              </div>

              {/* CSV Ingestion Form */}
              <form onSubmit={handleIngestCSV} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                      <span>Ingest 2026 Vehicle Inventory CSV</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Upload a CSV file or paste raw rows. The system parses vehicle specs and automatically synthesizes 3 semantic RAG chunks per vehicle.
                    </p>
                  </div>

                  {/* File Upload Trigger */}
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload .csv File</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {csvFeedback && (
                  <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    csvFeedback.isError
                      ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                      : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  }`}>
                    {csvFeedback.isError ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    ) : (
                      <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    )}
                    <span>{csvFeedback.message}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-slate-300">CSV Dataset Content</label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Expected headers: make, model, year, trim, fuelType, price, drivetrain, idealFor, description...
                    </span>
                  </div>
                  <textarea
                    value={csvInput}
                    onChange={e => setCsvInput(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono text-[11px] focus:outline-none focus:border-amber-500"
                    placeholder="Paste CSV rows here..."
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Existing vehicles will update; new IDs will be added to the showroom inventory and semantic vector index.
                  </span>
                  <button
                    type="submit"
                    disabled={csvLoading || !csvInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 font-bold text-xs transition-all shadow-md shadow-amber-500/20 disabled:shadow-none flex items-center gap-1.5"
                  >
                    {csvLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Indexing Chunks...</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Ingest & Index CSV</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
