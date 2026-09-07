import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReportsDashboard } from "./reports-dashboard";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role;
  if (role !== "MANAGER" && role !== "ADMIN") redirect("/dashboard");

  // Get all goals with check-ins
  const goalsQuery = role === "ADMIN"
    ? {}
    : { user: { managerId: session.user.id } };

  const goals = await prisma.goal.findMany({
    where: goalsQuery,
    include: {
      user: { select: { name: true, email: true, department: true } },
      checkIns: { orderBy: { quarter: "asc" } },
    },
  });

  // Summary stats
  const statusBreakdown = goals.reduce((acc: Record<string, number>, goal) => {
    acc[goal.status] = (acc[goal.status] || 0) + 1;
    return acc;
  }, {});

  // Thrust area breakdown
  const thrustAreaBreakdown = goals.reduce((acc: Record<string, number>, goal) => {
    acc[goal.thrustArea] = (acc[goal.thrustArea] || 0) + 1;
    return acc;
  }, {});

  // Department breakdown
  const departmentBreakdown = goals.reduce((acc: Record<string, number>, goal) => {
    const dept = goal.user.department;
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  // Quarter progress
  const quarterData = ["Q1", "Q2", "Q3", "Q4"].map((q) => {
    const checkIns = goals.flatMap((g) =>
      g.checkIns.filter((ci) => ci.quarter === q)
    );
    const avgProgress =
      checkIns.length > 0
        ? checkIns.reduce((sum, ci) => sum + ci.progressPercent, 0) / checkIns.length
        : 0;
    return {
      quarter: q,
      avgProgress: Math.round(avgProgress * 10) / 10,
      checkInCount: checkIns.length,
    };
  });

  // Flatten goals for CSV export (raw data)
  const goalsForExport = goals.map((g) => ({
    employee: g.user.name,
    email: g.user.email,
    department: g.user.department,
    thrustArea: g.thrustArea,
    title: g.title,
    uom: g.uom,
    target: g.target,
    weightage: g.weightage,
    status: g.status,
  }));

  return (
    <ReportsDashboard
      statusBreakdown={statusBreakdown}
      thrustAreaBreakdown={thrustAreaBreakdown}
      departmentBreakdown={departmentBreakdown}
      quarterData={quarterData}
      totalGoals={goals.length}
      viewerRole={role}
      goalsForExport={goalsForExport}
    />
  );
}
