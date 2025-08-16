"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, Zap, Search, Eye } from "lucide-react";

interface HeroSectionProps {
  hasImages: boolean;
}

export function HeroSection({ hasImages }: HeroSectionProps) {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered",
      description:
        "Advanced neural networks understand both text and visual content",
    },
    {
      icon: Search,
      title: "Natural Language",
      description: "Search using everyday language, no keywords required",
    },
    {
      icon: Eye,
      title: "Visual Recognition",
      description: "Identify UI elements, colors, layouts, and visual patterns",
    },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute top-40 right-10 w-56 h-56 bg-primary/15 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-20 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="flex items-center justify-center mb-6">
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 0.95, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                <div className="glass-strong neural-glow p-4 rounded-2xl">
                  <Brain className="w-12 h-12 text-primary" />
                </div>
                <motion.div
                  animate={{
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="w-6 h-6 text-primary" />
                </motion.div>
              </motion.div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">The Entire History</span>
              <br />
              <span className="text-foreground">of You</span>
            </h1>

            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Search your screenshot history using{" "}
              <span className="text-primary font-semibold">
                natural language queries
              </span>
              . Find any UI element, error message, or visual content instantly
              with AI-powered search.
            </p>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-12">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span>Instant Search</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <span>AI Recognition</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span>Visual Understanding</span>
              </div>
            </div>
          </motion.div>

          {/* Feature Cards */}
          {!hasImages && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid md:grid-cols-3 gap-6 mb-16"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.5 + index * 0.2,
                  }}
                  whileHover={{
                    y: -5,
                    transition: { duration: 0.2 },
                  }}
                  className="glass rounded-2xl p-6 hover:neural-glow transition-all duration-300"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="glass-strong p-3 rounded-xl mb-4 neural-glow">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Call to Action */}
          {!hasImages && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <div className="glass rounded-xl px-6 py-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Ready to get started
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Upload your first screenshot folder below
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
