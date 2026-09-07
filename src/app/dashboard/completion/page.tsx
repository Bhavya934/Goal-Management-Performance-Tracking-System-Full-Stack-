import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CompletionDashboard } from "./completion-dashboard";

export default async function CompletionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role;
  if (role !== "ADMIN") redirect("/dashboard");

  // Fetch all users with their goals and check-ins
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    include: {
      goals: {
        include: {
          checkIns: { orderBy: { quarter: "asc" } },
          approvals: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      manager: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  // Compute per-employee stats
  const employeeStats = employees.map((emp) => {
    const totalGoals = emp.goals.length;
    const approvedGoals = emp.goals.filter(
      (g) => g.status === "APPROVED" || g.status === "LOCKED"
    ).length;
    const draftGoals = emp.goals.filter((g) => g.status === "DRAFT").length;
    const pendingGoals = emp.goals.filter(
      (g) => g.status === "PENDING_APPROVAL"
    ).length;
    const returnedGoals = emp.goals.filter(
      (g) => g.status === "RETURNED"
    ).length;

    const totalWeightage = emp.goals.reduce((s, g) => s + g.weightage, 0);

    // Check-in completion per quarter
    const quarters = ["Q1", "Q2", "Q3", "Q4"];
    const checkInCompletion = quarters.map((q) => {
      const approvedOrLockedGoals = emp.goals.filter(
        (g) => g.status === "APPROVED" || g.status === "LOCKED"
      );
      const submitted = approvedOrLockedGoals.filter((g) =>
        g.checkIns.some((ci) => ci.quarter === q)
      ).length;
      return {
        quarter: q,
        submitted,
        total: approvedOrLockedGoals.length,
        rate: approvedOrLockedGoals.length > 0
          ? Math.round((submitted / approvedOrLockedGoals.length) * 100)
          : 0,
      };
    });

    // Average progress across latest check-ins
    const latestCheckIns = emp.goals
      .flatMap((g) => g.checkIns)
      .filter((ci) => ci.progressPercent > 0);
    const avgProgress =
      latestCheckIns.length > 0
        ? Math.round(
            (latestCheckIns.reduce((s, ci) => s + ci.progressPercent, 0) /
              latestCheckIns.length) *
              10
          ) / 10
        : 0;

    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      manager: emp.manager?.name || "—",
      totalGoals,
      approvedGoals,
      draftGoals,
      pendingGoals,
      returnedGoals,
      totalWeightage,
      goalSettingComplete: totalWeightage === 100 && draftGoals === 0 && returnedGoals === 0,
      checkInCompletion,
      avgProgress,
    };
  });

  // Org-level stats
  const totalEmployees = employees.length;
  const goalSettingDone = employeeStats.filter((e) => e.goalSettingComplete).length;
  const allGoalsCount = employees.flatMap((e) => e.goals).length;
  const allApproved = employees
    .flatMap((e) => e.goals)
    .filter((g) => g.status === "APPROVED" || g.status === "LOCKED").length;

  // Department-level aggregation
  const deptMap: Record<
    string,
    {
      employees: number;
      goalsDone: number;
      totalGoals: number;
      avgProgress: number;
      progressCount: number;
    }
  > = {};
  employeeStats.forEach((e) => {
    if (!deptMap[e.department])
      deptMap[e.department] = {
        employees: 0,
        goalsDone: 0,
        totalGoals: 0,
        avgProgress: 0,
        progressCount: 0,
      };
    deptMap[e.department].employees++;
    if (e.goalSettingComplete) deptMap[e.department].goalsDone++;
    deptMap[e.department].totalGoals += e.totalGoals;
    if (e.avgProgress > 0) {
      deptMap[e.department].avgProgress += e.avgProgress;
      deptMap[e.department].progressCount++;
    }
  });
  const departmentStats = Object.entries(deptMap).map(([dept, data]) => ({
    department: dept,
    employees: data.employees,
    goalSettingComplete: data.goalsDone,
    completionRate: Math.round((data.goalsDone / data.employees) * 100),
    totalGoals: data.totalGoals,
    avgProgress:
      data.progressCount > 0
        ? Math.round((data.avgProgress / data.progressCount) * 10) / 10
        : 0,
  }));

  return (
    <CompletionDashboard
      employeeStats={employeeStats}
      departmentStats={departmentStats}
      orgStats={{
        totalEmployees,
        goalSettingDone,
        goalSettingRate: totalEmployees > 0 ? Math.round((goalSettingDone / totalEmployees) * 100) : 0,
        totalGoals: allGoalsCount,
        approvedGoals: allApproved,
      }}
    />
  );
}
