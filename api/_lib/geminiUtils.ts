
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";

const API_KEY = process.env.API_KEY; 
const modelName = 'gemini-2.5-flash-preview-04-17';

let ai: GoogleGenAI | null = null;
if (API_KEY && API_KEY !== "YOUR_API_KEY_HERE" && API_KEY.length > 10) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("Gemini API key is not configured or is invalid. Image description generation will be skipped or return an error.");
}

export const generateImageDescriptionFromAPI = async (base64ImageData: string, mimeType: string): Promise<string> => {
  if (!ai) {
    return "Image description skipped: Gemini API key not configured on server.";
  }

  try {
    const imagePart: Part = {
      inlineData: {
        mimeType: mimeType,
        data: base64ImageData,
      },
    };

    const textPart: Part = {
      text: "Describe this image concisely in one engaging sentence, suitable for a file preview. Focus on the main subject, style, and key visual elements. If it's abstract, describe its general feel.",
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [imagePart, textPart] },
    });
    
    const description = response.text?.trim();
    if (!description) {
        return "Could not generate a description (empty response from API).";
    }
    return description;

  } catch (error: any) {
    console.error("Error calling Gemini API on backend:", error);
    if (error.message) {
        if (error.message.includes('API key not valid')) {
            return "Failed: Invalid API Key (server).";
        }
        if (error.message.includes('429') || error.message.toLowerCase().includes('quota')) {
            return "Failed: Rate limit or quota exceeded (server).";
        }
        if (error.message.toLowerCase().includes('candidate was blocked')) {
            return "Description blocked due to safety settings (server).";
        }
        return `Failed: ${error.message.substring(0,100)} (server)`;
    }
    return "Failed to generate image description due to an unknown API error (server).";
  }
};
