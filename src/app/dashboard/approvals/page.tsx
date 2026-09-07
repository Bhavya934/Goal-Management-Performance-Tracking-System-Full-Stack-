import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingApprovals } from "@/lib/actions/approval-actions";
import { ApprovalsList } from "./approvals-list";

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role;
  if (role !== "MANAGER" && role !== "ADMIN") {
    redirect("/dashboard");
  }

  const pendingGoals = await getPendingApprovals();

  // Group by user
  const groupedByUser = pendingGoals.reduce((acc: Record<string, any>, goal: any) => {
    const userId = goal.user.id;
    if (!acc[userId]) {
      acc[userId] = {
        user: goal.user,
        goals: [],
        totalWeightage: 0,
      };
    }
    acc[userId].goals.push(goal);
    acc[userId].totalWeightage += goal.weightage;
    return acc;
  }, {});

  return (
    <ApprovalsList
      groupedApprovals={JSON.parse(JSON.stringify(Object.values(groupedByUser)))}
      reviewerRole={role}
    />
  );
}
