"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, FolderOpen, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FolderCard } from "@/components/folders/FolderCard";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { canManageFolders, isAdmin } from "@/lib/permissions";
import toast from "react-hot-toast";
import type { FolderWithCounts } from "@/types";

export default function FoldersPage() {
  const { data: session } = useSession();
  const [folders, setFolders] = useState<FolderWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  const canEdit = canManageFolders(session?.user?.role ?? "");
  const canDelete = isAdmin(session?.user?.role ?? "");

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/folders");
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  async function createFolder() {
    if (!newFolderName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName }),
      });
      if (!res.ok) throw new Error();
      toast.success("Folder created");
      setCreateOpen(false);
      setNewFolderName("");
      fetchFolders();
    } catch { toast.error("Failed to create folder"); }
    finally { setCreating(false); }
  }

  return (
    <div className="p-8 pt-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Folders</h1>
          <p className="text-sm text-slate-500 mt-0.5">{folders.length} folder{folders.length !== 1 ? "s" : ""} available</p>
        </div>
        {canEdit && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> New Folder
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : folders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No folders yet</h3>
          <p className="text-slate-400 text-sm mt-1 mb-4">Create your first folder to start organizing documents.</p>
          {canEdit && <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" /> Create Folder</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              canEdit={canEdit}
              canDelete={canDelete}
              onRefresh={fetchFolders}
            />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Choose a name for your new folder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label>Folder name</Label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFolder()}
              placeholder="e.g. Legal Documents"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createFolder} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
