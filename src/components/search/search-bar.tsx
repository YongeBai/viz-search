"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  query: string;
  onSearch: (query: string) => void;
  isSearching: boolean;
  disabled?: boolean;
}

const SEARCH_EXAMPLES = [
  "error message about auth",
  "screenshot with blue button",
  "dashboard with charts",
  "mobile app interface",
  "code editor with dark theme",
  "login form with errors",
  "email interface",
  "settings panel",
];

export function SearchBar({
  query,
  onSearch,
  isSearching,
  disabled = false,
}: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(query);
  const [placeholder, setPlaceholder] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);

  // Sync local query with prop query when it changes externally
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Animate placeholder with example searches
  useEffect(() => {
    if (disabled) {
      setPlaceholder("Upload some images first to start searching...");
      return;
    }

    const animatePlaceholder = () => {
      const example = SEARCH_EXAMPLES[exampleIndex];
      let currentText = "";
      let i = 0;

      // Clear existing text
      setPlaceholder("");

      // Type out new example
      const typeInterval = setInterval(() => {
        if (i < example.length) {
          currentText += example[i];
          setPlaceholder(currentText + "|");
          i++;
        } else {
          clearInterval(typeInterval);
          setPlaceholder(currentText);

          // Move to next example after a pause
          setTimeout(() => {
            setExampleIndex((prev) => (prev + 1) % SEARCH_EXAMPLES.length);
          }, 2000);
        }
      }, 50);

      return () => clearInterval(typeInterval);
    };

    const cleanup = animatePlaceholder();
    return cleanup;
  }, [exampleIndex, disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim() && !isSearching && !disabled) {
      onSearch(localQuery.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  const handleClear = () => {
    setLocalQuery("");
    onSearch("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          {/* Search Icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            {isSearching ? (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            )}
          </div>

          {/* Input Field */}
          <Input
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled || isSearching}
            className="pl-12 pr-32 py-6 text-lg bg-background border-2 focus:border-primary transition-all duration-200 disabled:opacity-60"
          />

          {/* AI Indicator */}
          <div className="absolute right-20 top-1/2 -translate-y-1/2">
            <motion.div
              animate={{
                scale: isSearching ? [1, 1.2, 1] : 1,
                opacity: disabled ? 0.3 : 1,
              }}
              transition={{
                repeat: isSearching ? Infinity : 0,
                duration: 1.5,
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">AI Search</span>
            </motion.div>
          </div>

          {/* Search/Clear Button */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {localQuery.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={isSearching}
                className="h-8 px-3 text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={
                  disabled || isSearching || localQuery.trim().length === 0
                }
                className="h-8 px-4"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Search Suggestions */}
        {!disabled && localQuery.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 flex flex-wrap gap-2 justify-center"
          >
            <div className="text-xs text-muted-foreground mb-2 w-full text-center">
              Try searching for:
            </div>
            {SEARCH_EXAMPLES.slice(0, 4).map((example, index) => (
              <motion.button
                key={example}
                type="button"
                onClick={() => {
                  setLocalQuery(example);
                  onSearch(example);
                }}
                className="px-3 py-1 text-xs bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground rounded-full border transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                &quot;{example}&quot;
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Status Messages */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 min-h-[20px] text-center"
        >
          {disabled && (
            <p className="text-sm text-muted-foreground">
              Upload some screenshots first to start searching
            </p>
          )}
          {isSearching && (
            <p className="text-sm text-primary">
              Analyzing your images with AI...
            </p>
          )}
        </motion.div>
      </form>
    </motion.div>
  );
}
