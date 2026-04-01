import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { CompanyDetail } from "./CompanyDetail";

export const metadata: Metadata = { title: "Détail Participation" };

export default function CompanyPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <Header title="Participation" subtitle="Suivi détaillé et valorisation" />
      <main className="p-8">
        <CompanyDetail id={params.id} />
      </main>
    </div>
  );
}
