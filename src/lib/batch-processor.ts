import { ProcessedImage } from "./types";
import { uploadFileToAPI, analyzeImageAPI } from "./api";

// Configuration constants
const BATCH_SIZE = 5; // Process 5 images concurrently
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
