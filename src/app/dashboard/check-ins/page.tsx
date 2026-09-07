import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckInsDashboard } from "./checkins-dashboard";
import { getQuarterlyWindows, serializeWindows } from "@/lib/quarterly-windows";

export default async function CheckInsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const role = session.user.role;

  // Get user's approved/locked goals with check-ins
  const goals = await prisma.goal.findMany({
    where: {
      userId,
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

  // Get quarterly window info
  const windowResult = getQuarterlyWindows();
  const serializedWindows = serializeWindows(windowResult.allWindows);

  // Determine current quarter from active window
  const currentQuarter = windowResult.activeWindow?.quarter || (() => {
    const month = new Date().getMonth();
    if (month >= 3 && month <= 5) return "Q1";
    if (month >= 6 && month <= 8) return "Q2";
    if (month >= 9 && month <= 11) return "Q3";
    return "Q4";
  })();

  return (
    <CheckInsDashboard
      goals={JSON.parse(JSON.stringify(goals))}
      currentQuarter={currentQuarter}
      userRole={role}
      windowStatus={windowResult.statusMessage}
      windows={serializedWindows}
    />
  );
}
