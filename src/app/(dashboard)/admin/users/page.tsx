"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Users, Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight, Shield, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import type { UserData } from "@/types";

function RoleBadge({ role }: { role: string }) {
  if (role === "ADMIN") return <Badge variant="admin" className="gap-1"><Shield className="w-3 h-3" />Admin</Badge>;
  if (role === "ADVANCED_USER") return <Badge variant="advanced" className="gap-1"><Zap className="w-3 h-3" />Advanced</Badge>;
  return <Badge variant="normal" className="gap-1"><Lock className="w-3 h-3" />Normal User</Badge>;
}

interface UserFormData {
  name: string; email: string; password: string; role: string;
}

const EMPTY_FORM: UserFormData = { name: "", email: "", password: "", role: "NORMAL_USER" };

export default function UserManagementPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState<UserData | null>(null);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const isAdmin = session?.user?.role === "ADMIN";

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function openCreate() {
    setEditUser(null);
    setForm({ ...EMPTY_FORM, role: isAdmin ? "ADVANCED_USER" : "NORMAL_USER" });
    setFormOpen(true);
  }

  function openEdit(user: UserData) {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.email) { toast.error("Name and email required"); return; }
    if (!editUser && !form.password) { toast.error("Password required for new users"); return; }
    setSaving(true);
    try {
      const url = editUser ? `/api/users/${editUser.id}` : "/api/users";
      const method = editUser ? "PATCH" : "POST";
      const body: Record<string, string> = { name: form.name, email: form.email, role: form.role };
      if (form.password) body.password = form.password;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed");
      }
      toast.success(editUser ? "User updated" : "User created");
      setFormOpen(false);
      fetchUsers();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleToggleActive(user: UserData) {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    if (res.ok) {
      toast.success(user.isActive ? "User deactivated" : "User activated");
      fetchUsers();
    }
  }

  async function handleDelete(user: UserData) {
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("User deleted");
      setDeleteOpen(null);
      fetchUsers();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Failed to delete");
    }
  }

  return (
    <div className="p-8 pt-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} users registered</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add User</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">User</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Joined</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden xl:table-cell">Files</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <button onClick={() => handleToggleActive(user)} className="flex items-center gap-1.5 text-sm">
                      {user.isActive
                        ? <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-emerald-600 text-xs font-medium">Active</span></>
                        : <><ToggleLeft className="w-5 h-5 text-slate-400" /><span className="text-slate-400 text-xs">Inactive</span></>}
                    </button>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-sm text-slate-500">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4 hidden xl:table-cell text-sm text-slate-500">{user._count?.uploadedFiles ?? 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(user)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>{editUser ? "Update user details below." : "Create a new user account."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Full Name</Label><Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" /></div>
            <div><Label>Email Address</Label><Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" /></div>
            <div><Label>{editUser ? "New Password (leave blank to keep)" : "Password"}</Label><Input className="mt-1" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL_USER">Normal User</SelectItem>
                  {isAdmin && <SelectItem value="ADVANCED_USER">Advanced User</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editUser ? "Update" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>Are you sure you want to delete {deleteOpen?.name}? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteOpen && handleDelete(deleteOpen)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
