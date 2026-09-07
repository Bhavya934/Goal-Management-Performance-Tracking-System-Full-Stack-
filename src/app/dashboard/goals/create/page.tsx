"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createGoalsBatch } from "@/lib/actions/goal-actions";
import { GoalFormData, uomLabels, thrustAreas } from "@/lib/schemas";
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
import { Separator } from "@/components/ui/separator";
import {
  Target,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface GoalEntry {
  id: string;
  thrustArea: string;
  title: string;
  description: string;
  uom: string;
  target: string;
  weightage: string;
  expanded: boolean;
  errors: Record<string, string>;
}

function createEmptyGoal(): GoalEntry {
  return {
    id: crypto.randomUUID(),
    thrustArea: "",
    title: "",
    description: "",
    uom: "",
    target: "",
    weightage: "",
    expanded: true,
    errors: {},
  };
}

export default function CreateGoalPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<GoalEntry[]>([createEmptyGoal()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // ─── Weightage calculations ─────────────────────────────────
  const totalWeightage = useMemo(
    () => goals.reduce((sum, g) => sum + (parseFloat(g.weightage) || 0), 0),
    [goals]
  );

  const remainingWeightage = useMemo(() => 100 - totalWeightage, [totalWeightage]);

  const isWeightageValid = useMemo(
    () => Math.abs(totalWeightage - 100) < 0.01,
    [totalWeightage]
  );

  const hasInvalidMinWeightage = useMemo(
    () =>
      goals.some((g) => {
        const w = parseFloat(g.weightage);
        return !isNaN(w) && w > 0 && w < 10;
      }),
    [goals]
  );

  // ─── Goal management ───────────────────────────────────────
  const addGoal = useCallback(() => {
    if (goals.length >= 8) {
      toast.error("Maximum 8 goals allowed");
      return;
    }
    setGoals((prev) => [...prev, createEmptyGoal()]);
  }, [goals.length]);

  const removeGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const updateGoal = useCallback(
    (id: string, field: keyof GoalEntry, value: string) => {
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== id) return g;
          return { ...g, [field]: value, errors: { ...g.errors, [field]: "" } };
        })
      );
    },
    []
  );

  const toggleExpand = useCallback((id: string) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, expanded: !g.expanded } : g
      )
    );
  }, []);

  // ─── Validation ─────────────────────────────────────────────
  const validateGoals = useCallback((): boolean => {
    let valid = true;
    const updated = goals.map((g) => {
      const errors: Record<string, string> = {};

      if (!g.thrustArea) { errors.thrustArea = "Required"; valid = false; }
      if (!g.title || g.title.length < 3) { errors.title = "Min 3 chars"; valid = false; }
      if (!g.description || g.description.length < 10) { errors.description = "Min 10 chars"; valid = false; }
      if (!g.uom) { errors.uom = "Required"; valid = false; }
      if (!g.target || parseFloat(g.target) <= 0) { errors.target = "Must be positive"; valid = false; }
      const w = parseFloat(g.weightage);
      if (isNaN(w) || w < 10) { errors.weightage = "Min 10%"; valid = false; }

      return { ...g, errors, expanded: Object.keys(errors).length > 0 ? true : g.expanded };
    });

    setGoals(updated);

    if (!isWeightageValid) {
      setGlobalError(`Total weightage must be exactly 100%. Currently ${totalWeightage}%.`);
      valid = false;
    } else {
      setGlobalError(null);
    }

    return valid;
  }, [goals, isWeightageValid, totalWeightage]);

  // ─── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateGoals()) return;

    setIsSubmitting(true);
    setGlobalError(null);

    try {
      const goalsData = goals.map((g) => ({
        thrustArea: g.thrustArea,
        title: g.title,
        description: g.description,
        uom: g.uom,
        target: parseFloat(g.target),
        weightage: parseFloat(g.weightage),
      }));

      const result = await createGoalsBatch(goalsData);

      if (result.error) {
        setGlobalError(result.error);
        toast.error(result.error);
      } else {
        toast.success(`${result.count} goal(s) created successfully!`);
        router.push("/dashboard/goals");
      }
    } catch {
      setGlobalError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Weightage status ──────────────────────────────────────
  const weightageStatus = useMemo(() => {
    if (totalWeightage === 0) return { color: "text-muted-foreground", bg: "bg-muted", label: "Not set" };
    if (totalWeightage < 100) return { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", label: `${remainingWeightage}% remaining` };
    if (isWeightageValid) return { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500", label: "Perfect! ✓" };
    return { color: "text-red-600 dark:text-red-400", bg: "bg-red-500", label: `${totalWeightage - 100}% over` };
  }, [totalWeightage, remainingWeightage, isWeightageValid]);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/goals">
          <Button variant="ghost" size="icon" className="shrink-0 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Goals</h1>
          <p className="text-muted-foreground text-sm">
            Define your goals for this cycle. You can add up to 8 goals.
          </p>
        </div>
      </div>

      {/* ─── Weightage Tracker (Sticky) ──────────────────────── */}
      <Card className="border-border/50 sticky top-0 z-10 backdrop-blur-xl bg-card/95">
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Total Weightage</span>
                  <Badge
                    variant="outline"
                    className={cn("text-xs font-mono", weightageStatus.color)}
                  >
                    {totalWeightage}% / 100%
                  </Badge>
                </div>
                <span className={cn("text-xs font-medium", weightageStatus.color)}>
                  {weightageStatus.label}
                </span>
              </div>
              <div className="relative">
                <Progress
                  value={Math.min(totalWeightage, 100)}
                  className="h-3 bg-muted"
                />
                {/* Colored overlay for the progress bar */}
                <div
                  className={cn(
                    "absolute inset-0 h-3 rounded-full transition-all duration-500",
                    weightageStatus.bg
                  )}
                  style={{ width: `${Math.min(totalWeightage, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm shrink-0">
              <Badge variant="secondary" className="font-mono">
                {goals.length}/8 goals
              </Badge>
              {hasInvalidMinWeightage && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Min 10%
                </Badge>
              )}
            </div>
          </div>

          {/* Validation hints */}
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              {goals.length <= 8 ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              ) : (
                <AlertCircle className="h-3 w-3 text-red-500" />
              )}
              Max 8 goals
            </span>
            <span className="flex items-center gap-1">
              {isWeightageValid ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              ) : (
                <AlertCircle className="h-3 w-3 text-amber-500" />
              )}
              Total = 100%
            </span>
            <span className="flex items-center gap-1">
              {!hasInvalidMinWeightage ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              ) : (
                <AlertCircle className="h-3 w-3 text-red-500" />
              )}
              Min 10% each
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Global Error */}
      {globalError && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {globalError}
        </div>
      )}

      {/* ─── Goal Cards ──────────────────────────────────────── */}
      <div className="space-y-4">
        {goals.map((goal, index) => (
          <Card
            key={goal.id}
            className={cn(
              "border-border/50 transition-all duration-300",
              Object.keys(goal.errors).length > 0 && "border-destructive/30"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => toggleExpand(goal.id)}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">
                      {goal.title || `Goal ${index + 1}`}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {goal.thrustArea || "Select thrust area"} •{" "}
                      {goal.weightage ? `${goal.weightage}%` : "—%"} weightage
                    </CardDescription>
                  </div>
                  {goal.expanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
                {goals.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                    onClick={() => removeGoal(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            {goal.expanded && (
              <CardContent className="space-y-4 pt-2">
                <Separator className="mb-2" />
                
                {/* Row 1: Thrust Area + Title */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className={goal.errors.thrustArea ? "text-destructive" : ""}>
                      Thrust Area *
                    </Label>
                    <Select
                      value={goal.thrustArea}
                      onValueChange={(v) => updateGoal(goal.id, "thrustArea", v)}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-10",
                          goal.errors.thrustArea && "border-destructive"
                        )}
                      >
                        <SelectValue placeholder="Select thrust area" />
                      </SelectTrigger>
                      <SelectContent>
                        {thrustAreas.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {goal.errors.thrustArea && (
                      <p className="text-xs text-destructive">{goal.errors.thrustArea}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className={goal.errors.title ? "text-destructive" : ""}>
                      Goal Title *
                    </Label>
                    <Input
                      value={goal.title}
                      onChange={(e) => updateGoal(goal.id, "title", e.target.value)}
                      placeholder="e.g., Increase revenue by 20%"
                      className={cn(
                        "h-10",
                        goal.errors.title && "border-destructive"
                      )}
                    />
                    {goal.errors.title && (
                      <p className="text-xs text-destructive">{goal.errors.title}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Description */}
                <div className="space-y-2">
                  <Label className={goal.errors.description ? "text-destructive" : ""}>
                    Description *
                  </Label>
                  <Textarea
                    value={goal.description}
                    onChange={(e) => updateGoal(goal.id, "description", e.target.value)}
                    placeholder="Describe the goal objectives, key results, and how success will be measured..."
                    className={cn(
                      "min-h-[80px] resize-none",
                      goal.errors.description && "border-destructive"
                    )}
                  />
                  {goal.errors.description && (
                    <p className="text-xs text-destructive">{goal.errors.description}</p>
                  )}
                </div>

                {/* Row 3: UoM + Target + Weightage */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className={goal.errors.uom ? "text-destructive" : ""}>
                      Unit of Measurement *
                    </Label>
                    <Select
                      value={goal.uom}
                      onValueChange={(v) => updateGoal(goal.id, "uom", v)}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-10",
                          goal.errors.uom && "border-destructive"
                        )}
                      >
                        <SelectValue placeholder="Select UoM" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(uomLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {goal.errors.uom && (
                      <p className="text-xs text-destructive">{goal.errors.uom}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className={goal.errors.target ? "text-destructive" : ""}>
                      Target *
                    </Label>
                    <Input
                      type="number"
                      value={goal.target}
                      onChange={(e) => updateGoal(goal.id, "target", e.target.value)}
                      placeholder="e.g., 100"
                      className={cn(
                        "h-10",
                        goal.errors.target && "border-destructive"
                      )}
                      min={0}
                      step="any"
                    />
                    {goal.errors.target && (
                      <p className="text-xs text-destructive">{goal.errors.target}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className={goal.errors.weightage ? "text-destructive" : ""}>
                      Weightage (%) *
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={goal.weightage}
                        onChange={(e) => updateGoal(goal.id, "weightage", e.target.value)}
                        placeholder="Min 10%"
                        className={cn(
                          "h-10 pr-8",
                          goal.errors.weightage && "border-destructive",
                          parseFloat(goal.weightage) > 0 &&
                            parseFloat(goal.weightage) < 10 &&
                            "border-amber-500"
                        )}
                        min={10}
                        max={100}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                    {goal.errors.weightage && (
                      <p className="text-xs text-destructive">{goal.errors.weightage}</p>
                    )}
                    {!goal.errors.weightage &&
                      parseFloat(goal.weightage) > 0 &&
                      parseFloat(goal.weightage) < 10 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Minimum 10% required
                        </p>
                      )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* ─── Add Goal Button ─────────────────────────────────── */}
      {goals.length < 8 && (
        <Button
          variant="outline"
          className="w-full h-12 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all cursor-pointer"
          onClick={addGoal}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Goal ({goals.length}/8)
        </Button>
      )}

      {/* ─── Actions ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-4 pb-8">
        <Link href="/dashboard/goals">
          <Button variant="ghost" className="cursor-pointer">Cancel</Button>
        </Link>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || goals.length === 0}
            className="min-w-[160px] cursor-pointer"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Save Goals ({goals.length})
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
