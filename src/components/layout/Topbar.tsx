"use client";

import { Search, Bell, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  const labelMap: Record<string, string> = {
    dashboard: "Dashboard",
    folders: "Folders",
    documents: "Documents",
    messages: "Messages",
    notifications: "Notifications",
    admin: "Admin",
    users: "Users",
  };

  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    const label = labelMap[seg] ?? (seg.length > 16 ? seg.slice(0, 14) + "…" : seg);
    crumbs.push({ label, href: path });
  }
  return crumbs;
}

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarOpen, notificationCount } = useAppStore();
  const crumbs = getBreadcrumbs(pathname);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-20 h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 transition-all duration-300",
        sidebarOpen ? "left-60" : "left-16"
      )}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm flex-1 min-w-0">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 flex-shrink-0">
          <Home className="w-4 h-4" />
        </Link>
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-slate-800 truncate">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-slate-500 hover:text-slate-700 truncate">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-4 h-8 w-48 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Notification bell */}
        <Link
          href="/notifications"
          className="relative w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {session?.user?.name?.[0] ?? "U"}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-slate-800 leading-none">{session?.user?.name}</div>
                <div className="text-xs text-slate-400 mt-0.5 capitalize">{session?.user?.email?.split("@")[0]}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium text-slate-900">{session?.user?.name}</div>
              <div className="text-xs text-slate-500 font-normal mt-0.5">{session?.user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
