
import { GoogleGenAI, Type } from "@google/genai";
import { FarmData, BudgetResult, Language, GrowthStage } from "../types";
import { CROP_WATER_NEEDS } from "../constants";
import { queryPathwayLiveRAG } from "./pathway";
import { getGeminiApiKey } from "../utils/geminiHelper";

function sanitizeJson(text: string): string {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.status === 429;
    if (isRateLimit && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function analyzeGrowthStage(imageB64: string, crop: string): Promise<{ stage: GrowthStage; confidence: number; healthNote: string }> {
  return withRetry(async () => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY_MISSING");
    }
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Analyze this ${crop} crop photo. Identify growth stage. Return ONLY JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: imageB64 } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stage: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            healthNote: { type: Type.STRING }
          },
          required: ["stage", "confidence", "healthNote"]
        }
      }
    });
    return JSON.parse(sanitizeJson(response.text || "{}"));
  });
}

export async function calculateWaterBudget(data: FarmData, language: Language = 'en'): Promise<BudgetResult> {
  const daysSinceSowing = data.plantingDate 
    ? Math.floor((new Date().getTime() - new Date(data.plantingDate).getTime()) / (1000 * 3600 * 24))
    : 30;

  const pathwayData = await queryPathwayLiveRAG(
    `Assess water budget considering crop ${data.crop}, area ${data.area} ha, humidity ${data.soilMoisture}%, and current location weather.`,
    { ...data, daysSinceSowing }
  );

  return withRetry(async () => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY_MISSING");
    }
    const ai = new GoogleGenAI({ apiKey });
    const langMap = { en: "English", hi: "Hindi", he: "Hebrew" };
    
    // Extract available PDFs to tell Gemini what documents the farmer has
    const availableDocs = (data.knowledgeBase || []).map(d => d.name).join(", ");

    const systemInstruction = `
      You are an elite Agricultural Water Management System integrated with the Pathway RAG engine.
      
      KNOWLEDGE BASE:
      The farmer has indexed the following documents in their Pathway library: ${availableDocs || "None"}. 
      You MUST attempt to reference these documents in your recommendations if they are relevant to ${data.crop}.
      
      INPUT CONTEXT:
      - Crop: ${data.crop} (Base seasonal need: ${CROP_WATER_NEEDS[data.crop] || 500}mm)
      - Farm Area: ${data.area} Hectares
      - Current Soil Moisture: ${data.soilMoisture}%
      - Target Moisture: 80%
      - Weather: Temp ${pathwayData.weather.temp}°C, Forecast: ${pathwayData.weather.forecast}, Humidity: ${pathwayData.weather.humidity}%
      
      TASK:
      - Return a JSON object for a 7-day irrigation cycle.
      - If you cite a document from the list above, mention it by name in the recommendations.
      - Response must be in ${langMap[language]}.
    `;

    const prompt = `Calculate the 7-day water budget for ${data.area} hectares of ${data.crop} in ${data.location}. Ensure totalWaterNeeded is a realistic large volume. Cross-reference with the Knowledge Base.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalWaterNeeded: { type: Type.NUMBER },
            expectedRainContribution: { type: Type.NUMBER },
            groundwaterUsage: { type: Type.NUMBER },
            efficiencyScore: { type: Type.NUMBER },
            netDeficit: { type: Type.NUMBER },
            targetMoisture: { type: Type.NUMBER },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            breakdown: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, value: { type: Type.NUMBER } } }
            },
            cropHealth: {
               type: Type.OBJECT,
               properties: {
                 score: { type: Type.NUMBER },
                 status: { type: Type.STRING },
                 growthStage: { type: Type.STRING },
                 biomassIndex: { type: Type.NUMBER },
                 lastChecked: { type: Type.STRING },
                 metrics: {
                   type: Type.OBJECT,
                   properties: {
                     ndvi: { type: Type.NUMBER },
                     leafTurgor: { type: Type.NUMBER },
                     soilPh: { type: Type.NUMBER }
                   }
                 }
               }
            }
          },
          required: ["totalWaterNeeded", "recommendations", "breakdown", "cropHealth"]
        }
      }
    });

    const result = JSON.parse(sanitizeJson(response.text || "{}")) as BudgetResult;
    result.sources = pathwayData.sources.map(s => ({ title: s.doc_id, uri: "#" }));
    result.weather = pathwayData.weather;
    return result;
  }).catch((err) => {
    const moistureDeficit = Math.max(5, 80 - data.soilMoisture);
    const depthNeededMm = 25 * (moistureDeficit / 40); 
    const estimatedVolume = Math.round(data.area * depthNeededMm * 10);
    
    return {
      totalWaterNeeded: estimatedVolume,
      expectedRainContribution: 0,
      groundwaterUsage: estimatedVolume,
      efficiencyScore: 85,
      netDeficit: moistureDeficit,
      targetMoisture: 80,
      recommendations: ["⚠️ Local calculation applied. Check your indexed manuals for specific drip intervals."],
      breakdown: [{ category: "Volume scaling (Area based)", value: estimatedVolume }],
      weather: pathwayData.weather,
      cropHealth: { 
        score: 75, 
        status: 'Good', 
        growthStage: (data.growthStage || 'Vegetative') as GrowthStage,
        lastChecked: new Date().toISOString(),
        biomassIndex: 65,
        metrics: {
          ndvi: 0.72,
          leafTurgor: 0.85,
          soilPh: 6.8,
          npk: { n: 15, p: 15, k: 15 }
        }
      }
    } as BudgetResult;
  });
}
