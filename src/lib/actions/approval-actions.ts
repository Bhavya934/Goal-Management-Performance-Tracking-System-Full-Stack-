"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Get pending approvals for manager ─────────────────────────
export async function getPendingApprovals() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const role = session.user.role;

  if (role === "ADMIN") {
    // Admin sees all pending approvals
    return prisma.goal.findMany({
      where: { status: "PENDING_APPROVAL" },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        approvals: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ userId: "asc" }, { sortOrder: "asc" }],
    });
  }

  if (role === "MANAGER") {
    // Manager sees their team's pending goals
    return prisma.goal.findMany({
      where: {
        user: { managerId: session.user.id },
        status: "PENDING_APPROVAL",
      },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        approvals: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ userId: "asc" }, { sortOrder: "asc" }],
    });
  }

  return [];
}

// ─── Approve a goal ────────────────────────────────────────────
export async function approveGoal(goalId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const role = session.user.role;
  if (role !== "MANAGER" && role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { user: true },
  });

  if (!goal) return { error: "Goal not found" };
  if (goal.status !== "PENDING_APPROVAL") return { error: "Goal is not pending approval" };

  // Verify manager relationship (unless admin)
  if (role === "MANAGER" && goal.user.managerId !== session.user.id) {
    return { error: "You are not the manager of this employee" };
  }

  try {
    await prisma.$transaction([
      prisma.goal.update({
        where: { id: goalId },
        data: { status: "APPROVED" },
      }),
      prisma.goalApproval.create({
        data: {
          goalId,
          reviewedById: session.user.id,
          action: "APPROVED",
        },
      }),
      prisma.auditLog.create({
        data: {
          goalId,
          userId: session.user.id,
          action: "GOAL_APPROVED",
        },
      }),
    ]);

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch {
    return { error: "Failed to approve goal" };
  }
}

// ─── Approve ALL goals for a user ──────────────────────────────
export async function approveAllGoalsForUser(userId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const role = session.user.role;
  if (role !== "MANAGER" && role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const goals = await prisma.goal.findMany({
    where: {
      userId,
      status: "PENDING_APPROVAL",
    },
  });

  if (goals.length === 0) return { error: "No pending goals found" };

  // Verify total weightage
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  if (Math.abs(totalWeightage - 100) > 0.01) {
    return { error: `Total weightage is ${totalWeightage}%, must be 100%` };
  }

  try {
    for (const goal of goals) {
      await prisma.$transaction([
        prisma.goal.update({
          where: { id: goal.id },
          data: { status: "APPROVED" },
        }),
        prisma.goalApproval.create({
          data: {
            goalId: goal.id,
            reviewedById: session.user.id,
            action: "APPROVED",
          },
        }),
        prisma.auditLog.create({
          data: {
            goalId: goal.id,
            userId: session.user.id,
            action: "GOAL_APPROVED",
          },
        }),
      ]);
    }

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/goals");
    return { success: true, count: goals.length };
  } catch {
    return { error: "Failed to approve goals" };
  }
}

// ─── Return a goal with comment ────────────────────────────────
export async function returnGoal(goalId: string, comment: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const role = session.user.role;
  if (role !== "MANAGER" && role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (!comment || comment.trim().length === 0) {
    return { error: "Comment is required when returning a goal" };
  }

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { user: true },
  });

  if (!goal) return { error: "Goal not found" };
  if (goal.status !== "PENDING_APPROVAL") return { error: "Goal is not pending approval" };

  if (role === "MANAGER" && goal.user.managerId !== session.user.id) {
    return { error: "You are not the manager of this employee" };
  }

  try {
    await prisma.$transaction([
      prisma.goal.update({
        where: { id: goalId },
        data: { status: "RETURNED" },
      }),
      prisma.goalApproval.create({
        data: {
          goalId,
          reviewedById: session.user.id,
          action: "RETURNED",
          comment: comment.trim(),
        },
      }),
      prisma.auditLog.create({
        data: {
          goalId,
          userId: session.user.id,
          action: "GOAL_RETURNED",
          field: "comment",
          newValue: comment.trim(),
        },
      }),
    ]);

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch {
    return { error: "Failed to return goal" };
  }
}

// ─── Inline edit goal as manager ───────────────────────────────
export async function managerEditGoal(
  goalId: string,
  data: {
    title?: string;
    description?: string;
    target?: number;
    weightage?: number;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const role = session.user.role;
  if (role !== "MANAGER" && role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { user: true },
  });

  if (!goal) return { error: "Goal not found" };
  if (goal.status !== "PENDING_APPROVAL") return { error: "Can only edit pending goals" };

  try {
    const changes: string[] = [];
    if (data.title && data.title !== goal.title)
      changes.push(`title: ${goal.title} → ${data.title}`);
    if (data.target && data.target !== goal.target)
      changes.push(`target: ${goal.target} → ${data.target}`);
    if (data.weightage && data.weightage !== goal.weightage)
      changes.push(`weightage: ${goal.weightage} → ${data.weightage}`);

    await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.target && { target: data.target }),
        ...(data.weightage && { weightage: data.weightage }),
      },
    });

    if (changes.length > 0) {
      await prisma.auditLog.create({
        data: {
          goalId,
          userId: session.user.id,
          action: "MANAGER_EDITED",
          field: "multiple",
          oldValue: changes.join("; "),
        },
      });
    }

    revalidatePath("/dashboard/approvals");
    return { success: true };
  } catch {
    return { error: "Failed to edit goal" };
  }
}

// ─── Lock approved goals (admin action) ────────────────────────
export async function lockGoals(userId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    return { error: "Unauthorized" };
  }

  try {
    const result = await prisma.goal.updateMany({
      where: {
        userId,
        status: "APPROVED",
      },
      data: {
        status: "LOCKED",
        isLocked: true,
      },
    });

    // Create audit logs for each locked goal
    const lockedGoals = await prisma.goal.findMany({
      where: { userId, status: "LOCKED" },
    });
    for (const goal of lockedGoals) {
      await prisma.auditLog.create({
        data: {
          goalId: goal.id,
          userId: session.user.id,
          action: "GOAL_LOCKED",
        },
      });
    }

    revalidatePath("/dashboard/goals");
    revalidatePath("/dashboard/approvals");
    return { success: true, count: result.count };
  } catch {
    return { error: "Failed to lock goals" };
  }
}
