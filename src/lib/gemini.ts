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

Please format your response as JSON with the following structure:
{
  "ocr_text": "All text found in the image, separated by spaces or newlines as appropriate",
  "image_description": "Detailed description of the visual content, objects, people, colors, layout, UI elements, etc."
}`,
      ]),
      config: {
        systemInstruction:
          "You are an expert at analyzing screenshots and images. Extract text accurately and provide detailed visual descriptions that would help someone search for this image later using natural language queries.",
      },
    });

    const text = response.text || "";

    // Try to parse JSON response
    try {
      return JSON.parse(text);
    } catch (parseError) {
      // Fallback: extract content manually if JSON parsing fails
      console.warn("Failed to parse JSON response, using fallback extraction");
      return {
        ocr_text:
          extractTextBetween(text, "ocr_text", "image_description") || "",
        image_description: extractTextAfter(text, "image_description") || text,
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

Format your response as:
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
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are an expert at matching natural language queries to image content. Be precise with scoring - only high-confidence matches should get scores above 0.7.",
      },
    });

    const text = response.text || "";

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.warn("Failed to parse search response, returning empty results");
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
