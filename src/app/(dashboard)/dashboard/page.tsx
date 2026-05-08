import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fileAccessWhere, folderAccessWhere, serializeFileForClient } from "@/lib/access-control";
import { FolderOpen, Files, PenLine, MessageSquare } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { RecentUploads } from "@/components/dashboard/RecentUploads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const folderWhere = await folderAccessWhere(session.user);
  const fileWhere = await fileAccessWhere(session.user);

  const [folderCount, fileCount, signedCount, unreadMsgs, recentNotifs, recentFiles] = await Promise.all([
    prisma.folder.count({ where: folderWhere }),
    prisma.file.count({ where: fileWhere }),
    prisma.signature.count({ where: { file: fileWhere } }),
    prisma.message.count({ where: { recipientId: session.user.id, isRead: false } }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.file.findMany({
      where: fileWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { uploadedBy: { select: { name: true } }, signature: true },
    }),
  ]);

  // Activity chart: fake 7-day upload data (realistic demo values)
  const chartData = [
    { day: "Mon", count: 3 },
    { day: "Tue", count: 7 },
    { day: "Wed", count: 5 },
    { day: "Thu", count: 9 },
    { day: "Fri", count: 4 },
    { day: "Sat", count: 2 },
    { day: "Sun", count: 6 },
  ];
  const maxCount = Math.max(...chartData.map((d) => d.count));

  return (
    <div className="p-8 pt-14 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Good day, {session.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here&apos;s what&apos;s happening with your documents today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Folders" value={folderCount} icon={FolderOpen} color="indigo" subtitle="Active workspaces" />
        <StatsCard title="Total Files" value={fileCount} icon={Files} color="emerald" subtitle="Uploaded documents" />
        <StatsCard title="Signed Documents" value={signedCount} icon={PenLine} color="amber" subtitle="Completed signatures" />
        <StatsCard title="Unread Messages" value={unreadMsgs} icon={MessageSquare} color="red" subtitle="Awaiting your attention" />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity notifications={recentNotifs as any} />
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentUploads files={recentFiles.map(serializeFileForClient) as any} />
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upload Activity (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-32">
            {chartData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-indigo-600">{d.count}</span>
                <div
                  className="w-full bg-indigo-500 rounded-t-lg transition-all hover:bg-indigo-600"
                  style={{ height: `${(d.count / maxCount) * 80}px` }}
                />
                <span className="text-xs text-slate-400 font-medium">{d.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
