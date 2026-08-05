import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/AdminSidebar";

export const metadata = {
  title: "Owner Dashboard | AzureMed Hub",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "owner") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <AdminSidebar userName={session.user.name} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
