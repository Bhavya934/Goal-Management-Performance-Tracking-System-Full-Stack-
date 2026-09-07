import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TeamDashboard } from "./team-dashboard";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role;
  if (role !== "MANAGER" && role !== "ADMIN") redirect("/dashboard");

  // Get team members
  const teamMembers = await prisma.user.findMany({
    where: role === "ADMIN" 
      ? { role: "EMPLOYEE" } 
      : { managerId: session.user.id },
    include: {
      goals: {
        include: {
          checkIns: { orderBy: { quarter: "asc" } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <TeamDashboard 
      teamMembers={JSON.parse(JSON.stringify(teamMembers))} 
      viewerRole={role}
    />
  );
}
