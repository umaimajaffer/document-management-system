import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { DemoModeBanner } from "@/components/layout/DemoModeBanner";
import { NotificationInitializer } from "@/components/layout/NotificationInitializer";
import { DynamicLayout } from "@/components/layout/DynamicLayout";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Topbar />
      <NotificationInitializer />
      <DynamicLayout>
        <DemoModeBanner />
        {children}
      </DynamicLayout>
    </div>
  );
}
