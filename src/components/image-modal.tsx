"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Download,
  FileText,
  Sparkles,
  Check,
  ChevronUp,
  ChevronDown,
  Info,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProcessedImage } from "@/lib/types";

interface ImageModalProps {
  image: ProcessedImage | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageModal({ image, isOpen, onClose }: ImageModalProps) {
  const [copiedText, setCopiedText] = useState<"ocr" | "description" | null>(
    null,
  );
  const [showOverlay, setShowOverlay] = useState(false);

  if (!image) return null;

  const handleCopyText = async (text: string, type: "ocr" | "description") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image.preview;
    link.download = image.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-none !max-h-none !w-screen !h-screen !p-0 overflow-hidden bg-black/95 !border-0 !rounded-none !translate-x-[-50%] !translate-y-[-50%] !top-[50%] !left-[50%]" showCloseButton={false}>
        <DialogTitle className="sr-only">
          {image.file.name}
        </DialogTitle>
        {/* Full screen image */}
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img
            src={image.preview}
            alt={image.file.name}
            className="max-w-full max-h-full object-contain"
            style={{ 
              imageRendering: 'auto',
              maxWidth: 'none',
              maxHeight: 'none',
              width: 'auto',
              height: 'auto'
            }}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              const container = img.parentElement;
              if (container) {
                const containerRect = container.getBoundingClientRect();
                const imgAspectRatio = img.naturalWidth / img.naturalHeight;
                const containerAspectRatio = containerRect.width / containerRect.height;
                
                if (imgAspectRatio > containerAspectRatio) {
                  // Image is wider - fit to width
                  img.style.width = Math.min(img.naturalWidth, containerRect.width * 0.9) + 'px';
                  img.style.height = 'auto';
                } else {
                  // Image is taller - fit to height
                  img.style.height = Math.min(img.naturalHeight, containerRect.height * 0.9) + 'px';
                  img.style.width = 'auto';
                }
              }
            }}
          />

          {/* Top controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="secondary"
              size="icon"
              onClick={onClose}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Collapsible overlay */}
          <AnimatePresence>
            {showOverlay && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t max-h-[50vh] overflow-y-auto"
              >
                <div className="p-6 space-y-4">
                  {/* File info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{image.file.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>Size: {formatFileSize(image.file.size)}</span>
                        <span>Type: {image.file.type}</span>
                        <span>Uploaded: {image.uploaded_at.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowOverlay(false)}
                      className="hover:bg-muted"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Extracted Text */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Extracted Text
                      </h4>
                      {image.ocr_text && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyText(image.ocr_text, "ocr")}
                        >
                          {copiedText === "ocr" ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-base max-h-40 overflow-y-auto">
                      {image.ocr_text ? (
                        <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                          {image.ocr_text}
                        </pre>
                      ) : (
                        <span className="text-muted-foreground italic">No text found</span>
                      )}
                    </div>
                  </div>

                  {/* AI Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Description
                      </h4>
                      {image.image_description && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyText(image.image_description, "description")}
                        >
                          {copiedText === "description" ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-base max-h-40 overflow-y-auto">
                      {image.image_description ? (
                        <div className="leading-relaxed">
                          {image.image_description}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">No description available</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle overlay button */}
          {!showOverlay && (
            <motion.button
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              onClick={() => setShowOverlay(true)}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 text-sm transition-colors"
            >
              <Info className="w-4 h-4" />
              Show Details
              <ChevronUp className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}