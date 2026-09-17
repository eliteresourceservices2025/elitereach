import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar isAdmin={session.isAdmin} />
      <div className="flex flex-1 flex-col">
        <Header email={session.email} isAdmin={session.isAdmin} />
        <main className="flex-1 bg-elite-bg p-6">{children}</main>
      </div>
    </div>
  );
}
