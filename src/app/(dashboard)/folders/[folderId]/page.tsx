"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, FolderOpen, Upload, Files, Loader2, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FolderCard } from "@/components/folders/FolderCard";
import { FileCard } from "@/components/folders/FileCard";
import { UploadDropzone } from "@/components/folders/UploadDropzone";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { canManageFolders, isAdmin, canRenameFiles, canDeleteFiles, canCopyFiles, canMoveFiles, canUploadFiles } from "@/lib/permissions";
import toast from "react-hot-toast";
import type { FolderWithCounts, FileWithRelations } from "@/types";

interface FolderDetail extends FolderWithCounts {
  children: FolderWithCounts[];
  files: FileWithRelations[];
  parent?: { id: string; name: string } | null;
}

export default function FolderDetailPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const { data: session } = useSession();
  const [folder, setFolder] = useState<FolderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  const role = session?.user?.role ?? "";
  const canEdit = canManageFolders(role);
  const canDel = isAdmin(role);
  const canUpload = canUploadFiles(role);

  const fetchFolder = useCallback(async () => {
    try {
      const res = await fetch(`/api/folders/${folderId}`);
      if (res.ok) {
        const data = await res.json();
        setFolder(data.folder);
      }
    } finally { setLoading(false); }
  }, [folderId]);

  useEffect(() => { fetchFolder(); }, [fetchFolder]);

  async function createSubfolder() {
    if (!newFolderName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName, parentId: folderId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Subfolder created");
      setCreateOpen(false);
      setNewFolderName("");
      fetchFolder();
    } catch { toast.error("Failed to create subfolder"); }
    finally { setCreating(false); }
  }

  if (loading) {
    return (
      <div className="p-8 pt-14 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="p-8 pt-14 text-center py-20">
        <h3 className="text-lg font-semibold text-slate-700">Folder not found</h3>
        <Link href="/folders" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">← Back to folders</Link>
      </div>
    );
  }

  return (
    <div className="p-8 pt-14">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm mb-6">
        <Link href="/folders" className="text-slate-500 hover:text-indigo-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Folders
        </Link>
        {folder.parent && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link href={`/folders/${folder.parent.id}`} className="text-slate-500 hover:text-indigo-600">{folder.parent.name}</Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="font-medium text-slate-800">{folder.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{folder.name}</h1>
            <p className="text-sm text-slate-500">{folder.files.length} files · {folder.children.length} subfolders</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" /> New Subfolder
            </Button>
          )}
          {canUpload && (
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="w-4 h-4" /> Upload File
            </Button>
          )}
        </div>
      </div>

      {/* Subfolders */}
      {folder.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Subfolders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folder.children.map((child) => (
              <FolderCard key={child.id} folder={child} canEdit={canEdit} canDelete={canDel} onRefresh={fetchFolder} />
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Files</h2>
        {folder.files.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Files className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">No files yet</h3>
            <p className="text-sm text-slate-400 mt-1 mb-4">Upload your first document to this folder.</p>
            {canUpload && (
              <Button onClick={() => setUploadOpen(true)}><Upload className="w-4 h-4" /> Upload File</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folder.files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                canRename={canRenameFiles(role)}
                canDelete={canDeleteFiles(role)}
                canCopy={canCopyFiles(role)}
                canMove={canMoveFiles(role)}
                onRefresh={fetchFolder}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create subfolder dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Subfolder</DialogTitle>
            <DialogDescription>Create a new subfolder inside &quot;{folder.name}&quot;.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label>Folder name</Label>
            <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createSubfolder()} placeholder="e.g. Contracts 2024" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createSubfolder} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>Upload a document to &quot;{folder.name}&quot;.</DialogDescription>
          </DialogHeader>
          <UploadDropzone folderId={folderId} onUploadComplete={() => { setUploadOpen(false); fetchFolder(); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
