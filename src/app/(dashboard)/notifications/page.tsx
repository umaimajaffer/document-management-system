"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Loader2, Info, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { NotificationData } from "@/types";

const typeConfig = {
  success: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  reminder: { icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
};

function groupByDate(notifications: NotificationData[]): Record<string, NotificationData[]> {
  const groups: Record<string, NotificationData[]> = {};
  notifications.forEach((n) => {
    const date = new Date(n.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    if (!groups[date]) groups[date] = [];
    groups[date].push(n);
  });
  return groups;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const { resetNotificationCount } = useAppStore();

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifs();
    resetNotificationCount();
  }, [fetchNotifs, resetNotificationCount]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }

  async function markAllRead() {
    setMarking(true);
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setMarking(false);
    toast.success("All notifications marked as read");
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const groups = groupByDate(notifications);

  return (
    <div className="p-8 pt-14 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={marking}>
            {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">All caught up!</h3>
          <p className="text-slate-400 text-sm mt-1">No notifications to show.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{date}</div>
              <div className="space-y-2">
                {items.map((n) => {
                  const cfg = typeConfig[n.type as keyof typeof typeConfig] ?? typeConfig.info;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && markRead(n.id)}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border transition-all",
                        n.isRead
                          ? "bg-white border-slate-100 opacity-70"
                          : "bg-white border-slate-200 shadow-sm cursor-pointer hover:shadow-md",
                      )}
                    >
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
                        <Icon className={cn("w-4.5 h-4.5 w-[18px] h-[18px]", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm font-semibold", n.isRead ? "text-slate-500" : "text-slate-900")}>{n.title}</p>
                          <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5 leading-snug">{n.body}</p>
                      </div>
                      {!n.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
