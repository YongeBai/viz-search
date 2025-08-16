"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SearchX, Trophy, Target, Zap } from "lucide-react";
import { ProcessedImage, SearchResult } from "@/lib/types";
import { ImageGrid } from "@/components/upload/image-grid";

interface SearchResultsProps {
  images: ProcessedImage[];
  searchResults: SearchResult[];
  onImageClick: (image: ProcessedImage) => void;
  hasSearched: boolean;
}

export function SearchResults({
  images,
  searchResults,
  onImageClick,
  hasSearched,
}: SearchResultsProps) {
  // Filter to only completed images
  const completedImages = images.filter(
    (img) => img.processing_status === "completed",
  );

  // Get top 5 results
  const topResults = searchResults.slice(0, 5);

  // No search performed yet
  if (!hasSearched) {
    return (
      <div className="space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="mb-8"
          >
            <div className="glass-strong p-8 rounded-2xl neural-glow inline-block">
              <Target className="w-20 h-20 mx-auto text-primary" />
            </div>
          </motion.div>
          <h3 className="text-3xl font-bold gradient-text mb-4">
            Ready to Search
          </h3>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Use the search bar above to find specific screenshots using natural
            language. Try describing what you&apos;re looking for!
          </p>
        </motion.div>

        {/* Show all images in enhanced grid format */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-6 text-center">
            <h4 className="text-xl font-semibold mb-2">
              Your Screenshot Collection
            </h4>
            <p className="text-muted-foreground">
              {completedImages.length} images processed and ready to search
            </p>
          </div>
          <ImageGrid
            images={completedImages}
            onImageClick={onImageClick}
            searchResults={[]}
          />
        </div>
      </div>
    );
  }

  // No results found
  if (searchResults.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20"
      >
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 3, -3, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mb-8"
        >
          <div className="glass-strong p-8 rounded-2xl inline-block">
            <SearchX className="w-20 h-20 mx-auto text-muted-foreground" />
          </div>
        </motion.div>
        <h3 className="text-3xl font-bold gradient-text mb-4">
          No matches found
        </h3>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-8">
          Try adjusting your search terms or describing the content differently.
          AI search works best with descriptive phrases.
        </p>
        <div className="glass rounded-xl px-6 py-4 inline-block">
          <p className="text-sm text-muted-foreground">
            💡 Try being more specific about colors, UI elements, or text
            content
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold">Search Results</h3>
          </div>
          <div className="text-sm text-muted-foreground">
            Found {searchResults.length} matching image
            {searchResults.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Best Match Indicator */}
        {topResults.length > 0 && topResults[0].similarity_score > 0.8 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
          >
            <Trophy className="w-4 h-4" />
            Excellent match found!
          </motion.div>
        )}
      </motion.div>

      {/* Results Grid */}
      <motion.div layout className="space-y-6">
        <ImageGrid
          images={completedImages}
          onImageClick={onImageClick}
          searchResults={topResults}
          maxVisible={5}
        />

        {/* Score Legend */}
        {topResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-muted/30 rounded-lg p-4"
          >
            <div className="text-sm font-medium mb-3">
              Similarity Score Guide:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span>70%+ = Excellent match</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-secondary rounded-full"></div>
                <span>40-70% = Good match</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-muted-foreground/30 rounded-full border border-muted-foreground"></div>
                <span>10-40% = Possible match</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Hidden Results Indicator */}
        {searchResults.length > 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6 text-muted-foreground"
          >
            <div className="text-sm">
              {searchResults.length - 5} additional result
              {searchResults.length - 5 !== 1 ? "s" : ""} with lower similarity
              scores
            </div>
            <div className="text-xs mt-1 opacity-75">
              Only showing top 5 matches for better focus
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Search Tips */}
      {topResults.length > 0 && topResults[0].similarity_score < 0.5 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
        >
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
            💡 Search Tips for Better Results:
          </div>
          <div className="text-sm text-blue-600/80 dark:text-blue-400/80 space-y-1">
            <div>
              • Try describing visual elements: &quot;blue button&quot;,
              &quot;error dialog&quot;, &quot;dark theme&quot;
            </div>
            <div>
              • Include text content: &quot;login form&quot;,
              &quot;dashboard&quot;, &quot;settings page&quot;
            </div>
            <div>
              • Be specific: &quot;mobile app with navigation&quot; vs just
              &quot;app&quot;
            </div>
            <div>
              • Combine concepts: &quot;code editor showing JavaScript
              errors&quot;
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
