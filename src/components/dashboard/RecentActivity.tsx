import { Bell, CheckCircle, AlertTriangle, Info, Clock } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { NotificationData } from "@/types";
import { cn } from "@/lib/utils";

const typeConfig = {
  success: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  reminder: { icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
};

export function RecentActivity({ notifications }: { notifications: NotificationData[] }) {
  if (!notifications.length) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">No recent activity</div>
    );
  }
  return (
    <div className="space-y-3">
      {notifications.map((n) => {
        const cfg = typeConfig[n.type as keyof typeof typeConfig] ?? typeConfig.info;
        const Icon = cfg.icon;
        return (
          <div key={n.id} className={cn("flex items-start gap-3 p-3 rounded-xl transition-colors", n.isRead ? "bg-slate-50" : "bg-white border border-slate-100")}>
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", cfg.bg)}>
              <Icon className={cn("w-4 h-4", cfg.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{n.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</p>
            </div>
            {!n.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}
