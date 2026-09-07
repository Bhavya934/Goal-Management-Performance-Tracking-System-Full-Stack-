import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UnlockPage } from "./unlock-page";

export default async function UnlockGoals() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const usersWithLockedGoals = await prisma.user.findMany({
    where: {
      goals: { some: { status: "LOCKED" } },
    },
    include: {
      goals: {
        where: { status: "LOCKED" },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return <UnlockPage users={JSON.parse(JSON.stringify(usersWithLockedGoals))} />;
}
