"use client";

import { useState } from "react";
import {
  approveGoal,
  approveAllGoalsForUser,
  returnGoal,
  managerEditGoal,
  lockGoals,
} from "@/lib/actions/approval-actions";
import { uomLabels, statusColors, statusLabels } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  Pencil,
  Loader2,
  ClipboardCheck,
  User,
  Lock,
  CheckCheck,
  MessageSquare,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GroupedApproval {
  user: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  goals: any[];
  totalWeightage: number;
}

interface ApprovalsListProps {
  groupedApprovals: GroupedApproval[];
  reviewerRole: string;
}

export function ApprovalsList({
  groupedApprovals,
  reviewerRole,
}: ApprovalsListProps) {
  const [loadingGoals, setLoadingGoals] = useState<Record<string, boolean>>({});
  const [returnComment, setReturnComment] = useState<Record<string, string>>({});
  const [returnDialogOpen, setReturnDialogOpen] = useState<Record<string, boolean>>({});
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [bulkLoading, setBulkLoading] = useState<Record<string, boolean>>({});

  const handleApprove = async (goalId: string) => {
    setLoadingGoals((prev) => ({ ...prev, [goalId]: true }));
    try {
      const result = await approveGoal(goalId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Goal approved!");
      }
    } finally {
      setLoadingGoals((prev) => ({ ...prev, [goalId]: false }));
    }
  };

  const handleApproveAll = async (userId: string) => {
    setBulkLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const result = await approveAllGoalsForUser(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${result.count} goals approved!`);
      }
    } finally {
      setBulkLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleReturn = async (goalId: string) => {
    const comment = returnComment[goalId];
    if (!comment?.trim()) {
      toast.error("Please provide a reason for returning the goal");
      return;
    }
    setLoadingGoals((prev) => ({ ...prev, [goalId]: true }));
    try {
      const result = await returnGoal(goalId, comment);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Goal returned to employee");
        setReturnDialogOpen((prev) => ({ ...prev, [goalId]: false }));
        setReturnComment((prev) => ({ ...prev, [goalId]: "" }));
      }
    } finally {
      setLoadingGoals((prev) => ({ ...prev, [goalId]: false }));
    }
  };

  const handleSaveEdit = async (goalId: string) => {
    setLoadingGoals((prev) => ({ ...prev, [goalId]: true }));
    try {
      const result = await managerEditGoal(goalId, editData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Goal updated");
        setEditingGoal(null);
        setEditData({});
      }
    } finally {
      setLoadingGoals((prev) => ({ ...prev, [goalId]: false }));
    }
  };

  const handleLockGoals = async (userId: string) => {
    setBulkLoading((prev) => ({ ...prev, [`lock-${userId}`]: true }));
    try {
      const result = await lockGoals(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${result.count} goals locked!`);
      }
    } finally {
      setBulkLoading((prev) => ({ ...prev, [`lock-${userId}`]: false }));
    }
  };

  if (groupedApprovals.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground text-sm">
            Review and approve employee goals
          </p>
        </div>
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground text-sm text-center max-w-md">
              No goals pending approval. When employees submit goals, they'll
              appear here for your review.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Approvals
          </h1>
          <p className="text-muted-foreground text-sm">
            {groupedApprovals.reduce((sum, g) => sum + g.goals.length, 0)} goals
            pending review from {groupedApprovals.length} employee(s)
          </p>
        </div>
      </div>

      {/* Grouped by employee */}
      {groupedApprovals.map((group) => (
        <Card
          key={group.user.id}
          className="border-border/50 overflow-hidden"
        >
          {/* Employee header */}
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{group.user.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {group.user.email} • {group.user.department} •{" "}
                    {group.goals.length} goal(s) • Total: {group.totalWeightage}%
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {Math.abs(group.totalWeightage - 100) < 0.01 && (
                  <Button
                    size="sm"
                    onClick={() => handleApproveAll(group.user.id)}
                    disabled={bulkLoading[group.user.id]}
                    className="cursor-pointer"
                  >
                    {bulkLoading[group.user.id] ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Approve All
                  </Button>
                )}
                {Math.abs(group.totalWeightage - 100) > 0.01 && (
                  <Badge variant="destructive" className="text-xs">
                    Weightage: {group.totalWeightage}% ≠ 100%
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Goals table */}
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
                  <TableHead className="text-right w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.goals.map((goal: any, i: number) => (
                  <TableRow key={goal.id} className="group">
                    <TableCell className="font-mono text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      {editingGoal === goal.id ? (
                        <div className="space-y-2">
                          <Input
                            defaultValue={goal.title}
                            onChange={(e) =>
                              setEditData((prev: any) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            className="h-8 text-sm"
                            placeholder="Goal title"
                          />
                          <Textarea
                            defaultValue={goal.description}
                            onChange={(e) =>
                              setEditData((prev: any) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            className="text-xs min-h-[60px] resize-none"
                            placeholder="Description"
                          />
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium">{goal.title}</span>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {goal.description}
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{goal.thrustArea}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {uomLabels[goal.uom] || goal.uom}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {editingGoal === goal.id ? (
                        <Input
                          type="number"
                          defaultValue={goal.target}
                          onChange={(e) =>
                            setEditData((prev: any) => ({
                              ...prev,
                              target: parseFloat(e.target.value),
                            }))
                          }
                          className="h-8 w-20 text-sm text-right"
                        />
                      ) : (
                        <span className="font-mono">{goal.target}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingGoal === goal.id ? (
                        <Input
                          type="number"
                          defaultValue={goal.weightage}
                          onChange={(e) =>
                            setEditData((prev: any) => ({
                              ...prev,
                              weightage: parseFloat(e.target.value),
                            }))
                          }
                          className="h-8 w-20 text-sm text-right"
                        />
                      ) : (
                        <Badge variant="secondary" className="font-mono text-xs">
                          {goal.weightage}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editingGoal === goal.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingGoal(null);
                                setEditData({});
                              }}
                              className="h-7 text-xs cursor-pointer"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(goal.id)}
                              disabled={loadingGoals[goal.id]}
                              className="h-7 text-xs cursor-pointer"
                            >
                              {loadingGoals[goal.id] ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            {/* Edit */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
                              onClick={() => {
                                setEditingGoal(goal.id);
                                setEditData({});
                              }}
                              title="Edit goal"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {/* Approve */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-emerald-600 cursor-pointer"
                              onClick={() => handleApprove(goal.id)}
                              disabled={loadingGoals[goal.id]}
                              title="Approve"
                            >
                              {loadingGoals[goal.id] ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            {/* Return */}
                            <Dialog
                              open={returnDialogOpen[goal.id] || false}
                              onOpenChange={(open) =>
                                setReturnDialogOpen((prev) => ({
                                  ...prev,
                                  [goal.id]: open,
                                }))
                              }
                            >
                              <DialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                                  title="Return with comment"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Return Goal</DialogTitle>
                                  <DialogDescription>
                                    Return "{goal.title}" to {group.user.name} with feedback
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                                    <p className="font-medium">{goal.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {goal.description}
                                    </p>
                                  </div>
                                  <Textarea
                                    placeholder="Provide feedback or reason for returning..."
                                    value={returnComment[goal.id] || ""}
                                    onChange={(e) =>
                                      setReturnComment((prev) => ({
                                        ...prev,
                                        [goal.id]: e.target.value,
                                      }))
                                    }
                                    className="min-h-[100px]"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        setReturnDialogOpen((prev) => ({
                                          ...prev,
                                          [goal.id]: false,
                                        }))
                                      }
                                      className="cursor-pointer"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleReturn(goal.id)}
                                      disabled={
                                        loadingGoals[goal.id] ||
                                        !returnComment[goal.id]?.trim()
                                      }
                                      className="cursor-pointer"
                                    >
                                      {loadingGoals[goal.id] ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                      )}
                                      Return Goal
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
