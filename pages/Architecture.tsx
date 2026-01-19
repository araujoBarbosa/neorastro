import React from 'react';

export const Architecture: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Arquitetura NeoRastro</h1>
        <p className="text-slate-400">Especificação técnica da infraestrutura definitiva para SaaS de rastreamento.</p>
      </div>

      {/* Diagram Section */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
        <h2 className="text-xl font-semibold text-blue-400 mb-6 flex items-center gap-2">
          <span>📐</span> Diagrama de Fluxo de Dados
        </h2>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center text-sm font-mono overflow-x-auto p-4 bg-slate-900 rounded-lg border border-slate-700/50">

          {/* Node: GPS */}
          <div className="flex flex-col items-center min-w-[120px]">
            <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center border-2 border-slate-600 mb-2 shadow-lg">
              📡
            </div>
            <span className="text-slate-300 font-bold">Rastreadores</span>
            <span className="text-slate-500 text-xs">TCP/IP Protocol</span>
          </div>

          {/* Connector */}
          <div className="flex-1 h-[2px] bg-slate-700 relative w-full md:w-auto my-4 md:my-0">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 bg-slate-900 px-1">TCP Socket</span>
            <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-slate-700 rotate-45"></div>
          </div>

          {/* Node: Backend */}
          <div className="flex flex-col items-center min-w-[140px]">
            <div className="w-20 h-20 bg-blue-900/30 rounded-lg flex items-center justify-center border-2 border-blue-500/50 mb-2 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              🐍
            </div>
            <span className="text-blue-400 font-bold">Python API</span>
            <span className="text-slate-500 text-xs">FastAPI (VPS)</span>
          </div>

          {/* Connector */}
          <div className="flex-1 h-[2px] bg-slate-700 relative w-full md:w-auto my-4 md:my-0">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 bg-slate-900 px-1">Write / Auth</span>
            <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-slate-700 rotate-45"></div>
          </div>

          {/* Node: Supabase */}
          <div className="flex flex-col items-center min-w-[140px]">
            <div className="w-20 h-20 bg-emerald-900/30 rounded-lg flex items-center justify-center border-2 border-emerald-500/50 mb-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              ⚡
            </div>
            <span className="text-emerald-400 font-bold">Supabase</span>
            <span className="text-slate-500 text-xs">DB & Realtime</span>
          </div>

          {/* Connector */}
          <div className="flex-1 h-[2px] bg-slate-700 relative w-full md:w-auto my-4 md:my-0">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 bg-slate-900 px-1">WebSocket (Sub)</span>
            <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-slate-700 rotate-45"></div>
          </div>

          {/* Node: Frontend */}
          <div className="flex flex-col items-center min-w-[140px]">
            <div className="w-20 h-20 bg-indigo-900/30 rounded-lg flex items-center justify-center border-2 border-indigo-500/50 mb-2">
              ⚛️
            </div>
            <span className="text-indigo-400 font-bold">Frontend</span>
            <span className="text-slate-500 text-xs">React + Vite</span>
          </div>

        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Component 1 */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-3">1. Backend Principal (Ingestão)</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="text-blue-500">▸</span>
              <span><strong>Stack:</strong> Python 3.11 + FastAPI.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500">▸</span>
              <span><strong>Infra:</strong> VPS Hostinger (Custo-benefício e IP fixo para sockets TCP).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500">▸</span>
              <span><strong>Função:</strong> Servidor TCP assíncrono (asyncio) para receber pacotes binários dos rastreadores (H02, Suntech, etc), parsear dados e inserir no Supabase.</span>
            </li>
          </ul>
        </div>

        {/* Component 2 */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-3">2. Camada de Dados & Realtime</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="text-emerald-500">▸</span>
              <span><strong>Stack:</strong> Supabase (PostgreSQL).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-500">▸</span>
              <span><strong>Funcionalidade Chave:</strong> Supabase Realtime. O frontend "assina" mudanças na tabela `positions`, eliminando a necessidade de desenvolver um servidor WebSocket customizado complexo.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-500">▸</span>
              <span><strong>Segurança:</strong> Row Level Security (RLS) para isolar dados de diferentes inquilinos (Tenants) do SaaS.</span>
            </li>
          </ul>
        </div>

        {/* Component 3 */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-3">3. Frontend (SaaS)</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="text-indigo-500">▸</span>
              <span><strong>Stack:</strong> React 18, Vite, Tailwind CSS.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-500">▸</span>
              <span><strong>Hospedagem:</strong> Cloudflare Pages (Deploy at Edge, ultra-rápido globalmente).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-500">▸</span>
              <span><strong>Padrão:</strong> SPA (Single Page App) consumindo API REST do Supabase (para histórico) e WebSockets (para realtime).</span>
            </li>
          </ul>
        </div>

        {/* Component 4 */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-3">4. Autenticação & Segurança</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="text-purple-500">▸</span>
              <span><strong>Auth:</strong> Supabase Auth (JWT).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-500">▸</span>
              <span><strong>Fluxo:</strong> O usuário loga no frontend &rarr; Recebe JWT &rarr; Frontend envia JWT em todas as requisições.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-500">▸</span>
              <span><strong>Integração:</strong> O Python backend valida o token JWT usando a chave secreta do projeto para endpoints de administração.</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};