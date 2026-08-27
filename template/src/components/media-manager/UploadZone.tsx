"use client";

import React, { useRef, useState, useCallback } from "react";
import { getBaseUrl } from "@/src/lib/config";
import { Upload, FileUp, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/src/ui/progress";
import { cn } from "@/src/lib/utils";
import { toast } from "@/src/hooks/use-toast";

interface UploadZoneProps {
  onUploadComplete: () => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (files: File[]) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });
    setUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const response = await fetch(`${getBaseUrl()}/api/media/upload`, {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      if (!response.ok) throw new Error();

      toast({
        title: "Success",
        description: "Media uploaded successfully",
      });
      onUploadComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to upload ${files[0].name}`,
        variant: "destructive",
      });
    } finally {
      clearInterval(interval);
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) uploadFile(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) uploadFile(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="border-b bg-muted/20">
      <div
        className={cn(
          "max-w-7xl mx-auto px-4 py-6 transition-all duration-200",
          isDragging && "scale-[0.99]",
        )}
      >
        <div
          className={cn(
            "relative rounded-2xl border-2 border-dashed transition-all cursor-pointer",
            "hover:border-primary/50 hover:bg-accent/30",
            isDragging && "border-primary bg-primary/5 scale-[1.01]",
            uploading && "pointer-events-none opacity-70",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="flex flex-col items-center justify-center gap-3 py-12 px-4">
            {uploading ? (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <FileUp className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center space-y-2 max-w-md">
                  <p className="font-medium">Uploading...</p>
                  <Progress value={progress} className="w-64" />
                  <p className="text-xs text-muted-foreground">{progress}%</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium">
                    {isDragging
                      ? "Drop to upload"
                      : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports images, videos, documents - up to 100MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
