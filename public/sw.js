// NeoRastro Service Worker
// Estratégia: Network First (prioriza dados reais), mas habilita instalação.

const CACHE_NAME = 'neorastro-v1';

// Instalação: Ocorre uma vez. Útil para cachear o 'shell' do app se desejado.
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o SW a ativar imediatamente
});

// Ativação: Limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Interceptação de Rede
self.addEventListener('fetch', (event) => {
  // Para um SaaS de rastreamento, queremos dados frescos sempre.
  // Apenas passamos a requisição adiante. A existência deste handler
  // é o que permite o Chrome exibir o prompt "Adicionar à Tela Inicial".
  event.respondWith(fetch(event.request));
});