import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { LPDashboard } from "./LPDashboard";

export const metadata: Metadata = { title: "Portail LP" };

export default async function LPPortalPage() {
  const session = await auth();

  // Only LPs can access this page
  if (session?.user.role !== "LP") {
    redirect("/dashboard");
  }

  return (
    <div>
      <Header
        title="Mon Portail LP"
        subtitle="Vue consolidée de votre investissement"
      />
      <main className="p-8">
        <LPDashboard />
      </main>
    </div>
  );
}
