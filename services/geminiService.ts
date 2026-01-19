import { GoogleGenAI } from "@google/genai";
import { Vehicle } from "../types";

const initAI = () => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeFleetStatus = async (vehicles: Vehicle[]): Promise<string> => {
  const ai = initAI();
  if (!ai) return "Erro: Chave de API não configurada. Configure process.env.API_KEY.";

  const prompt = `
    Atue como um gerente de frota sênior e analista de logística.
    Analise os seguintes dados brutos da frota de veículos 'NeoRastro':
    
    ${JSON.stringify(vehicles.map(v => ({
      name: v.name,
      status: v.status,
      speed: v.lastPosition.speed,
      model: v.model,
      driver: v.driver
    })), null, 2)}

    Forneça um relatório executivo curto (máximo 3 parágrafos) em Português do Brasil.
    1. Resumo da operação atual.
    2. Alertas de segurança ou eficiência (veículos parados ou offline).
    3. Uma recomendação estratégica.
    Use formatação Markdown simples.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar a análise.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Erro ao processar análise da frota. Verifique a console.";
  }
};