import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "indigo" | "emerald" | "amber" | "red";
  subtitle?: string;
}

const colorMap = {
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", iconBg: "bg-indigo-100", value: "text-indigo-700" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", iconBg: "bg-emerald-100", value: "text-emerald-700" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", iconBg: "bg-amber-100", value: "text-amber-700" },
  red: { bg: "bg-red-50", icon: "text-red-600", iconBg: "bg-red-100", value: "text-red-700" },
};

export function StatsCard({ title, value, icon: Icon, color, subtitle }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={cn("text-3xl font-bold mt-1", c.value)}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", c.iconBg)}>
          <Icon className={cn("w-6 h-6", c.icon)} />
        </div>
      </div>
    </div>
  );
}
