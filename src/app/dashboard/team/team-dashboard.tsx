"use client";

import { lockGoals } from "@/lib/actions/approval-actions";
import { statusColors, statusLabels, uomLabels } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Target,
  Lock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

interface TeamDashboardProps {
  teamMembers: any[];
  viewerRole: string;
}

export function TeamDashboard({ teamMembers, viewerRole }: TeamDashboardProps) {
  const [lockingUser, setLockingUser] = useState<string | null>(null);

  const handleLockGoals = async (userId: string) => {
    setLockingUser(userId);
    try {
      const result = await lockGoals(userId);
      if (result.error) toast.error(result.error);
      else toast.success(`${result.count} goals locked!`);
    } finally {
      setLockingUser(null);
    }
  };

  if (teamMembers.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Team Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">No team members found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Team Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          {teamMembers.length} team member(s) •{" "}
          {viewerRole === "ADMIN" ? "Organization-wide view" : "Your direct reports"}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Team Members"
          value={teamMembers.length}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Goals"
          value={teamMembers.reduce((sum, m) => sum + m.goals.length, 0)}
          icon={Target}
          color="purple"
        />
        <StatCard
          title="Approved"
          value={teamMembers.reduce(
            (sum, m) => sum + m.goals.filter((g: any) => g.status === "APPROVED" || g.status === "LOCKED").length,
            0
          )}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Pending"
          value={teamMembers.reduce(
            (sum, m) => sum + m.goals.filter((g: any) => g.status === "PENDING_APPROVAL").length,
            0
          )}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Team Members */}
      <div className="space-y-4">
        {teamMembers.map((member) => {
          const goalCount = member.goals.length;
          const approvedCount = member.goals.filter(
            (g: any) => g.status === "APPROVED" || g.status === "LOCKED"
          ).length;
          const pendingCount = member.goals.filter(
            (g: any) => g.status === "PENDING_APPROVAL"
          ).length;
          const draftCount = member.goals.filter(
            (g: any) => g.status === "DRAFT"
          ).length;
          const totalWeightage = member.goals
            .filter((g: any) => g.status !== "RETURNED")
            .reduce((sum: number, g: any) => sum + g.weightage, 0);

          const hasApprovedGoals = member.goals.some(
            (g: any) => g.status === "APPROVED"
          );

          const initials = member.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase();

          return (
            <Card key={member.id} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{member.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {member.email} • {member.department}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {goalCount === 0 && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        No goals
                      </Badge>
                    )}
                    {hasApprovedGoals && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLockGoals(member.id)}
                        disabled={lockingUser === member.id}
                        className="cursor-pointer"
                      >
                        {lockingUser === member.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Lock Goals
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {goalCount > 0 && (
                <CardContent className="pt-0">
                  {/* Quick stats */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {goalCount} goals
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-mono",
                        Math.abs(totalWeightage - 100) < 0.01
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {totalWeightage}% weightage
                    </Badge>
                    {approvedCount > 0 && (
                      <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400">
                        {approvedCount} approved
                      </Badge>
                    )}
                    {pendingCount > 0 && (
                      <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
                        {pendingCount} pending
                      </Badge>
                    )}
                    {draftCount > 0 && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        {draftCount} draft
                      </Badge>
                    )}
                  </div>

                  {/* Goals list */}
                  <div className="space-y-2">
                    {member.goals.map((goal: any, i: number) => {
                      // Calculate latest check-in progress
                      const latestCheckIn = goal.checkIns?.[goal.checkIns.length - 1];
                      const progress = latestCheckIn?.progressPercent || 0;

                      return (
                        <div
                          key={goal.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-xs font-mono text-muted-foreground w-5">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {goal.title}
                              </span>
                              {goal.isLocked && (
                                <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>{goal.thrustArea}</span>
                              <span>•</span>
                              <span>{goal.weightage}%</span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] shrink-0",
                              statusColors[goal.status]
                            )}
                          >
                            {statusLabels[goal.status]}
                          </Badge>
                          {latestCheckIn && (
                            <span
                              className={cn(
                                "text-xs font-mono font-medium shrink-0",
                                progress >= 90
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : progress >= 60
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-red-600 dark:text-red-400"
                              )}
                            >
                              {progress.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  const colorMap: Record<string, { text: string; bg: string }> = {
    blue: { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
    emerald: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    amber: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
    purple: { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", c.bg)}>
          <Icon className={cn("h-4 w-4", c.text)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
