import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { DashboardOverview } from "./DashboardOverview";

export const metadata: Metadata = { title: "Vue d'ensemble" };

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <Header
        title="Vue d'ensemble"
        subtitle={`Bienvenue, ${session?.user.name}`}
      />
      <main className="p-8">
        <DashboardOverview />
      </main>
    </div>
  );
}
