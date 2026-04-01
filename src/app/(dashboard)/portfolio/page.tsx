import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { PortfolioView } from "./PortfolioView";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <div>
      <Header
        title="Portfolio"
        subtitle="Suivi des participations et valorisations"
      />
      <main className="p-8">
        <PortfolioView />
      </main>
    </div>
  );
}
