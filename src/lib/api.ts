import { GeminiImageAnalysisResponse, GeminiSearchResponse, ProcessedImage } from "./types";

export async function uploadFileToAPI(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload-file', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  const { fileUri } = await response.json();
  return fileUri;
}

export async function analyzeImageAPI(fileUri: string, mimeType: string): Promise<GeminiImageAnalysisResponse> {
  const response = await fetch('/api/analyze-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileUri, mimeType }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze image');
  }

  return response.json();
}

export async function searchImagesAPI(query: string, images: ProcessedImage[]): Promise<GeminiSearchResponse> {
  const response = await fetch('/api/search-images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, images }),
  });

  if (!response.ok) {
    throw new Error('Failed to search images');
  }

  return response.json();
}
