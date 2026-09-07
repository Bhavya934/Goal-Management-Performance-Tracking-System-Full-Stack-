"use client";

import Link from "next/link";
import { submitGoalsForApproval, deleteGoal } from "@/lib/actions/goal-actions";
import { uomLabels, statusColors, statusLabels } from "@/lib/schemas";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Target,
  PlusCircle,
  Send,
  Trash2,
  Lock,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

interface GoalsListProps {
  goals: any[];
  totalWeightage: number;
  userRole: string;
}

export function GoalsList({ goals, totalWeightage, userRole }: GoalsListProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const draftGoals = goals.filter((g) => g.status === "DRAFT");
  const canSubmit =
    draftGoals.length > 0 && Math.abs(totalWeightage - 100) < 0.01;

  const handleSubmitForApproval = async () => {
    if (!canSubmit) {
      toast.error("Total weightage must be exactly 100% before submitting");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitGoalsForApproval();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Goals submitted for approval!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    const result = await deleteGoal(goalId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Goal deleted");
    }
  };

  if (goals.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Goals</h1>
          <p className="text-muted-foreground text-sm">
            Manage your goals for the current cycle
          </p>
        </div>

        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-md">
              Start by creating your goals for this cycle. You can add up to 8
              goals with weightages totaling 100%.
            </p>
            <Link href="/dashboard/goals/create">
              <Button className="cursor-pointer">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Goals
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Goals</h1>
          <p className="text-muted-foreground text-sm">
            {goals.length} goal(s) • Total weightage: {totalWeightage}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          {goals.length < 8 && (
            <Link href="/dashboard/goals/create">
              <Button variant="outline" className="cursor-pointer">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Goals
              </Button>
            </Link>
          )}
          {draftGoals.length > 0 && (
            <Button
              onClick={handleSubmitForApproval}
              disabled={!canSubmit || isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit for Approval
            </Button>
          )}
        </div>
      </div>

      {/* Weightage status */}
      {Math.abs(totalWeightage - 100) > 0.01 && (
        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium border border-amber-500/20 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Total weightage is {totalWeightage}%. It must be exactly 100% before
          submitting for approval.
        </div>
      )}

      {/* Goals Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Thrust Area</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Weightage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.map((goal, i) => (
                <TableRow key={goal.id} className="group">
                  <TableCell className="font-mono text-muted-foreground">
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{goal.title}</span>
                      {goal.sharedGoalId && (
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0"
                        >
                          <Users className="h-2.5 w-2.5 mr-1" />
                          Shared
                        </Badge>
                      )}
                      {goal.isLocked && (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {goal.description}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{goal.thrustArea}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {uomLabels[goal.uom] || goal.uom}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {goal.target}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs"
                    >
                      {goal.weightage}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", statusColors[goal.status])}
                    >
                      {statusLabels[goal.status]}
                    </Badge>
                    {goal.approvals?.[0]?.comment &&
                      goal.status === "RETURNED" && (
                        <p className="text-[10px] text-destructive mt-1 max-w-[120px] truncate">
                          "{goal.approvals[0].comment}"
                        </p>
                      )}
                  </TableCell>
                  <TableCell>
                    {goal.status === "DRAFT" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive cursor-pointer"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Weightage bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground shrink-0">
          Weightage Distribution
        </span>
        <div className="flex-1 h-4 rounded-full overflow-hidden bg-muted flex">
          {goals
            .filter((g) => g.status !== "RETURNED")
            .map((goal, i) => {
              const colors = [
                "bg-blue-500",
                "bg-emerald-500",
                "bg-amber-500",
                "bg-purple-500",
                "bg-pink-500",
                "bg-cyan-500",
                "bg-orange-500",
                "bg-indigo-500",
              ];
              return (
                <div
                  key={goal.id}
                  className={cn(
                    "h-full transition-all duration-500",
                    colors[i % colors.length]
                  )}
                  style={{ width: `${goal.weightage}%` }}
                  title={`${goal.title}: ${goal.weightage}%`}
                />
              );
            })}
        </div>
        <span
          className={cn(
            "text-sm font-mono font-medium shrink-0",
            Math.abs(totalWeightage - 100) < 0.01
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400"
          )}
        >
          {totalWeightage}%
        </span>
      </div>
    </div>
  );
}
