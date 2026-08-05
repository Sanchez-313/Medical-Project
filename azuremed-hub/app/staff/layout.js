import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StaffSidebar from "@/components/StaffSidebar";

export const metadata = {
  title: "Staff Dashboard | AzureMed Hub",
  robots: { index: false, follow: false },
};

export default async function StaffLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["owner", "staff"].includes(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <StaffSidebar userName={session.user.name} />
      {/* ml-64 matches the sidebar's fixed width — a `fixed` element is out
          of document flow entirely, unlike `sticky`, so content underneath
          needs this margin or it slides under the sidebar. */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
