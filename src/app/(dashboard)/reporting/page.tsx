import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { ReportingView } from "./ReportingView";

export const metadata: Metadata = { title: "Reporting" };

export default function ReportingPage() {
  return (
    <div>
      <Header
        title="Reporting & Analytics"
        subtitle="Performance des fonds et analyse du portefeuille"
      />
      <main className="p-8">
        <ReportingView />
      </main>
    </div>
  );
}
