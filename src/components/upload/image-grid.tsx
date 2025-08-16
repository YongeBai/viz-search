"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FileImage, AlertCircle, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProcessedImage, SearchResult } from "@/lib/types";

interface ImageGridProps {
  images: ProcessedImage[];
  onImageClick: (image: ProcessedImage) => void;
  searchResults: SearchResult[];
  maxVisible?: number;
}

export function ImageGrid({
  images,
  onImageClick,
  searchResults,
  maxVisible,
}: ImageGridProps) {
  // Create a map of image IDs to similarity scores for quick lookup
  const scoreMap = new Map(
    searchResults.map((result) => [result.image_id, result.similarity_score]),
  );

  // Filter images based on search results if available
  const visibleImages =
    searchResults.length > 0
      ? images.filter((img) => scoreMap.has(img.id))
      : images;

  // Limit visible images if maxVisible is specified
  const displayImages = maxVisible
    ? visibleImages.slice(0, maxVisible)
    : visibleImages;

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileImage className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No images uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {searchResults.length > 0 ? (
            <>
              Showing {displayImages.length} of {searchResults.length} matching
              results
            </>
          ) : (
            <>
              {displayImages.length} image
              {displayImages.length !== 1 ? "s" : ""} uploaded
            </>
          )}
        </div>

        {images.some((img) => img.processing_status === "processing") && (
          <Badge variant="secondary" className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing...
          </Badge>
        )}
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        layout
      >
        <AnimatePresence>
          {displayImages.map((image, index) => {
            const similarityScore = scoreMap.get(image.id);

            return (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity:
                    searchResults.length > 0 && !similarityScore ? 0.3 : 1,
                  scale: 1,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onImageClick(image)}
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted border-2 border-transparent hover:border-primary cursor-pointer transition-all duration-200"
                >
                  {/* Image */}
                  {image.processing_status === "pending" ||
                  image.processing_status === "processing" ? (
                    <ImageSkeleton status={image.processing_status} />
                  ) : (
                    <img
                      src={image.preview}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                      loading="lazy"
                    />
                  )}

                  {/* Processing Overlay */}
                  {image.processing_status === "processing" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}

                  {/* Error Overlay */}
                  {image.processing_status === "error" && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                  )}

                  {/* Success Indicator */}
                  {image.processing_status === "completed" && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                </motion.div>

                {/* Similarity Score */}
                {similarityScore && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-center"
                  >
                    <Badge
                      variant={
                        similarityScore > 0.7
                          ? "default"
                          : similarityScore > 0.4
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {(similarityScore * 100).toFixed(1)}%
                    </Badge>
                  </motion.div>
                )}

                {/* File Info */}
                <div className="mt-1 text-xs text-muted-foreground text-center truncate">
                  {image.file.name}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Hidden Images Indicator */}
      {searchResults.length > 0 && images.length > displayImages.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4 text-sm text-muted-foreground"
        >
          {images.length - displayImages.length} more image
          {images.length - displayImages.length !== 1 ? "s" : ""} hidden (low
          similarity scores)
        </motion.div>
      )}
    </div>
  );
}

function ImageSkeleton({ status }: { status: "pending" | "processing" }) {
  return (
    <div className="w-full h-full relative">
      <Skeleton className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        {status === "processing" ? (
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        ) : (
          <FileImage className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
