import React, { useState } from 'react';
import { analyzeFleetStatus } from '../services/geminiService';
import { MOCK_VEHICLES } from '../constants';
import ReactMarkdown from 'react-markdown'; // Assuming standard markdown render capability or raw text

export const FleetAI: React.FC = () => {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis("");
    const result = await analyzeFleetStatus(MOCK_VEHICLES);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 border border-blue-700 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span className="text-4xl">🧠</span> Inteligência de Frota
        </h1>
        <p className="text-blue-200 mb-6 max-w-xl">
          Utilize o modelo Gemini 3.0 para analisar padrões de comportamento, prever manutenções e otimizar rotas com base nos dados telemétricos.
        </p>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
            loading 
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-white text-blue-900 hover:bg-blue-50 hover:shadow-lg hover:scale-105'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando Análise...
            </>
          ) : (
            <>✨ Gerar Relatório Executivo</>
          )}
        </button>
      </div>

      {analysis && (
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-xl animate-fade-in-up">
          <h2 className="text-xl font-semibold text-emerald-400 mb-4 border-b border-slate-700 pb-2">
            Relatório Gerado
          </h2>
          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
             <div className="whitespace-pre-line leading-relaxed">
               {analysis}
             </div>
          </div>
        </div>
      )}
      
      {!analysis && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50">
           <div className="h-32 bg-slate-800 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-slate-500">
              Análise de Combustível
           </div>
           <div className="h-32 bg-slate-800 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-slate-500">
              Risco de Acidentes
           </div>
           <div className="h-32 bg-slate-800 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-slate-500">
              Otimização de Rotas
           </div>
        </div>
      )}
    </div>
  );
};