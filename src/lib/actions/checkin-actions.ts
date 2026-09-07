"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculateProgress } from "@/lib/progress";
import { isCheckInAllowed } from "@/lib/quarterly-windows";

// ─── Submit a check-in ──────────────────────────────────────────
export async function submitCheckIn(data: {
  goalId: string;
  quarter: string;
  achievement: number;
  status: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Enforce quarterly window
  const windowCheck = isCheckInAllowed(data.quarter, session.user.role);
  if (!windowCheck.allowed) {
    return { error: windowCheck.message };
  }

  const goal = await prisma.goal.findUnique({
    where: { id: data.goalId },
  });

  if (!goal) return { error: "Goal not found" };
  if (goal.userId !== session.user.id) return { error: "Unauthorized" };
  if (!["APPROVED", "LOCKED"].includes(goal.status)) {
    return { error: "Can only check-in on approved/locked goals" };
  }

  const progressPercent = calculateProgress(goal.uom, goal.target, data.achievement);

  try {
    // Upsert check-in (create or update)
    const existing = await prisma.checkIn.findUnique({
      where: { goalId_quarter: { goalId: data.goalId, quarter: data.quarter } },
    });

    let checkIn;
    if (existing) {
      checkIn = await prisma.checkIn.update({
        where: { id: existing.id },
        data: {
          achievement: data.achievement,
          status: data.status,
          progressPercent,
          notes: data.notes,
        },
      });
    } else {
      checkIn = await prisma.checkIn.create({
        data: {
          goalId: data.goalId,
          userId: session.user.id,
          quarter: data.quarter,
          achievement: data.achievement,
          status: data.status,
          progressPercent,
          notes: data.notes,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        goalId: data.goalId,
        userId: session.user.id,
        action: existing ? "CHECKIN_UPDATED" : "CHECKIN_CREATED",
        field: "achievement",
        newValue: `${data.achievement} (${progressPercent.toFixed(1)}%)`,
      },
    });

    revalidatePath("/dashboard/check-ins");
    revalidatePath("/dashboard/goals");
    return { success: true, progressPercent };
  } catch {
    return { error: "Failed to submit check-in" };
  }
}

// ─── Get user's check-in data ───────────────────────────────────
export async function getUserCheckIns() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.goal.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["APPROVED", "LOCKED"] },
    },
    include: {
      checkIns: {
        orderBy: { quarter: "asc" },
        include: {
          comments: {
            include: { user: { select: { name: true, role: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
}

// ─── Add comment to check-in ───────────────────────────────────
export async function addCheckInComment(checkInId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!content || content.trim().length === 0) {
    return { error: "Comment cannot be empty" };
  }

  try {
    await prisma.checkInComment.create({
      data: {
        checkInId,
        userId: session.user.id,
        content: content.trim(),
      },
    });

    revalidatePath("/dashboard/check-ins");
    return { success: true };
  } catch {
    return { error: "Failed to add comment" };
  }
}
