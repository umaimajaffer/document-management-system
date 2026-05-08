"use client";

import { useState } from "react";
import { FileText, Image, File, MoreHorizontal, Pencil, Trash2, Copy, Move, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import type { FileWithRelations } from "@/types";

interface FileCardProps {
  file: FileWithRelations;
  canRename: boolean;
  canDelete: boolean;
  canCopy: boolean;
  canMove: boolean;
  onRefresh: () => void;
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/pdf") return <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6 text-red-600" /></div>;
  if (mimeType.includes("word")) return <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6 text-blue-600" /></div>;
  if (mimeType.startsWith("image/")) return <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center"><Image className="w-6 h-6 text-emerald-600" /></div>;
  return <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center"><File className="w-6 h-6 text-slate-600" /></div>;
}

export function FileCard({ file, canRename, canDelete, canCopy, canMove, onRefresh }: FileCardProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [loading, setLoading] = useState(false);

  async function handleRename() {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error();
      toast.success("File renamed");
      setRenameOpen(false);
      onRefresh();
    } catch { toast.error("Failed to rename file"); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("File deleted");
      setDeleteOpen(false);
      onRefresh();
    } catch { toast.error("Failed to delete file"); }
    finally { setLoading(false); }
  }

  async function handleCopy() {
    try {
      await fetch(`/api/files/${file.id}/copy`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetFolderId: file.folderId }) });
      toast.success("File copied");
      onRefresh();
    } catch { toast.error("Failed to copy file"); }
  }

  const hasActions = canRename || canDelete || canCopy || canMove;

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/documents/${file.id}`} className="flex items-start gap-3 flex-1 min-w-0">
              <FileTypeIcon mimeType={file.mimeType} />
              <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                  {file.name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">{formatBytes(file.size)}</p>
                {file.signature && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span className="text-[10px] text-emerald-600 font-medium">Signed</span>
                  </div>
                )}
              </div>
            </Link>

            {hasActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canRename && (
                    <DropdownMenuItem onClick={() => { setNewName(file.name); setRenameOpen(true); }}>
                      <Pencil className="w-4 h-4 mr-2" /> Rename
                    </DropdownMenuItem>
                  )}
                  {canCopy && (
                    <DropdownMenuItem onClick={handleCopy}>
                      <Copy className="w-4 h-4 mr-2" /> Copy
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">{file.uploadedBy?.name ?? "Unknown"}</span>
            <span className="text-xs text-slate-400">{formatDate(file.createdAt)}</span>
          </div>
        </div>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>Enter a new name for this file.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label>File name</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRename()} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={handleRename} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>Are you sure you want to delete &quot;{file.name}&quot;? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
