import { requireAuth } from "@/lib/api-helpers";
import { NewsView } from "./NewsView";

export const metadata = { title: "Actualités PE/VC/LBO" };

export default async function NewsPage() {
  await requireAuth();
  return <NewsView />;
}
