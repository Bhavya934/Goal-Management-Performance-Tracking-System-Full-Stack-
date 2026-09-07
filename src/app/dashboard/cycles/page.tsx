import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGoalCycles } from "@/lib/actions/admin-actions";
import { CyclesPage } from "./cycles-page";

export default async function GoalCycles() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const cycles = await getGoalCycles();

  return <CyclesPage cycles={JSON.parse(JSON.stringify(cycles))} />;
}
