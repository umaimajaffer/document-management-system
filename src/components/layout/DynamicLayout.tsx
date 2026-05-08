"use client";

import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

export function DynamicLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useAppStore();
  return (
    <div
      className={cn(
        "transition-all duration-300 pt-16 min-h-screen flex flex-col",
        sidebarOpen ? "ml-60" : "ml-16"
      )}
    >
      {children}
    </div>
  );
}
