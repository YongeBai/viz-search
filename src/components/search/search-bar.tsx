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
      className="w-full max-w-4xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          {/* Premium Search Container */}
          <div className="glass-strong rounded-2xl p-1 neural-glow group-focus-within:neural-glow-strong transition-all duration-500">
            {/* Search Icon */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
              {isSearching ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-6 h-6 text-primary" />
                </motion.div>
              ) : (
                <Search className="w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
              )}
            </div>

            {/* Input Field */}
            <Input
              type="text"
              value={localQuery}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={disabled || isSearching}
              className="pl-16 pr-48 py-8 text-xl bg-transparent border-0 focus:border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60 placeholder:text-muted-foreground/60"
            />

            {/* Enhanced AI Indicator */}
            <div className="absolute right-32 top-1/2 -translate-y-1/2">
              <motion.div
                animate={{
                  scale: isSearching ? [1, 1.1, 1] : 1,
                  opacity: disabled ? 0.3 : 1,
                }}
                transition={{
                  repeat: isSearching ? Infinity : 0,
                  duration: 2,
                }}
                className="glass rounded-xl px-4 py-2 neural-glow"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <motion.div
                    animate={{
                      rotate: isSearching ? 360 : 0,
                    }}
                    transition={{
                      duration: 2,
                      repeat: isSearching ? Infinity : 0,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                  </motion.div>
                  <span className="gradient-text">AI Search</span>
                </div>
              </motion.div>
            </div>

            {/* Search/Clear Button */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {localQuery.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={handleClear}
                  disabled={isSearching}
                  className="h-12 px-6 text-muted-foreground hover:text-foreground rounded-xl transition-all duration-300"
                >
                  Clear
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  disabled={
                    disabled || isSearching || localQuery.trim().length === 0
                  }
                  className="h-12 px-6 neural-glow hover:neural-glow-strong transition-all duration-300 rounded-xl"
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Search Suggestions */}
        {!disabled && localQuery.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 space-y-4"
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Try searching for:
              </p>
              <div className="flex flex-wrap gap-3 justify-center max-w-2xl mx-auto">
                {SEARCH_EXAMPLES.slice(0, 4).map((example, index) => (
                  <motion.button
                    key={example}
                    type="button"
                    onClick={() => {
                      setLocalQuery(example);
                      onSearch(example);
                    }}
                    className="glass rounded-2xl px-6 py-3 text-sm text-muted-foreground hover:text-foreground hover:neural-glow transition-all duration-300 border border-transparent hover:border-primary/20"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    &quot;{example}&quot;
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Status Messages */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 min-h-[40px] text-center"
        >
          {disabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-xl px-6 py-3 inline-block"
            >
              <p className="text-sm text-muted-foreground">
                Upload some screenshots first to start searching
              </p>
            </motion.div>
          )}
        </motion.div>
      </form>
    </motion.div>
  );
}
