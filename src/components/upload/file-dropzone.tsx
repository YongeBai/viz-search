"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection, FileError } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FolderOpen, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { UploadProgress } from "@/lib/types";

// Extend InputHTMLAttributes to include webkitdirectory
interface ExtendedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
}

interface FileDropzoneProps {
  onFilesUploaded: (files: File[]) => void;
  uploadProgress: UploadProgress | null;
}

export function FileDropzone({
  onFilesUploaded,
  uploadProgress,
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFileRejections: FileRejection[]) => {
      if (acceptedFiles.length > 0) {
        onFilesUploaded(acceptedFiles);
        setRejectedFiles([]);
      }

      if (rejectedFileRejections.length > 0) {
        const rejected = rejectedFileRejections.map(
          (rejection) =>
            `${rejection.file.name}: ${rejection.errors.map((e: FileError) => e.message).join(", ")}`,
        );
        setRejectedFiles(rejected);
        // Clear rejected files after 5 seconds
        setTimeout(() => setRejectedFiles([]), 5000);
      }
    },
    [onFilesUploaded],
  );

  const { getRootProps, getInputProps, isDragAccept, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"],
      },
      multiple: true,
      onDragEnter: () => setIsDragActive(true),
      onDragLeave: () => setIsDragActive(false),
      onDropAccepted: () => setIsDragActive(false),
      onDropRejected: () => setIsDragActive(false),
      maxSize: 50 * 1024 * 1024, // 50MB per file
      noClick: true, // Disable click to prevent conflict with folder button
    });

  const getDropzoneStyles = () => {
    const baseClasses =
      "border-2 border-dashed rounded-2xl transition-all duration-500 cursor-pointer backdrop-blur-sm";

    if (isDragAccept) {
      return `${baseClasses} border-green-500 bg-green-500/10 neural-glow shadow-2xl scale-[1.02]`;
    }
    if (isDragReject) {
      return `${baseClasses} border-red-500 bg-red-500/10 shadow-2xl`;
    }
    if (isDragActive) {
      return `${baseClasses} border-primary bg-primary/10 neural-glow shadow-2xl scale-[1.02]`;
    }
    return `${baseClasses} glass border-glass-border hover:border-primary hover:neural-glow hover:scale-[1.01]`;
  };

  // Handle folder upload via hidden input
  const handleFolderUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length > 0) {
        onFilesUploaded(imageFiles);
        setRejectedFiles([]); // Clear any previous errors
      } else if (files.length > 0) {
        setRejectedFiles(["No valid image files found in the selected folder"]);
        setTimeout(() => setRejectedFiles([]), 5000);
      }

      // Reset input
      event.target.value = "";
    },
    [onFilesUploaded],
  );

  if (uploadProgress) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-2xl p-12 text-center neural-glow-strong"
      >
        <div className="space-y-8">
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <div className="glass p-6 rounded-2xl neural-glow animate-pulse-glow">
                <FileImage className="w-16 h-16 text-primary" />
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-2 -right-2"
              >
                <div className="w-4 h-4 bg-primary rounded-full" />
              </motion.div>
            </motion.div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold gradient-text">
              Processing Images
            </h3>
            <p className="text-lg text-muted-foreground">
              Analyzing {uploadProgress.current_file || "images"} with AI...
            </p>

            <div className="space-y-3">
              <Progress
                value={uploadProgress.percentage}
                className="w-full h-3"
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {uploadProgress.completed} of {uploadProgress.total} images
                </span>
                <span className="text-primary font-semibold">
                  {uploadProgress.percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div {...getRootProps()} className={getDropzoneStyles()}>
        <input {...getInputProps()} />

        <div className="p-16 text-center">
          <AnimatePresence mode="wait">
            {isDragActive ? (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className="space-y-6"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 0.5 }}
                  className="flex justify-center"
                >
                  <div className="glass-strong p-6 rounded-2xl neural-glow-strong">
                    <FolderOpen className="w-20 h-20 text-primary mx-auto" />
                  </div>
                </motion.div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold gradient-text">
                    Drop your folder here
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    Release to upload all images from the folder
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex justify-center"
                >
                  <div className="glass p-6 rounded-2xl neural-glow">
                    <FolderOpen className="w-20 h-20 text-primary mx-auto animate-float" />
                  </div>
                </motion.div>

                <div className="space-y-4">
                  <h3 className="text-3xl font-bold gradient-text">
                    Upload Your Screenshots
                  </h3>
                  <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                    Drag and drop a folder containing images here, or click to
                    select a folder from your computer
                  </p>
                </div>

                <div className="flex justify-center">
                  <div>
                    <input
                      {...({
                        type: "file",
                        id: "folder-upload",
                        multiple: true,
                        webkitdirectory: "",
                        onChange: handleFolderUpload,
                        className: "hidden",
                        accept: "image/*",
                      } as ExtendedInputProps)}
                    />
                    <Button
                      size="lg"
                      onClick={() =>
                        document.getElementById("folder-upload")?.click()
                      }
                      className="min-w-[240px] h-14 text-lg font-semibold neural-glow hover:neural-glow-strong transition-all duration-300"
                    >
                      <FolderOpen className="w-6 h-6 mr-3" />
                      Choose Folder
                    </Button>
                  </div>
                </div>

                <div className="glass rounded-xl px-6 py-3 text-sm text-muted-foreground inline-block">
                  Supports PNG, JPG, GIF, BMP, WebP, SVG • Max 50MB per file
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error Messages */}
      <AnimatePresence>
        {rejectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {rejectedFiles.map((error, index) => (
              <Badge key={index} variant="destructive" className="block p-2">
                {error}
              </Badge>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
