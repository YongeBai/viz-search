import { ProcessedImage, GeminiSearchResponse } from "./types";
import { uploadFileToAPI, analyzeImageAPI } from "./api";
import { searchImages } from "./gemini";

// Configuration constants
const BATCH_SIZE = 15;
const SEARCH_BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export interface BatchProcessResult {
  success: boolean;
  image: ProcessedImage;
  geminiFileUri?: string;
  ocrText?: string;
  imageDescription?: string;
  error?: string;
}

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Exponential backoff retry wrapper
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  initialDelay: number = INITIAL_RETRY_DELAY,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(
        `Retry attempt ${attempt + 1} after ${delay}ms delay:`,
        lastError.message,
      );
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Process a single image with retry logic
 */
export async function processSingleImage(
  image: ProcessedImage,
): Promise<BatchProcessResult> {
  try {
    // Upload image with retry
    const geminiFileUri = await withRetry(() => uploadFileToAPI(image.file));

    // Analyze image with retry
    const analysisResult = await withRetry(() =>
      analyzeImageAPI(geminiFileUri, image.file.type),
    );

    return {
      success: true,
      image,
      geminiFileUri,
      ocrText: analysisResult.ocr_text,
      imageDescription: analysisResult.image_description,
    };
  } catch (error) {
    console.error(`Failed to process image ${image.file.name}:`, error);
    return {
      success: false,
      image,
      error: error instanceof Error ? error.message : "Processing failed",
    };
  }
}

/**
 * Process a batch of images concurrently
 */
export async function processBatch(
  images: ProcessedImage[],
): Promise<BatchProcessResult[]> {
  console.log(`Processing batch of ${images.length} images...`);

  // Process all images in the batch concurrently
  const results = await Promise.allSettled(
    images.map((image) => processSingleImage(image)),
  );

  // Convert PromiseSettledResult to BatchProcessResult
  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      // Handle rejected promises
      console.error(
        `Batch processing failed for ${images[index].file.name}:`,
        result.reason,
      );
      return {
        success: false,
        image: images[index],
        error:
          result.reason instanceof Error
            ? result.reason.message
            : "Batch processing failed",
      };
    }
  });
}

/**
 * Process all images in manageable batches
 */
export async function processImagesInBatches(
  images: ProcessedImage[],
  onBatchComplete?: (
    results: BatchProcessResult[],
    batchIndex: number,
    totalBatches: number,
  ) => void,
  batchSize: number = BATCH_SIZE,
): Promise<BatchProcessResult[]> {
  const totalBatches = Math.ceil(images.length / batchSize);
  const allResults: BatchProcessResult[] = [];

  console.log(
    `Processing ${images.length} images in ${totalBatches} batches of ${batchSize}`,
  );

  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);

    console.log(
      `Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} images)`,
    );

    try {
      const batchResults = await processBatch(batch);
      allResults.push(...batchResults);

      // Callback for progress updates
      if (onBatchComplete) {
        onBatchComplete(batchResults, batchIndex, totalBatches);
      }

      // Small delay between batches to be nice to the API
      if (i + batchSize < images.length) {
        await sleep(100);
      }
    } catch (error) {
      console.error(`Batch ${batchIndex + 1} failed:`, error);

      // Create error results for this batch
      const errorResults: BatchProcessResult[] = batch.map((image) => ({
        success: false,
        image,
        error: error instanceof Error ? error.message : "Batch failed",
      }));

      allResults.push(...errorResults);

      if (onBatchComplete) {
        onBatchComplete(errorResults, batchIndex, totalBatches);
      }
    }
  }

  const successCount = allResults.filter((r) => r.success).length;
  const failureCount = allResults.length - successCount;

  console.log(
    `Batch processing complete: ${successCount} succeeded, ${failureCount} failed`,
  );

  return allResults;
}

// Search-related types and functions
export interface SearchBatchResult {
  similarities: Array<{
    image_id: string;
    score: number;
    reasoning?: string;
  }>;
}

/**
 * Search a batch of images in parallel
 */
export async function searchImageBatch(
  query: string,
  imageBatch: ProcessedImage[],
): Promise<SearchBatchResult> {
  try {
    console.log(
      `Searching batch of ${imageBatch.length} images for: "${query}"`,
    );

    const result = await withRetry(() => searchImages(query, imageBatch));

    return {
      similarities: result.similarities || [],
    };
  } catch (error) {
    console.error(`Failed to search batch:`, error);
    // Return empty results for this batch instead of failing entirely
    return { similarities: [] };
  }
}

/**
 * Search all images in parallel batches
 */
export async function searchImagesInBatches(
  query: string,
  images: ProcessedImage[],
  onBatchComplete?: (
    results: SearchBatchResult,
    batchIndex: number,
    totalBatches: number,
  ) => void,
  batchSize: number = SEARCH_BATCH_SIZE,
): Promise<SearchBatchResult> {
  if (images.length === 0) {
    return { similarities: [] };
  }

  const totalBatches = Math.ceil(images.length / batchSize);
  const allSimilarities: Array<{
    image_id: string;
    score: number;
    reasoning?: string;
  }> = [];

  console.log(
    `Searching ${images.length} images in ${totalBatches} batches of ${batchSize}`,
  );

  // Process search in parallel batches
  const batchPromises: Promise<SearchBatchResult>[] = [];

  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const batchPromise = searchImageBatch(query, batch);
    batchPromises.push(batchPromise);
  }

  // Wait for all batches to complete
  const batchResults = await Promise.allSettled(batchPromises);

  // Collect results and handle any failures
  batchResults.forEach((result, batchIndex) => {
    if (result.status === "fulfilled") {
      allSimilarities.push(...result.value.similarities);

      // Callback for progress updates
      if (onBatchComplete) {
        onBatchComplete(result.value, batchIndex, totalBatches);
      }
    } else {
      console.error(`Search batch ${batchIndex + 1} failed:`, result.reason);

      // Still call progress callback with empty results
      if (onBatchComplete) {
        onBatchComplete({ similarities: [] }, batchIndex, totalBatches);
      }
    }
  });

  // Sort all results by score (highest first)
  allSimilarities.sort((a, b) => (b.score || 0) - (a.score || 0));

  console.log(
    `Parallel search complete: ${allSimilarities.length} results found`,
  );

  return { similarities: allSimilarities };
}
