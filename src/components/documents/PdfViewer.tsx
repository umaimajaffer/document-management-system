"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  fileUrl: string;
}

export function PdfViewer({ fileUrl }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [width, setWidth] = useState(680);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError() {
    setError(true);
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center">
      {/* Toolbar */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm mb-4">
        <Button variant="ghost" size="icon" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-slate-600 min-w-[80px] text-center">
          {loading ? "..." : `Page ${pageNumber} of ${numPages}`}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <Button variant="ghost" size="icon" onClick={() => setWidth((w) => Math.min(900, w + 80))}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setWidth((w) => Math.max(400, w - 80))}>
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Document */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center p-12 text-center" style={{ width }}>
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">Cannot preview this file</p>
            <p className="text-slate-400 text-sm mt-1">
              This is a demo PDF placeholder.{" "}
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                Download to view
              </a>
            </p>
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center p-12" style={{ width }}>
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={width}
              renderAnnotationLayer
              renderTextLayer
            />
          </Document>
        )}
      </div>
    </div>
  );
}
