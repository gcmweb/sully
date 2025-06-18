import { Sidebar } from "@/components/sidebar";
import { ProtectedRoute } from "@/components/protected-route";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:pl-64">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}