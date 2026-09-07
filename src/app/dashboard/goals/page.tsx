import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoalsList } from "./goals-list";

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    include: {
      approvals: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { reviewedBy: { select: { name: true } } },
      },
      sharedGoal: true,
      checkIns: { orderBy: { quarter: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });

  const totalWeightage = goals
    .filter((g) => g.status !== "RETURNED")
    .reduce((sum, g) => sum + g.weightage, 0);

  return (
    <GoalsList
      goals={JSON.parse(JSON.stringify(goals))}
      totalWeightage={totalWeightage}
      userRole={session.user.role}
    />
  );
}
