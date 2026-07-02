import { GoogleGenAI } from "@google/genai";

/**
 * Safely resolves the Gemini API key from various environments
 * (both Vite client-side locally and the cloud developer sandbox).
 */
export function getGeminiApiKey(): string {
  // 1. Try Vite's client-side environment variables (highly standard for local VS Code + Vite)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const metaEnv = (import.meta as any).env;
    if (metaEnv.VITE_GEMINI_API_KEY) {
      return metaEnv.VITE_GEMINI_API_KEY;
    }
    if (metaEnv.VITE_API_KEY) {
      return metaEnv.VITE_API_KEY;
    }
  }

  // 2. Try window properties
  if (typeof window !== 'undefined') {
    if ((window as any).GEMINI_API_KEY) {
      return (window as any).GEMINI_API_KEY;
    }
    if ((window as any).process?.env?.API_KEY) {
      return (window as any).process.env.API_KEY;
    }
    if ((window as any).process?.env?.GEMINI_API_KEY) {
      return (window as any).process.env.GEMINI_API_KEY;
    }
  }

  // 3. Try standard node process env in a heavily guarded try-catch block
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY || (process.env as any).GEMINI_API_KEY || "";
    }
  } catch (e) {
    // Suppress reference error
  }

  return "";
}

/**
 * Creates and returns an initialized GoogleGenAI client with the resolved API key.
 * Throws a clear error if no key is present.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
}
