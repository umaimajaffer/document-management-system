"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, Loader2, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  folderId?: string;
  onUploadComplete: () => void;
}

export function UploadDropzone({ folderId, onUploadComplete }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    if (folderId) formData.append("folderId", folderId);

    setUploading(true);
    setProgress(20);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 85));
    }, 200);

    try {
      const res = await fetch("/api/files", { method: "POST", body: formData });
      clearInterval(progressInterval);
      setProgress(100);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Upload failed");
      }
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        onUploadComplete();
        toast.success(`"${file.name}" uploaded successfully`);
      }, 400);
    } catch (e: any) {
      clearInterval(progressInterval);
      setUploading(false);
      setProgress(0);
      toast.error(e.message ?? "Upload failed");
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
        dragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/30"
      )}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
        onChange={handleChange}
      />

      {uploading ? (
        <div className="space-y-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
            {progress < 100 ? <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" /> : <CheckCircle className="w-5 h-5 text-emerald-600" />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">{progress < 100 ? "Uploading..." : "Complete!"}</p>
            <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden w-48 mx-auto">
              <div
                className={cn("h-full rounded-full transition-all duration-300", progress < 100 ? "bg-indigo-500" : "bg-emerald-500")}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Drop a file here, or <span className="text-indigo-600">click to browse</span></p>
            <p className="text-xs text-slate-400 mt-1">PDF, Word, Images · Max 10MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
