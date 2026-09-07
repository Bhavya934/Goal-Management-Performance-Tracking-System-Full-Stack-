"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
// Using string literals for status since SQLite doesn't support enums

// ─── Create a single goal ───────────────────────────────────────
export async function createGoal(data: {
  thrustArea: string;
  title: string;
  description: string;
  uom: string;
  target: number;
  weightage: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Validate
  const parsed = goalSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Check max 8 goals
  const existingCount = await prisma.goal.count({
    where: { userId: session.user.id, status: { not: "RETURNED" } },
  });

  if (existingCount >= 8) {
    return { error: "Maximum 8 goals allowed" };
  }

  // Get active cycle
  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true },
  });

  try {
    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        cycleId: activeCycle?.id,
        thrustArea: parsed.data.thrustArea,
        title: parsed.data.title,
        description: parsed.data.description,
        uom: parsed.data.uom as any,
        target: parsed.data.target,
        weightage: parsed.data.weightage,
        status: "DRAFT",
        sortOrder: existingCount,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        goalId: goal.id,
        userId: session.user.id,
        action: "GOAL_CREATED",
        newValue: JSON.stringify(parsed.data),
      },
    });

    revalidatePath("/dashboard/goals");
    return { success: true, goalId: goal.id };
  } catch (error) {
    return { error: "Failed to create goal" };
  }
}

// ─── Create multiple goals at once ──────────────────────────────
export async function createGoalsBatch(
  goals: Array<{
    thrustArea: string;
    title: string;
    description: string;
    uom: string;
    target: number;
    weightage: number;
  }>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Validate total weightage
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  if (Math.abs(totalWeightage - 100) > 0.01) {
    return { error: `Total weightage must be exactly 100%. Current: ${totalWeightage}%` };
  }

  if (goals.length > 8) {
    return { error: "Maximum 8 goals allowed" };
  }

  if (goals.some((g) => g.weightage < 10)) {
    return { error: "Each goal must have at least 10% weightage" };
  }

  // Check existing non-returned goals
  const existingCount = await prisma.goal.count({
    where: { userId: session.user.id, status: { not: "RETURNED" } },
  });

  if (existingCount + goals.length > 8) {
    return { error: `You can add ${8 - existingCount} more goals (max 8 total)` };
  }

  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true },
  });

  try {
    const createdGoals = [];
    for (let i = 0; i < goals.length; i++) {
      const parsed = goalSchema.safeParse(goals[i]);
      if (!parsed.success) {
        return { error: `Goal ${i + 1}: ${parsed.error.issues[0].message}` };
      }

      const goal = await prisma.goal.create({
        data: {
          userId: session.user.id,
          cycleId: activeCycle?.id,
          thrustArea: parsed.data.thrustArea,
          title: parsed.data.title,
          description: parsed.data.description,
          uom: parsed.data.uom as any,
          target: parsed.data.target,
          weightage: parsed.data.weightage,
          status: "DRAFT",
          sortOrder: existingCount + i,
        },
      });

      await prisma.auditLog.create({
        data: {
          goalId: goal.id,
          userId: session.user.id,
          action: "GOAL_CREATED",
          newValue: JSON.stringify(parsed.data),
        },
      });

      createdGoals.push(goal);
    }

    revalidatePath("/dashboard/goals");
    return { success: true, count: createdGoals.length };
  } catch (error) {
    return { error: "Failed to create goals" };
  }
}

// ─── Submit goals for approval ──────────────────────────────────
export async function submitGoalsForApproval() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Get all draft goals
  const draftGoals = await prisma.goal.findMany({
    where: { userId: session.user.id, status: "DRAFT" },
  });

  if (draftGoals.length === 0) {
    return { error: "No draft goals to submit" };
  }

  // Validate total weightage of all active goals
  const allGoals = await prisma.goal.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["DRAFT", "APPROVED", "LOCKED", "PENDING_APPROVAL"] },
    },
  });

  const totalWeightage = allGoals.reduce((sum, g) => sum + g.weightage, 0);
  if (Math.abs(totalWeightage - 100) > 0.01) {
    return { error: `Total weightage must be exactly 100%. Current: ${totalWeightage}%` };
  }

  try {
    // Get manager
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { managerId: true },
    });

    if (!user?.managerId) {
      return { error: "No manager assigned. Contact admin." };
    }

    // Update all draft goals to pending
    await prisma.goal.updateMany({
      where: { userId: session.user.id, status: "DRAFT" },
      data: { status: "PENDING_APPROVAL" },
    });

    // Create approval entries
    for (const goal of draftGoals) {
      await prisma.goalApproval.create({
        data: {
          goalId: goal.id,
          reviewedById: user.managerId,
          action: "PENDING",
        },
      });

      await prisma.auditLog.create({
        data: {
          goalId: goal.id,
          userId: session.user.id,
          action: "SUBMITTED_FOR_APPROVAL",
        },
      });
    }

    revalidatePath("/dashboard/goals");
    revalidatePath("/dashboard/approvals");
    return { success: true };
  } catch (error) {
    return { error: "Failed to submit goals for approval" };
  }
}

// ─── Update a goal (only if DRAFT or RETURNED) ─────────────────
export async function updateGoal(
  goalId: string,
  data: {
    thrustArea?: string;
    title?: string;
    description?: string;
    uom?: string;
    target?: number;
    weightage?: number;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    return { error: "Goal not found" };
  }

  if (goal.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  if (!["DRAFT", "RETURNED"].includes(goal.status)) {
    return { error: "Goal can only be edited when in Draft or Returned status" };
  }

  try {
    // Log changes for audit
    const changes: string[] = [];
    if (data.title && data.title !== goal.title) changes.push(`title: ${goal.title} → ${data.title}`);
    if (data.weightage && data.weightage !== goal.weightage) changes.push(`weightage: ${goal.weightage} → ${data.weightage}`);

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...data,
        uom: data.uom as any,
        status: "DRAFT", // Reset to draft if returned
      },
    });

    if (changes.length > 0) {
      await prisma.auditLog.create({
        data: {
          goalId: goalId,
          userId: session.user.id,
          action: "GOAL_UPDATED",
          field: "multiple",
          oldValue: changes.join("; "),
          newValue: JSON.stringify(data),
        },
      });
    }

    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update goal" };
  }
}

// ─── Delete a goal (only if DRAFT) ─────────────────────────────
export async function deleteGoal(goalId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    return { error: "Goal not found" };
  }

  if (goal.userId !== session.user.id && session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (goal.status !== "DRAFT" && session.user.role !== "ADMIN") {
    return { error: "Only draft goals can be deleted" };
  }

  try {
    await prisma.goal.delete({
      where: { id: goalId },
    });

    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete goal" };
  }
}

// ─── Get user's goals ───────────────────────────────────────────
export async function getUserGoals() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return prisma.goal.findMany({
    where: { userId: session.user.id },
    include: {
      approvals: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      sharedGoal: true,
      checkIns: {
        orderBy: { quarter: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
}
