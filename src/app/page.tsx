"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ProcessedImage,
  AppMode,
  AppState,
  UploadProgress,
} from "@/lib/types";
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
        current_file: images[0]?.file.name,
        percentage: 0,
      },
    }));

    // TODO: Implement actual image processing with Gemini API
    // For now, simulate processing
    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      // Update current processing status
      setState((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.id === image.id
            ? { ...img, processing_status: "processing" as const }
            : img,
        ),
        upload_progress: prev.upload_progress
          ? {
              ...prev.upload_progress,
              current_file: image.file.name,
            }
          : null,
      }));

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock OCR and description (replace with actual Gemini API calls)
      const mockOcrText = `Sample OCR text for ${image.file.name}`;
      const mockDescription = `A screenshot showing various UI elements and text content from ${image.file.name}`;

      setState((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.id === image.id
            ? {
                ...img,
                processing_status: "completed" as const,
                ocr_text: mockOcrText,
                image_description: mockDescription,
              }
            : img,
        ),
        upload_progress: prev.upload_progress
          ? {
              ...prev.upload_progress,
              completed: i + 1,
              percentage: Math.round(((i + 1) / images.length) * 100),
            }
          : null,
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

      // TODO: Implement actual search with Gemini API
      // For now, simulate search
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock search results
      const mockResults = state.images
        .filter((img) => img.processing_status === "completed")
        .slice(0, 5)
        .map((img, index) => ({
          image_id: img.id,
          similarity_score: Math.random() * 0.5 + 0.5, // 0.5-1.0 range
        }))
        .sort((a, b) => b.similarity_score - a.similarity_score);

      setState((prev) => ({
        ...prev,
        search_state: {
          ...prev.search_state,
          results: mockResults,
          is_searching: false,
          last_search_time: new Date(),
        },
      }));
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
            Visual Memory Search
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
