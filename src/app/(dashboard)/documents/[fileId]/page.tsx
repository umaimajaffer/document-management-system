"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, FileText, Image, File, Loader2, Download, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignatureCanvas } from "@/components/documents/SignatureCanvas";
import { formatBytes, formatDate } from "@/lib/utils";
import type { FileWithRelations } from "@/types";

const PdfViewer = dynamic(
  () => import("@/components/documents/PdfViewer").then((mod) => mod.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    ),
  }
);

function FileTypeIcon({ mimeType, size = "md" }: { mimeType: string; size?: "md" | "lg" }) {
  const s = size === "lg" ? "w-14 h-14" : "w-10 h-10";
  const i = size === "lg" ? "w-7 h-7" : "w-5 h-5";
  if (mimeType === "application/pdf") return <div className={`${s} bg-red-50 rounded-xl flex items-center justify-center`}><FileText className={`${i} text-red-600`} /></div>;
  if (mimeType.includes("word")) return <div className={`${s} bg-blue-50 rounded-xl flex items-center justify-center`}><FileText className={`${i} text-blue-600`} /></div>;
  if (mimeType.startsWith("image/")) return <div className={`${s} bg-emerald-50 rounded-xl flex items-center justify-center`}><Image className={`${i} text-emerald-600`} /></div>;
  return <div className={`${s} bg-slate-50 rounded-xl flex items-center justify-center`}><File className={`${i} text-slate-600`} /></div>;
}

function getMimeLabel(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF Document";
  if (mimeType.includes("word")) return "Word Document";
  if (mimeType.startsWith("image/")) return "Image";
  return "Document";
}

export default function DocumentPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const [file, setFile] = useState<FileWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFile = useCallback(async () => {
    const res = await fetch(`/api/files/${fileId}`);
    if (res.ok) {
      const data = await res.json();
      setFile(data.file);
    }
    setLoading(false);
  }, [fileId]);

  useEffect(() => { fetchFile(); }, [fetchFile]);

  if (loading) {
    return (
      <div className="p-8 pt-14 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!file) {
    return (
      <div className="p-8 pt-14 text-center py-20">
        <h3 className="text-lg font-semibold text-slate-700">File not found</h3>
      </div>
    );
  }

  const isPdf = file.mimeType === "application/pdf";
  const isImage = file.mimeType.startsWith("image/");

  return (
    <div className="p-8 pt-14">
      {/* Back link */}
      <div className="mb-6">
        {(file as any).folder ? (
          <Link href={`/folders/${(file as any).folder.id}`} className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <FolderOpen className="w-3.5 h-3.5" />
            {(file as any).folder.name}
          </Link>
        ) : (
          <Link href="/folders" className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Folders
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sidebar info */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col items-center text-center gap-3">
              <FileTypeIcon mimeType={file.mimeType} size="lg" />
              <div>
                <h2 className="font-semibold text-slate-900 text-sm leading-snug">{file.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{getMimeLabel(file.mimeType)}</p>
              </div>
              {file.signature && <Badge variant="success">Signed</Badge>}
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Size</span>
                <span className="font-medium text-slate-800">{formatBytes(file.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Uploaded</span>
                <span className="font-medium text-slate-800">{formatDate(file.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">By</span>
                <span className="font-medium text-slate-800 truncate ml-2">{file.uploadedBy?.name}</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <a href={file.path} download={file.name} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="w-4 h-4" /> Download
                </Button>
              </a>
            </div>
          </div>

          {/* Signature section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Document Signing</h3>
            <SignatureCanvas
              fileId={file.id}
              signature={(file.signature as any) ?? null}
              onSigned={fetchFile}
            />
          </div>
        </div>

        {/* Main viewer */}
        <div className="xl:col-span-3">
          <div className="bg-slate-100 rounded-xl p-4 min-h-96 flex items-start justify-center">
            {isPdf ? (
              <PdfViewer fileUrl={file.path} />
            ) : isImage ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.path} alt={file.name} className="max-w-full max-h-[70vh] object-contain" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FileTypeIcon mimeType={file.mimeType} size="lg" />
                <p className="text-slate-600 font-medium mt-4">Preview not available</p>
                <p className="text-slate-400 text-sm mt-1">Download the file to view its contents</p>
                <a href={file.path} download={file.name} className="mt-3">
                  <Button><Download className="w-4 h-4" /> Download</Button>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
