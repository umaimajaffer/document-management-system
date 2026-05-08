"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderOpen, MessageSquare, Bell,
  Users, Settings, FileText, ChevronLeft, ChevronRight,
  Shield, LogOut
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/folders", icon: FolderOpen, label: "Folders" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

const ADMIN_ITEMS = [
  { href: "/admin/users", icon: Users, label: "User Management" },
];

function getRoleVariant(role: string): "admin" | "advanced" | "normal" {
  if (role === "ADMIN") return "admin";
  if (role === "ADVANCED_USER") return "advanced";
  return "normal";
}
function getRoleLabel(role: string): string {
  if (role === "ADMIN") return "Admin";
  if (role === "ADVANCED_USER") return "Advanced";
  return "User";
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarOpen, toggleSidebar, notificationCount } = useAppStore();

  const canManageUsers = session?.user?.role === "ADMIN" || session?.user?.role === "ADVANCED_USER";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 h-full bg-slate-900 flex flex-col transition-all duration-300 shadow-xl",
        sidebarOpen ? "w-60" : "w-16"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center h-16 px-4 border-b border-slate-700/50", sidebarOpen ? "justify-between" : "justify-center")}>
        {sidebarOpen && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">DocuPOC</span>
          </div>
        )}
        {!sidebarOpen && (
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors",
            !sidebarOpen && "hidden"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Expand button when collapsed */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="mt-2 mx-auto w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto sidebar-scroll space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isNotif = item.href === "/notifications";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                active
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0 w-[18px] h-[18px]" />
              {sidebarOpen && <span>{item.label}</span>}
              {isNotif && notificationCount > 0 && (
                <span className={cn(
                  "flex items-center justify-center rounded-full text-xs font-bold",
                  sidebarOpen
                    ? "ml-auto w-5 h-5 bg-red-500 text-white"
                    : "absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px]"
                )}>
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
              {!sidebarOpen && (
                <span className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}

        {canManageUsers && (
          <>
            {sidebarOpen && (
              <div className="px-3 pt-4 pb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Administration</span>
              </div>
            )}
            {!sidebarOpen && <div className="border-t border-slate-700/50 my-2" />}
            {ADMIN_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                  {!sidebarOpen && (
                    <span className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className={cn("border-t border-slate-700/50 p-3", !sidebarOpen && "flex justify-center")}>
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {session?.user?.name?.[0] ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{session?.user?.name}</div>
              <Badge variant={getRoleVariant(session?.user?.role ?? "")} className="mt-0.5 text-[10px] py-0">
                {getRoleLabel(session?.user?.role ?? "")}
              </Badge>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-7 h-7 rounded-lg hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold"
            title={session?.user?.name ?? "User"}
          >
            {session?.user?.name?.[0] ?? "U"}
          </button>
        )}
      </div>
    </aside>
  );
}
