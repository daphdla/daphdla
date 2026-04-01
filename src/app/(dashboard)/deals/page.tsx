import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { DealsView } from "./DealsView";

export const metadata: Metadata = { title: "Deal Flow" };

export default function DealsPage() {
  return (
    <div>
      <Header
        title="Deal Flow"
        subtitle="Pipeline d'opportunités d'investissement"
      />
      <main className="p-8">
        <DealsView />
      </main>
    </div>
  );
}
