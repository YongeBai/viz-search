import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import {
  GeminiImageAnalysisResponse,
  GeminiSearchResponse,
  ProcessedImage,
} from "./types";

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error("GOOGLE_AI_API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

/**
 * Upload an image file to Google Files API
 */
export async function uploadImageToGemini(file: File): Promise<string> {
  try {
    const uploadedFile = await ai.files.upload({
      file: file,
      config: { mimeType: file.type },
    });
    return uploadedFile.uri || "";
  } catch (error) {
    console.error("Error uploading file to Gemini:", error);
    throw new Error(
      `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Analyze an image to extract OCR text and visual description
 */
export async function analyzeImage(
  fileUri: string,
  mimeType: string,
): Promise<GeminiImageAnalysisResponse> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: createUserContent([
        createPartFromUri(fileUri, mimeType),
        `Analyze this image and provide:
1. All visible text in the image (OCR extraction)
2. A detailed description of what's shown in the image

You MUST respond with ONLY valid JSON in this exact format:
{
  "ocr_text": "All text found in the image, separated by spaces or newlines as appropriate",
  "image_description": "Detailed description of the visual content, objects, people, colors, layout, UI elements, etc."
}

Return ONLY the JSON object, no other text or explanation.`,
      ]),
      config: {
        systemInstruction:
          "You are an expert at analyzing screenshots and images. You MUST respond with valid JSON only. Extract text accurately and provide detailed visual descriptions that would help someone search for this image later using natural language queries.",
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch (parseError) {
      // Enhanced fallback: try to extract JSON from the response
      console.warn("Failed to parse JSON response, attempting to extract JSON");
      
      // Look for JSON object in the response
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        } catch (secondParseError) {
          console.warn("Failed to parse extracted JSON, using manual extraction");
        }
      }
      
      // Manual fallback - try to extract values from JSON-like structure
      let ocrText = "";
      let imageDescription = "";
      
      // Try to find ocr_text value
      const ocrMatch = text.match(/"ocr_text"\s*:\s*"([^"]*?)"/);
      if (ocrMatch) {
        ocrText = ocrMatch[1];
      } else {
        // Fallback to old method
        ocrText = extractTextBetween(text, "ocr_text", "image_description") || "";
      }
      
      // Try to find image_description value
      const descMatch = text.match(/"image_description"\s*:\s*"([^"]*?)"/);
      if (descMatch) {
        imageDescription = descMatch[1];
      } else {
        // Fallback to old method or use entire text
        imageDescription = extractTextAfter(text, "image_description") || text;
      }
      
      return {
        ocr_text: ocrText,
        image_description: imageDescription,
      };
    }
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error(
      `Failed to analyze image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Search images based on a natural language query
 */
export async function searchImages(
  query: string,
  images: ProcessedImage[],
): Promise<GeminiSearchResponse> {
  try {
    const imageData = images.map((img) => ({
      id: img.id,
      ocr_text: img.ocr_text,
      description: img.image_description,
    }));

    const prompt = `
You are a search engine for image content. Given a search query and a list of images with their OCR text and descriptions, rank them by relevance.

Search Query: "${query}"

Images to search:
${imageData
  .map(
    (img) => `
ID: ${img.id}
OCR Text: ${img.ocr_text}
Description: ${img.description}
---`,
  )
  .join("\n")}

Please analyze which images best match the search query and return a JSON response with similarity scores (0-1, where 1 is perfect match).
Consider both the OCR text content AND the visual description when determining matches.

You MUST respond with ONLY valid JSON in this exact format:
{
  "similarities": [
    {
      "image_id": "image_id_here",
      "score": 0.95,
      "reasoning": "Brief explanation of why this matches"
    }
  ]
}

Only include images with scores above 0.1, and sort by score descending.
Return ONLY the JSON object, no other text or explanation.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are an expert at matching natural language queries to image content. You MUST respond with valid JSON only. Be precise with scoring - only high-confidence matches should get scores above 0.7.",
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";

    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch (parseError) {
      console.warn("Failed to parse search response, attempting to extract JSON");
      
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        } catch (secondParseError) {
          console.warn("Failed to parse extracted JSON, returning empty results");
        }
      }
      
      console.warn("No valid JSON found, returning empty results");
      return { similarities: [] };
    }
  } catch (error) {
    console.error("Error searching images:", error);
    throw new Error(
      `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Helper functions for fallback text extraction
function extractTextBetween(
  text: string,
  start: string,
  end: string,
): string | null {
  const startIndex = text.toLowerCase().indexOf(start.toLowerCase());
  const endIndex = text.toLowerCase().indexOf(end.toLowerCase());

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    return null;
  }

  return text
    .slice(startIndex + start.length, endIndex)
    .replace(/[":]/g, "")
    .trim();
}

function extractTextAfter(text: string, marker: string): string | null {
  const index = text.toLowerCase().indexOf(marker.toLowerCase());
  if (index === -1) return null;

  return text
    .slice(index + marker.length)
    .replace(/[":]/g, "")
    .trim();
}
