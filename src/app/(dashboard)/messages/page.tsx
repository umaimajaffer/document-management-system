"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, Send, Loader2, Phone, Mail, MessageCircle, Plus, Inbox,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { timeAgo, formatDate } from "@/lib/utils";
import { canSendMessages } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { MessageData, UserData } from "@/types";

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === "simulated_sms") return <Phone className="w-3.5 h-3.5 text-emerald-600" />;
  if (channel === "simulated_email") return <Mail className="w-3.5 h-3.5 text-blue-600" />;
  return <MessageCircle className="w-3.5 h-3.5 text-indigo-600" />;
}

function ChannelBadge({ channel }: { channel: string }) {
  if (channel === "simulated_sms") return <Badge variant="success" className="text-[10px] gap-1"><Phone className="w-2.5 h-2.5" />SMS</Badge>;
  if (channel === "simulated_email") return <Badge className="text-[10px] gap-1 bg-blue-100 text-blue-700"><Mail className="w-2.5 h-2.5" />Email</Badge>;
  return <Badge variant="secondary" className="text-[10px] gap-1"><MessageCircle className="w-2.5 h-2.5" />In-App</Badge>;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [users, setUsers] = useState<Pick<UserData, "id" | "name" | "email">[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<MessageData | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ recipientId: "", subject: "", body: "", channel: "in_app" });

  const canSend = canSendMessages(session?.user?.role ?? "");

  const fetchMessages = useCallback(async () => {
    const res = await fetch("/api/messages");
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers(d.users ?? []));
  }, [fetchMessages]);

  async function handleSend() {
    if (!form.recipientId || !form.subject || !form.body) {
      toast.error("Please fill in all fields");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: form.recipientId,
          subject: form.subject,
          body: form.body,
          channel: form.channel,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (data.simulatedMeta?.simulatedChannel === "sms") {
        toast.success(`SMS sent to ${data.simulatedMeta.phone} (simulated)`);
      } else if (data.simulatedMeta?.simulatedChannel === "email") {
        toast.success(`Email sent to ${data.simulatedMeta.email} (simulated)`);
      } else {
        toast.success("Message sent successfully");
      }

      setComposeOpen(false);
      setForm({ recipientId: "", subject: "", body: "", channel: "in_app" });
      fetchMessages();
    } catch { toast.error("Failed to send message"); }
    finally { setSending(false); }
  }

  async function openMessage(msg: MessageData) {
    setSelectedMsg(msg);
    if (!msg.isRead && msg.recipientId === session?.user?.id) {
      await fetch(`/api/messages/${msg.id}`, { method: "PATCH" });
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isRead: true } : m));
    }
  }

  const inbox = messages.filter((m) => m.recipientId === session?.user?.id || m.recipientId === "all");
  const sent = messages.filter((m) => m.senderId === session?.user?.id);

  return (
    <div className="p-8 pt-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500 mt-0.5">{inbox.filter((m) => !m.isRead).length} unread</p>
        </div>
        {canSend && (
          <Button onClick={() => setComposeOpen(true)}>
            <Plus className="w-4 h-4" /> Compose
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Message list */}
        <div className="xl:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Inbox</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            </div>
          ) : inbox.length === 0 ? (
            <div className="text-center py-10">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {inbox.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => openMessage(msg)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors",
                    selectedMsg?.id === msg.id && "bg-indigo-50",
                    !msg.isRead && "bg-blue-50/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={cn("text-sm truncate", !msg.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-600")}>
                      {msg.sender?.name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <ChannelIcon channel={msg.channel} />
                      {!msg.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}
                    </div>
                  </div>
                  <p className={cn("text-xs truncate", !msg.isRead ? "text-slate-700" : "text-slate-500")}>{msg.subject}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{timeAgo(msg.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message detail */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          {selectedMsg ? (
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{selectedMsg.subject}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-500">From <span className="font-medium text-slate-700">{selectedMsg.sender?.name}</span></span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-400">{formatDate(selectedMsg.createdAt)}</span>
                    <ChannelBadge channel={selectedMsg.channel} />
                  </div>
                </div>
              </div>
              {(selectedMsg.channel === "simulated_sms" || selectedMsg.channel === "simulated_email") && (
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border mb-4 text-sm",
                  selectedMsg.channel === "simulated_sms"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-blue-50 border-blue-200 text-blue-700"
                )}>
                  {selectedMsg.channel === "simulated_sms" ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                  {selectedMsg.channel === "simulated_sms"
                    ? "This was sent as a simulated SMS to +1 (555) 000-0000"
                    : "This was sent as a simulated email to recipient@demo.com"}
                </div>
              )}
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedMsg.body}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center px-8">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Select a message</p>
              <p className="text-slate-400 text-sm mt-1">Choose a message from the inbox to read it here</p>
              {canSend && (
                <Button className="mt-4" onClick={() => setComposeOpen(true)}>
                  <Plus className="w-4 h-4" /> Compose New Message
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>Send a message to a team member via any channel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>To</Label>
              <Select value={form.recipientId} onValueChange={(v) => setForm({ ...form, recipientId: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select recipient..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone (Broadcast)</SelectItem>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input className="mt-1" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Message subject..." />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea className="mt-1 h-28" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write your message..." />
            </div>
            <div>
              <Label>Send via</Label>
              <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app"><span className="flex items-center gap-2"><MessageCircle className="w-3.5 h-3.5" /> In-App Message</span></SelectItem>
                  <SelectItem value="simulated_email"><span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Simulated Email</span></SelectItem>
                  <SelectItem value="simulated_sms"><span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Simulated SMS</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
