export type SearchResult = {
  image_id: string;
  similarity_score: number; // 0–1 fused score from BOTH OCR + vision match
};

export type ProcessedImage = {
  id: string;
  file: File;
  preview: string; // Base64 or blob URL for thumbnail preview
  ocr_text: string; // OCR text extracted from the image
  image_description: string; // Short natural language description of the image
  uploaded_at: Date;
  gemini_file_uri?: string; // Google Files API URI
  processing_status: "pending" | "processing" | "completed" | "error";
  error_message?: string;
};

export type AppMode = "upload" | "search";

export type UploadProgress = {
  total: number;
  completed: number;
  current_file?: string;
  percentage: number;
};

export type SearchState = {
  query: string;
  results: SearchResult[];
  is_searching: boolean;
  last_search_time?: Date;
};

export type AppState = {
  mode: AppMode;
  images: ProcessedImage[];
  upload_progress: UploadProgress | null;
  search_state: SearchState;
  selected_image: ProcessedImage | null;
};

// Google Gemini API Response Types
export type GeminiImageAnalysisResponse = {
  ocr_text: string;
  image_description: string;
  confidence_score?: number;
};

export type GeminiSearchResponse = {
  similarities: Array<{
    image_id: string;
    score: number;
    reasoning?: string;
  }>;
};
