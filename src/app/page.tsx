"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProcessedImage, AppMode, AppState, UploadProgress } from "@/lib/types";
import { searchImagesAPI } from "@/lib/api";
import {
  processImagesInBatches,
  BatchProcessResult,
} from "@/lib/batch-processor";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { ImageGrid } from "@/components/upload/image-grid";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResults } from "@/components/search/search-results";
import { ImageModal } from "@/components/image-modal";

const initialState: AppState = {
  mode: "upload",
  images: [],
  upload_progress: null,
  search_state: {
    query: "",
    results: [],
    is_searching: false,
  },
  selected_image: null,
};

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);

  const handleModeChange = useCallback((mode: AppMode) => {
    setState((prev) => ({
      ...prev,
      mode,
      // Clear search results when switching to upload mode
      search_state:
        mode === "upload"
          ? {
              query: "",
              results: [],
              is_searching: false,
            }
          : prev.search_state,
    }));
  }, []);

  const handleFilesUploaded = useCallback((files: File[]) => {
    const newImages: ProcessedImage[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      ocr_text: "",
      image_description: "",
      uploaded_at: new Date(),
      processing_status: "pending",
    }));

    setState((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
      mode: "search", // Auto-switch to search mode after upload
    }));

    // Start processing images
    processImages(newImages);
  }, []);

  const processImages = async (images: ProcessedImage[]) => {
    setState((prev) => ({
      ...prev,
      upload_progress: {
        total: images.length,
        completed: 0,
        current_file: `Processing ${images.length} images in batches...`,
        percentage: 0,
      },
    }));

    // Mark all images as processing initially
    setState((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        images.find((newImg) => newImg.id === img.id)
          ? { ...img, processing_status: "processing" as const }
          : img,
      ),
    }));

    try {
      // Process images in parallel batches with progress callback
      await processImagesInBatches(
        images,
        (
          batchResults: BatchProcessResult[],
          batchIndex: number,
          totalBatches: number,
        ) => {
          // Update state with batch results
          setState((prev) => ({
            ...prev,
            images: prev.images.map((img) => {
              const result = batchResults.find((r) => r.image.id === img.id);
              if (result) {
                if (result.success) {
                  return {
                    ...img,
                    processing_status: "completed" as const,
                    gemini_file_uri: result.geminiFileUri,
                    ocr_text: result.ocrText || "",
                    image_description: result.imageDescription || "",
                  };
                } else {
                  return {
                    ...img,
                    processing_status: "error" as const,
                    error_message: result.error || "Processing failed",
                  };
                }
              }
              return img;
            }),
            upload_progress: prev.upload_progress
              ? {
                  ...prev.upload_progress,
                  completed: Math.min((batchIndex + 1) * 5, images.length), // Assume batch size of 5
                  current_file: `Batch ${batchIndex + 1}/${totalBatches} complete`,
                  percentage: Math.round(
                    ((batchIndex + 1) / totalBatches) * 100,
                  ),
                }
              : null,
          }));
        },
      );
    } catch (error) {
      console.error("Batch processing failed:", error);

      // Mark any remaining processing images as errors
      setState((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.processing_status === "processing"
            ? {
                ...img,
                processing_status: "error" as const,
                error_message: "Batch processing failed",
              }
            : img,
        ),
      }));
    }

    // Clear progress after completion
    setTimeout(() => {
      setState((prev) => ({ ...prev, upload_progress: null }));
    }, 1000);
  };

  const handleSearch = useCallback(
    async (query: string) => {
      setState((prev) => ({
        ...prev,
        search_state: {
          ...prev.search_state,
          query,
          is_searching: true,
        },
      }));

      try {
        // Get completed images for search
        const completedImages = state.images.filter(
          (img) => img.processing_status === "completed",
        );

        if (completedImages.length === 0) {
          setState((prev) => ({
            ...prev,
            search_state: {
              ...prev.search_state,
              results: [],
              is_searching: false,
              last_search_time: new Date(),
            },
          }));
          return;
        }

        // Use Gemini search API
        const searchResponse = await searchImagesAPI(query, completedImages);

        // Convert Gemini response to SearchResult format
        const searchResults = searchResponse.similarities.map((similarity) => ({
          image_id: similarity.image_id,
          similarity_score: similarity.score,
        }));

        setState((prev) => ({
          ...prev,
          search_state: {
            ...prev.search_state,
            results: searchResults,
            is_searching: false,
            last_search_time: new Date(),
          },
        }));
      } catch (error) {
        console.error("Error during search:", error);

        setState((prev) => ({
          ...prev,
          search_state: {
            ...prev.search_state,
            results: [],
            is_searching: false,
            last_search_time: new Date(),
          },
        }));
      }
    },
    [state.images],
  );

  const handleImageClick = useCallback((image: ProcessedImage) => {
    setState((prev) => ({ ...prev, selected_image: image }));
  }, []);

  const handleCloseModal = useCallback(() => {
    setState((prev) => ({ ...prev, selected_image: null }));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            The Entire History of You
          </h1>
          <p className="text-muted-foreground text-lg">
            Search your screenshot history using natural language queries
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="inline-flex h-12 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full mb-8">
          <button
            onClick={() => handleModeChange("upload")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-lg font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
              state.mode === "upload"
                ? "bg-background text-foreground shadow-sm"
                : "hover:bg-background/50 hover:text-foreground"
            }`}
          >
            Upload
          </button>
          <button
            onClick={() => handleModeChange("search")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-lg font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
              state.mode === "search"
                ? "bg-background text-foreground shadow-sm"
                : "hover:bg-background/50 hover:text-foreground"
            }`}
          >
            Search
          </button>
        </div>

        {/* Content based on mode */}
        <div className="w-full">
          {/* Upload Mode */}
          {state.mode === "upload" && (
            <div className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <FileDropzone
                    onFilesUploaded={handleFilesUploaded}
                    uploadProgress={state.upload_progress}
                  />
                </motion.div>
              </AnimatePresence>

              {state.images.length > 0 && (
                <ImageGrid
                  images={state.images}
                  onImageClick={handleImageClick}
                  searchResults={[]}
                />
              )}
            </div>
          )}

          {/* Search Mode */}
          {state.mode === "search" && (
            <div className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key="search"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SearchBar
                    query={state.search_state.query}
                    onSearch={handleSearch}
                    isSearching={state.search_state.is_searching}
                    disabled={
                      state.images.filter(
                        (img) => img.processing_status === "completed",
                      ).length === 0
                    }
                  />
                </motion.div>
              </AnimatePresence>

              {/* Show uploaded images with processing status - hide when we have 5+ search results */}
              {state.images.length > 0 &&
                state.search_state.results.length < 5 && (
                  <ImageGrid
                    images={state.images}
                    onImageClick={handleImageClick}
                    searchResults={state.search_state.results}
                  />
                )}

              {state.images.length > 0 && (
                <SearchResults
                  images={state.images}
                  searchResults={state.search_state.results}
                  onImageClick={handleImageClick}
                  hasSearched={state.search_state.query.length > 0}
                />
              )}

              {state.images.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-xl mb-4">No images uploaded yet</p>
                  <p>Switch to Upload mode to add some screenshots first</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Image Modal */}
        <ImageModal
          image={state.selected_image}
          isOpen={state.selected_image !== null}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  );
}
