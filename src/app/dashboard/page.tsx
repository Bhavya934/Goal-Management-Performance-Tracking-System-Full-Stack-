import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Clock, CheckCircle2, AlertCircle, Users } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role;
  const userId = session?.user?.id;

  // Fetch stats based on role
  const goalCount = await prisma.goal.count({
    where: role === "ADMIN" ? {} : { userId: userId },
  });

  const approvedGoals = await prisma.goal.count({
    where: {
      ...(role === "ADMIN" ? {} : { userId: userId }),
      status: { in: ["APPROVED", "LOCKED"] },
    },
  });

  const pendingGoals = await prisma.goal.count({
    where: role === "MANAGER"
      ? {
          user: { managerId: userId },
          status: "PENDING_APPROVAL",
        }
      : {
          ...(role === "ADMIN" ? {} : { userId: userId }),
          status: "PENDING_APPROVAL",
        },
  });

  const completedCheckIns = await prisma.checkIn.count({
    where: {
      ...(role === "ADMIN" ? {} : { userId: userId }),
      status: "COMPLETED",
    },
  });

  const greeting = getGreeting();

  const stats = [
    {
      title: "Total Goals",
      value: goalCount,
      icon: Target,
      description: role === "ADMIN" ? "Across organization" : "Your goals",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Approved",
      value: approvedGoals,
      icon: CheckCircle2,
      description: "Active & locked",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: role === "MANAGER" ? "Pending Review" : "Pending Approval",
      value: pendingGoals,
      icon: Clock,
      description: role === "MANAGER" ? "Team goals awaiting" : "Awaiting manager",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      title: "Completed Check-ins",
      value: completedCheckIns,
      icon: TrendingUp,
      description: "This cycle",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}, {session?.user?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {role === "ADMIN"
            ? "Here's your organization overview"
            : role === "MANAGER"
            ? "Here's how your team is performing"
            : "Here's your goal progress overview"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {role === "EMPLOYEE" && (
            <>
              <QuickActionCard
                href="/dashboard/goals/create"
                title="Create New Goal"
                description="Set up your goals for this cycle"
                icon={Target}
                color="blue"
              />
              <QuickActionCard
                href="/dashboard/goals"
                title="View My Goals"
                description="Check your current goals and progress"
                icon={TrendingUp}
                color="emerald"
              />
              <QuickActionCard
                href="/dashboard/check-ins"
                title="Submit Check-in"
                description="Update your quarterly progress"
                icon={CheckCircle2}
                color="purple"
              />
            </>
          )}
          {role === "MANAGER" && (
            <>
              <QuickActionCard
                href="/dashboard/approvals"
                title="Review Approvals"
                description={`${pendingGoals} goals pending review`}
                icon={AlertCircle}
                color="amber"
              />
              <QuickActionCard
                href="/dashboard/team"
                title="Team Dashboard"
                description="View your team's progress"
                icon={Users}
                color="blue"
              />
              <QuickActionCard
                href="/dashboard/shared-goals"
                title="Create Shared Goal"
                description="Set goals for multiple employees"
                icon={Target}
                color="emerald"
              />
            </>
          )}
          {role === "ADMIN" && (
            <>
              <QuickActionCard
                href="/dashboard/approvals"
                title="Approval Queue"
                description="Organization-wide pending approvals"
                icon={AlertCircle}
                color="amber"
              />
              <QuickActionCard
                href="/dashboard/cycles"
                title="Manage Cycles"
                description="Configure goal setting periods"
                icon={Clock}
                color="blue"
              />
              <QuickActionCard
                href="/dashboard/reports"
                title="View Reports"
                description="Organization performance analytics"
                icon={TrendingUp}
                color="purple"
              />
              <QuickActionCard
                href="/dashboard/completion"
                title="Completion Tracker"
                description="Track goal-setting completion rates"
                icon={CheckCircle2}
                color="emerald"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  title,
  description,
  icon: Icon,
  color,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "hover:border-blue-500/30 group-hover:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    emerald: "hover:border-emerald-500/30 group-hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "hover:border-amber-500/30 group-hover:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    purple: "hover:border-purple-500/30 group-hover:bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };

  const classes = colorMap[color] || colorMap.blue;
  const iconBg = color === "blue" ? "bg-blue-500/10" : color === "emerald" ? "bg-emerald-500/10" : color === "amber" ? "bg-amber-500/10" : "bg-purple-500/10";

  return (
    <a href={href} className="group">
      <Card className={`border-border/50 transition-all duration-300 hover:shadow-lg cursor-pointer ${classes.split(" ")[0]}`}>
        <CardHeader className="pb-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} mb-2`}>
            <Icon className={`h-5 w-5 ${classes.split(" ").slice(-2).join(" ")}`} />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </a>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
