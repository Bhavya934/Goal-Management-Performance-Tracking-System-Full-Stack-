import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSharedGoals } from "@/lib/actions/admin-actions";
import { SharedGoalsPage } from "./shared-goals-page";

export default async function SharedGoals() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  
  const role = session.user.role;
  if (role !== "MANAGER" && role !== "ADMIN") redirect("/dashboard");

  const sharedGoals = await getSharedGoals();

  // Get employees for assignment
  const employees = await prisma.user.findMany({
    where: role === "ADMIN"
      ? { role: "EMPLOYEE" }
      : { managerId: session.user.id },
    select: { id: true, name: true, email: true, department: true },
    orderBy: { name: "asc" },
  });

  return (
    <SharedGoalsPage
      sharedGoals={JSON.parse(JSON.stringify(sharedGoals))}
      employees={employees}
    />
  );
}
