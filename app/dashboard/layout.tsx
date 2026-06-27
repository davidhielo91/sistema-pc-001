import { getUser } from "@/lib/dal";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <div className="dashboard-layout">
      <Sidebar nombre={user?.nombre ?? ""} rol={user?.rol ?? ""} />
      <main className="main-content">{children}</main>
    </div>
  );
}
