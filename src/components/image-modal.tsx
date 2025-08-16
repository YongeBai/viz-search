"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Download,
  Eye,
  FileText,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [imageLoaded, setImageLoaded] = useState(false);

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

  const getStatusColor = (status: ProcessedImage["processing_status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "processing":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: ProcessedImage["processing_status"]) => {
    switch (status) {
      case "completed":
        return "Analysis Complete";
      case "processing":
        return "Analyzing...";
      case "error":
        return "Analysis Failed";
      default:
        return "Pending Analysis";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Left Side - Image */}
          <div className="flex-1 relative bg-black/5 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!imageLoaded && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Skeleton className="w-full h-full" />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.img
              src={image.preview}
              alt="Screenshot preview"
              className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: imageLoaded ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />

            {/* Image Controls */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="bg-black/20 backdrop-blur-sm hover:bg-black/30 text-white border-white/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            {/* Processing Status */}
            <div className="absolute top-4 right-4">
              <Badge
                variant="secondary"
                className="bg-black/20 backdrop-blur-sm text-white border-white/20"
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(image.processing_status)}`}
                />
                {getStatusText(image.processing_status)}
                {image.processing_status === "processing" && (
                  <Loader2 className="w-3 h-3 ml-2 animate-spin" />
                )}
              </Badge>
            </div>
          </div>

          {/* Right Side - Metadata */}
          <div className="w-96 border-l bg-background flex flex-col">
            {/* Header */}
            <DialogHeader className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold truncate">
                  {image.file.name}
                </DialogTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* File Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Eye className="w-4 h-4" />
                  File Information
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{formatFileSize(image.file.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{image.file.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uploaded:</span>
                    <span>{image.uploaded_at.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* OCR Text */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="w-4 h-4" />
                    Extracted Text
                  </div>
                  {image.ocr_text && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyText(image.ocr_text, "ocr")}
                      disabled={copiedText === "ocr"}
                    >
                      {copiedText === "ocr" ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  {image.processing_status === "processing" ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Extracting text from image...
                    </div>
                  ) : image.processing_status === "error" ? (
                    <div className="text-red-500">
                      {image.error_message || "Failed to extract text"}
                    </div>
                  ) : image.ocr_text ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="whitespace-pre-wrap"
                    >
                      {image.ocr_text}
                    </motion.p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No text found in this image
                    </p>
                  )}
                </div>
              </div>

              {/* Visual Description */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    AI Description
                  </div>
                  {image.image_description && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopyText(image.image_description, "description")
                      }
                      disabled={copiedText === "description"}
                    >
                      {copiedText === "description" ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  {image.processing_status === "processing" ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating visual description...
                    </div>
                  ) : image.processing_status === "error" ? (
                    <div className="text-red-500">
                      {image.error_message || "Failed to generate description"}
                    </div>
                  ) : image.image_description ? (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {image.image_description}
                    </motion.p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No description available
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground text-center">
                Analysis powered by Google Gemini AI
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
