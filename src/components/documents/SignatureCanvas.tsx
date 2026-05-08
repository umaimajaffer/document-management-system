"use client";

import { useRef, useState } from "react";
import SignatureCanvasLib from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle, PenLine, Loader2, Eraser } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import type { SignatureData } from "@/types";

interface SignatureCanvasProps {
  fileId: string;
  signature: SignatureData | null;
  onSigned: () => void;
}

export function SignatureCanvas({ fileId, signature, onSigned }: SignatureCanvasProps) {
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const sigRef = useRef<SignatureCanvasLib>(null);

  async function handleSave() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Please draw your signature first");
      return;
    }
    setSaving(true);
    try {
      const signatureData = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      const res = await fetch("/api/signatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, signatureData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save signature");
      }
      toast.success("Document signed successfully!");
      setOpen(false);
      onSigned();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (signature) {
    return (
      <>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Signed by {signature.signedBy?.name}</span>
            <span className="text-xs text-emerald-500">· {formatDate(signature.signedAt)}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setViewOpen(true)}>
            View Signature
          </Button>
        </div>

        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Signature</DialogTitle>
              <DialogDescription>Signed by {signature.signedBy?.name} on {formatDate(signature.signedAt)}</DialogDescription>
            </DialogHeader>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signature.signatureData} alt="Signature" className="max-w-full mx-auto" />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <PenLine className="w-4 h-4" /> Sign Document
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Sign Document</DialogTitle>
            <DialogDescription>Draw your signature in the box below. Use your mouse or touch screen.</DialogDescription>
          </DialogHeader>

          <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <SignatureCanvasLib
              ref={sigRef}
              penColor="#1e293b"
              canvasProps={{
                width: 520,
                height: 180,
                className: "w-full",
                style: { background: "#fff" },
              }}
            />
          </div>
          <p className="text-xs text-slate-400 text-center -mt-1">Draw your signature above</p>

          <DialogFooter>
            <Button variant="outline" onClick={() => sigRef.current?.clear()}>
              <Eraser className="w-4 h-4" /> Clear
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Signature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
