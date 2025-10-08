"use client";

import { useState, useEffect } from "react";

interface UploadPreviewProps {
  file: File;
}

export default function UploadPreview({ file }: UploadPreviewProps) {
  const [preview, setPreview] = useState<string | null>(null);

  // Create preview URL when file changes
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [file]);

  if (!preview) {
    return (
      <div className="flex items-center justify-center p-4 border border-white/10 rounded-lg bg-neutral-800/50">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
        <span className="ml-2 text-sm text-gray-300">Loading preview...</span>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 border border-white/10 rounded-lg bg-neutral-800/50">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <img
            src={preview}
            alt="Upload preview"
            className="w-16 h-16 object-cover rounded-lg border border-white/10"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{file.name}</p>
          <p className="text-xs text-gray-400">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
