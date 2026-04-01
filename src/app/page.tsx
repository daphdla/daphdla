import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Route LP users to their portal, others to main dashboard
  if (session.user.role === "LP") {
    redirect("/lp-portal");
  }

  redirect("/dashboard");
}
