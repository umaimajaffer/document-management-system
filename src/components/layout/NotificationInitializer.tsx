"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function NotificationInitializer() {
  const { setNotificationCount } = useAppStore();

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/notifications?count=true");
        if (res.ok) {
          const data = await res.json();
          setNotificationCount(data.unreadCount ?? 0);
        }
      } catch {}
    }
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, [setNotificationCount]);

  return null;
}
