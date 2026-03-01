import { GoogleGenAI, Type } from "@google/genai";
import { ConversionResult, ConversionSuccess } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CACHE_PREFIX = 'gemini_currency_rate_';

interface CachedRate {
  rate: number;
  timestamp: number;
}

const getCacheKey = (from: string, to: string) => `${CACHE_PREFIX}${from}_${to}`;

const saveToCache = (from: string, to: string, rate: number) => {
  const data: CachedRate = { rate, timestamp: Date.now() };
  localStorage.setItem(getCacheKey(from, to), JSON.stringify(data));
};

const getFromCache = (from: string, to: string): CachedRate | null => {
  const json = localStorage.getItem(getCacheKey(from, to));
  if (!json) return null;
  try {
    return JSON.parse(json) as CachedRate;
  } catch (e) {
    return null;
  }
};

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<ConversionResult> => {
  // 1. Try Online Conversion if network is available
  if (navigator.onLine) {
    try {
      const prompt = `
        You are a strict currency conversion API for a mobile application.
        
        Task: Convert ${amount} ${fromCurrency} to ${toCurrency}.
        
        Instructions:
        1. Use 'googleSearch' to find the latest exchange rate.
        2. Validate inputs:
           - Amount must be numeric.
           - Currency codes must be valid ISO 4217.
        3. Output MUST be strict JSON.
        
        Schema for SUCCESS:
        {
          "converted_amount": <number>,
          "from_currency": "<ISO code>",
          "to_currency": "<ISO code>",
          "exchange_rate": <number>
        }
        
        Schema for FAILURE:
        {
          "error": {
            "code": "<INVALID_AMOUNT | UNSUPPORTED_CURRENCY | API_ERROR>",
            "message": "<English description>"
          }
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              converted_amount: { type: Type.NUMBER },
              from_currency: { type: Type.STRING },
              to_currency: { type: Type.STRING },
              exchange_rate: { type: Type.NUMBER },
              error: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  message: { type: Type.STRING }
                }
              }
            },
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from AI");
      }

      const result = JSON.parse(text) as ConversionResult;

      // If successful, cache the rates (forward and reverse)
      if ('exchange_rate' in result && typeof result.exchange_rate === 'number') {
        saveToCache(fromCurrency, toCurrency, result.exchange_rate);
        
        // Calculate and cache reverse rate if valid
        if (result.exchange_rate > 0) {
          saveToCache(toCurrency, fromCurrency, 1 / result.exchange_rate);
        }
        
        // Add timestamp to result
        (result as ConversionSuccess).timestamp = Date.now();
        (result as ConversionSuccess).isCached = false;
      }

      return result;

    } catch (error) {
      console.warn("Online conversion failed, attempting fallback:", error);
      // Fall through to offline logic
    }
  }

  // 2. Offline Fallback
  try {
    const cachedData = getFromCache(fromCurrency, toCurrency);
    
    if (cachedData) {
      return {
        converted_amount: amount * cachedData.rate,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        exchange_rate: cachedData.rate,
        isCached: true,
        timestamp: cachedData.timestamp
      };
    }

    return {
      error: {
        code: navigator.onLine ? "API_ERROR" : "OFFLINE_NO_CACHE",
        message: navigator.onLine 
          ? "Service unavailable and no cached rate found." 
          : "You are offline and no cached rate was found for this pair."
      }
    };
  } catch (err) {
    return { 
      error: {
        code: "SYSTEM_ERROR",
        message: "An unexpected system error occurred."
      }
    };
  }
};