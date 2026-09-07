"use client";

import { useState, useMemo } from "react";
import { submitCheckIn } from "@/lib/actions/checkin-actions";
import { uomLabels } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileCheck,
  Target,
  TrendingUp,
  Loader2,
  CheckCircle2,
  Clock,
  Calendar,
  Lock,
  Info,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SerializedWindow {
  quarter: string;
  label: string;
  startDate: string;
  endDate: string;
  isOpen: boolean;
  description: string;
}

interface CheckInsDashboardProps {
  goals: any[];
  currentQuarter: string;
  userRole: string;
  windowStatus: string;
  windows: SerializedWindow[];
}

const quarters = ["Q1", "Q2", "Q3", "Q4"];
const checkInStatuses = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "ON_TRACK", label: "On Track" },
  { value: "AT_RISK", label: "At Risk" },
  { value: "COMPLETED", label: "Completed" },
];

const statusColors: Record<string, string> = {
  NOT_STARTED: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  ON_TRACK: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  AT_RISK: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  COMPLETED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

const UOM_TOOLTIPS: Record<string, string> = {
  NUMERIC_HIGHER: "Higher is better. Progress = (Achievement / Target) × 100",
  NUMERIC_LOWER: "Lower is better. Progress = (Target / Achievement) × 100. Achieving below target = 100%+",
  PERCENTAGE: "Direct percentage. Progress = (Achievement / Target) × 100",
  TIMELINE: "Timeline-based milestone tracking. Enter 0-100 to represent % complete",
  ZERO_BASED: "Binary: Enter 0 for fully achieved (100%), any other value for not achieved (0%)",
};

function getProgressColor(percent: number): string {
  if (percent >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (percent >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getProgressBarColor(percent: number): string {
  if (percent >= 90) return "bg-emerald-500";
  if (percent >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export function CheckInsDashboard({
  goals,
  currentQuarter,
  userRole,
  windowStatus,
  windows,
}: CheckInsDashboardProps) {
  const [activeQuarter, setActiveQuarter] = useState(currentQuarter);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [achievement, setAchievement] = useState("");
  const [status, setStatus] = useState("ON_TRACK");
  const [notes, setNotes] = useState("");

  const isAdmin = userRole === "ADMIN";

  // Check if the active quarter's window is open
  const activeWindowInfo = windows.find((w) => w.quarter === activeQuarter);
  const isWindowOpen = isAdmin || (activeWindowInfo?.isOpen ?? false);

  // Calculate overall progress for a quarter
  const quarterProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    let weightedSum = 0;
    let totalWeight = 0;
    for (const goal of goals) {
      const checkIn = goal.checkIns?.find(
        (ci: any) => ci.quarter === activeQuarter
      );
      if (checkIn) {
        weightedSum += checkIn.progressPercent * goal.weightage;
        totalWeight += goal.weightage;
      }
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }, [goals, activeQuarter]);

  const openCheckInDialog = (goalId: string, existingCheckIn: any) => {
    if (existingCheckIn) {
      setAchievement(String(existingCheckIn.achievement));
      setStatus(existingCheckIn.status);
      setNotes(existingCheckIn.notes || "");
    } else {
      setAchievement("");
      setStatus("ON_TRACK");
      setNotes("");
    }
    setCheckInDialogOpen(goalId);
  };

  const handleSubmitCheckIn = async () => {
    if (!checkInDialogOpen) return;
    if (!achievement || isNaN(parseFloat(achievement))) {
      toast.error("Please enter a valid achievement value");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitCheckIn({
        goalId: checkInDialogOpen,
        quarter: activeQuarter,
        achievement: parseFloat(achievement),
        status,
        notes,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Check-in submitted! Progress: ${result.progressPercent?.toFixed(1)}%`
        );
        setCheckInDialogOpen(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (goals.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-primary" />
            Quarterly Check-ins
          </h1>
          <p className="text-muted-foreground text-sm">
            Track your progress against approved goals
          </p>
        </div>
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No approved goals yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-md">
              Check-ins are available only for approved or locked goals. Create
              and submit goals for approval first.
            </p>
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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-primary" />
            Quarterly Check-ins
          </h1>
          <p className="text-muted-foreground text-sm">
            Update your progress for each goal by quarter
          </p>
        </div>
        <Badge variant="outline" className="text-sm font-medium">
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          Current: {currentQuarter}
        </Badge>
      </div>

      {/* Window Status Banner */}
      {isAdmin ? (
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-500/5 border-emerald-500/30">
          <CardContent className="py-4 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/15 shrink-0">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  🛡️ Admin Override Active
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You have full access to submit and edit check-ins for all quarters, regardless of window status.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={cn(
            "border-l-4",
            isWindowOpen
              ? "border-l-emerald-500 bg-emerald-500/5"
              : "border-l-amber-500 bg-amber-500/5"
          )}
        >
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              {isWindowOpen ? (
                <div className="p-1.5 rounded-lg bg-emerald-500/10 shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : (
                <div className="p-1.5 rounded-lg bg-amber-500/10 shrink-0">
                  <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {isWindowOpen
                    ? `${activeWindowInfo?.label} window is open`
                    : `${activeWindowInfo?.label || activeQuarter} window is currently closed`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {windowStatus}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quarterly Windows Schedule */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Quarterly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {windows
              .filter((w) => w.quarter !== "GOAL_SETTING")
              .map((w) => (
                <div
                  key={w.quarter}
                  className={cn(
                    "p-2.5 rounded-lg border text-center transition-all",
                    w.isOpen
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-border/50 bg-muted/30"
                  )}
                >
                  <span className="text-xs font-medium">{w.label}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {w.description}
                  </p>
                  {w.isOpen && (
                    <Badge className="mt-1 text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20">
                      Active
                    </Badge>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card className="border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Overall Progress ({activeQuarter})
            </span>
            <span
              className={cn(
                "text-sm font-mono font-bold",
                getProgressColor(quarterProgress)
              )}
            >
              {quarterProgress.toFixed(1)}%
            </span>
          </div>
          <div className="relative">
            <Progress value={Math.min(quarterProgress, 100)} className="h-3 bg-muted" />
            <div
              className={cn(
                "absolute inset-0 h-3 rounded-full transition-all duration-500",
                getProgressBarColor(quarterProgress)
              )}
              style={{ width: `${Math.min(quarterProgress, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quarter Tabs */}
      <Tabs
        value={activeQuarter}
        onValueChange={setActiveQuarter}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          {quarters.map((q) => {
            const qWindow = windows.find((w) => w.quarter === q);
            const qOpen = isAdmin || (qWindow?.isOpen ?? false);
            return (
              <TabsTrigger
                key={q}
                value={q}
                className={cn(
                  "cursor-pointer relative",
                  q === currentQuarter && "font-bold"
                )}
              >
                {!qOpen && !isAdmin && (
                  <Lock className="h-3 w-3 mr-1 text-muted-foreground" />
                )}
                {q}
                {q === currentQuarter && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {quarters.map((q) => {
          const qWindow = windows.find((w) => w.quarter === q);
          const qOpen = isAdmin || (qWindow?.isOpen ?? false);

          return (
            <TabsContent key={q} value={q} className="space-y-4 mt-4">
              {/* Locked Quarter Message */}
              {!qOpen && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          {qWindow?.label || q} Window is Closed
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {qWindow
                            ? new Date() < new Date(qWindow.startDate)
                              ? `Opens on ${new Date(qWindow.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. You can view past check-ins but cannot submit new ones until then.`
                              : `This window closed on ${new Date(qWindow.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. Please contact your admin if you need to make changes.`
                            : "This quarter's check-in window is not currently active."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {goals.map((goal) => {
                const checkIn = goal.checkIns?.find(
                  (ci: any) => ci.quarter === q
                );
                const progress = checkIn?.progressPercent || 0;

                return (
                  <Card
                    key={goal.id}
                    className="border-border/50 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="pt-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Goal info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary shrink-0" />
                            <h3 className="font-medium truncate">
                              {goal.title}
                            </h3>
                            <Badge variant="secondary" className="text-xs font-mono shrink-0">
                              {goal.weightage}%
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{goal.thrustArea}</span>
                            <span>•</span>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1 cursor-help underline decoration-dotted underline-offset-2">
                                {uomLabels[goal.uom]}
                                <Info className="h-3 w-3" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[280px] text-xs">
                                {UOM_TOOLTIPS[goal.uom] || goal.uom}
                              </TooltipContent>
                            </Tooltip>
                            <span>•</span>
                            <span>Target: {goal.target}</span>
                          </div>

                          {/* Progress bar */}
                          {checkIn && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Achievement: {checkIn.achievement}
                                </span>
                                <span
                                  className={cn(
                                    "font-mono font-medium",
                                    getProgressColor(progress)
                                  )}
                                >
                                  {progress.toFixed(1)}%
                                </span>
                              </div>
                              <div className="relative">
                                <Progress
                                  value={Math.min(progress, 100)}
                                  className="h-2 bg-muted"
                                />
                                <div
                                  className={cn(
                                    "absolute inset-0 h-2 rounded-full transition-all duration-500",
                                    getProgressBarColor(progress)
                                  )}
                                  style={{
                                    width: `${Math.min(progress, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Status & action */}
                        <div className="flex items-center gap-2 shrink-0">
                          {checkIn ? (
                            <Badge
                              variant="outline"
                              className={cn("text-xs", statusColors[checkIn.status])}
                            >
                              {checkIn.status.replace("_", " ")}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground"
                            >
                              No check-in
                            </Badge>
                          )}
                          {qOpen ? (
                            <Button
                              size="sm"
                              variant={checkIn ? "outline" : "default"}
                              onClick={() => openCheckInDialog(goal.id, checkIn)}
                              className="cursor-pointer"
                            >
                              {checkIn ? (
                                <>
                                  <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                                  Update
                                </>
                              ) : (
                                <>
                                  <FileCheck className="h-3.5 w-3.5 mr-1.5" />
                                  Check-in
                                </>
                              )}
                            </Button>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1 text-sm font-medium cursor-not-allowed opacity-50"
                                >
                                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                                  Locked
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Check-in window for {q} is closed
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      {/* Comments */}
                      {checkIn?.comments && checkIn.comments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Comments
                          </p>
                          <div className="space-y-2">
                            {checkIn.comments.map((comment: any) => (
                              <div
                                key={comment.id}
                                className="p-2 rounded-lg bg-muted/50 text-xs"
                              >
                                <span className="font-medium">
                                  {comment.user.name}
                                </span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {comment.user.role}
                                </span>
                                <p className="mt-1">{comment.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Check-in Dialog */}
      <Dialog
        open={!!checkInDialogOpen}
        onOpenChange={(open) => {
          if (!open) setCheckInDialogOpen(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Submit Check-in ({activeQuarter})
            </DialogTitle>
            <DialogDescription>
              {checkInDialogOpen && (
                <>
                  Update progress for &ldquo;
                  {goals.find((g) => g.id === checkInDialogOpen)?.title}&rdquo;
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {checkInDialogOpen && (
            <div className="space-y-4">
              {/* Goal context */}
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {goals.find((g) => g.id === checkInDialogOpen)?.title}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Target:{" "}
                    {goals.find((g) => g.id === checkInDialogOpen)?.target}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  UoM:{" "}
                  {
                    uomLabels[
                      goals.find((g) => g.id === checkInDialogOpen)?.uom
                    ]
                  }
                </p>
                {/* UoM formula tooltip */}
                <div className="mt-2 p-2 rounded bg-blue-500/5 border border-blue-500/20">
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>
                      {UOM_TOOLTIPS[goals.find((g) => g.id === checkInDialogOpen)?.uom] || "Enter your achievement value"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Achievement */}
              <div className="space-y-2">
                <Label htmlFor="achievement">Achievement Value *</Label>
                <Input
                  id="achievement"
                  type="number"
                  value={achievement}
                  onChange={(e) => setAchievement(e.target.value)}
                  placeholder="Enter your achievement..."
                  step="any"
                  min={0}
                />
                <p className="text-xs text-muted-foreground">
                  {goals.find((g) => g.id === checkInDialogOpen)?.uom ===
                    "ZERO_BASED"
                    ? "Enter 0 for success, any other value for failure"
                    : "Enter your actual achievement value"}
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {checkInStatuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about your progress..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Admin indicator */}
              {isAdmin && (
                <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin override active — bypassing window restriction
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCheckInDialogOpen(null)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitCheckIn}
                  disabled={submitting || !achievement}
                  className="cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Submit Check-in
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
