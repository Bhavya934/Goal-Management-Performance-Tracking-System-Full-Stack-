"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Create shared goal ────────────────────────────────────────
export async function createSharedGoal(data: {
  thrustArea: string;
  title: string;
  description: string;
  uom: string;
  target: number;
  assignedUserIds: string[];
  weightage: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const role = session.user.role;
  if (role !== "MANAGER" && role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (data.assignedUserIds.length === 0) {
    return { error: "Select at least one employee" };
  }

  try {
    // Create shared goal
    const sharedGoal = await prisma.sharedGoal.create({
      data: {
        createdById: session.user.id,
        thrustArea: data.thrustArea,
        title: data.title,
        description: data.description,
        uom: data.uom,
        target: data.target,
      },
    });

    // Get active cycle
    const activeCycle = await prisma.goalCycle.findFirst({
      where: { isActive: true },
    });

    // Create individual goals for each assigned user
    for (const userId of data.assignedUserIds) {
      const existingCount = await prisma.goal.count({
        where: { userId, status: { not: "RETURNED" } },
      });

      if (existingCount >= 8) continue;

      await prisma.goal.create({
        data: {
          userId,
          cycleId: activeCycle?.id,
          thrustArea: data.thrustArea,
          title: data.title,
          description: data.description,
          uom: data.uom,
          target: data.target,
          weightage: data.weightage,
          sharedGoalId: sharedGoal.id,
          status: "DRAFT",
          sortOrder: existingCount,
        },
      });
    }

    revalidatePath("/dashboard/shared-goals");
    revalidatePath("/dashboard/goals");
    return { success: true, sharedGoalId: sharedGoal.id };
  } catch {
    return { error: "Failed to create shared goal" };
  }
}

// ─── Get shared goals ──────────────────────────────────────────
export async function getSharedGoals() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.sharedGoal.findMany({
    include: {
      createdBy: { select: { name: true } },
      goals: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Create goal cycle ─────────────────────────────────────────
export async function createGoalCycle(data: {
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "ADMIN") return { error: "Unauthorized" };

  try {
    // If setting as active, deactivate others
    if (data.isActive) {
      await prisma.goalCycle.updateMany({
        data: { isActive: false },
      });
    }

    await prisma.goalCycle.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive,
      },
    });

    revalidatePath("/dashboard/cycles");
    return { success: true };
  } catch {
    return { error: "Failed to create goal cycle" };
  }
}

// ─── Get goal cycles ───────────────────────────────────────────
export async function getGoalCycles() {
  return prisma.goalCycle.findMany({
    include: {
      _count: { select: { goals: true } },
    },
    orderBy: { startDate: "desc" },
  });
}

// ─── Toggle cycle active ───────────────────────────────────────
export async function toggleCycleActive(cycleId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "ADMIN") return { error: "Unauthorized" };

  try {
    const cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) return { error: "Cycle not found" };

    if (!cycle.isActive) {
      // Deactivate all others first
      await prisma.goalCycle.updateMany({ data: { isActive: false } });
    }

    await prisma.goalCycle.update({
      where: { id: cycleId },
      data: { isActive: !cycle.isActive },
    });

    revalidatePath("/dashboard/cycles");
    return { success: true };
  } catch {
    return { error: "Failed to update cycle" };
  }
}

// ─── Unlock goals (admin) ──────────────────────────────────────
export async function unlockUserGoals(userId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "ADMIN") return { error: "Unauthorized" };

  try {
    const result = await prisma.goal.updateMany({
      where: { userId, status: "LOCKED" },
      data: { status: "APPROVED", isLocked: false },
    });

    // Audit log
    const goals = await prisma.goal.findMany({
      where: { userId, status: "APPROVED" },
    });
    for (const goal of goals) {
      await prisma.auditLog.create({
        data: {
          goalId: goal.id,
          userId: session.user.id,
          action: "GOAL_UNLOCKED",
        },
      });
    }

    revalidatePath("/dashboard/unlock");
    revalidatePath("/dashboard/goals");
    return { success: true, count: result.count };
  } catch {
    return { error: "Failed to unlock goals" };
  }
}

// ─── Get audit logs ────────────────────────────────────────────
export async function getAuditLogs(limit = 50) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const role = session.user.role;

  return prisma.auditLog.findMany({
    where: role === "ADMIN" ? {} : { userId: session.user.id },
    include: {
      user: { select: { name: true, role: true } },
      goal: { select: { title: true, userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
