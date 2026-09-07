import { z } from "zod";

// ─── Goal Schema ────────────────────────────────────────────────
export const goalSchema = z.object({
  thrustArea: z.string().min(1, "Thrust area is required"),
  title: z.string().min(3, "Goal title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  uom: z.enum([
    "NUMERIC_HIGHER",
    "NUMERIC_LOWER",
    "PERCENTAGE",
    "TIMELINE",
    "ZERO_BASED",
  ], { message: "Unit of measurement is required" }),
  target: z.coerce.number().positive("Target must be positive"),
  weightage: z.coerce
    .number()
    .min(10, "Minimum weightage is 10%")
    .max(100, "Maximum weightage is 100%"),
});

export type GoalFormData = z.infer<typeof goalSchema>;

// ─── Goals Batch Schema (for validating entire set) ─────────────
export const goalsBatchSchema = z.object({
  goals: z
    .array(goalSchema)
    .min(1, "At least one goal is required")
    .max(8, "Maximum 8 goals allowed")
    .refine(
      (goals) => {
        const total = goals.reduce((sum, g) => sum + g.weightage, 0);
        return Math.abs(total - 100) < 0.01;
      },
      { message: "Total weightage must equal exactly 100%" }
    )
    .refine(
      (goals) => goals.every((g) => g.weightage >= 10),
      { message: "Each goal must have at least 10% weightage" }
    ),
});

// ─── Check-In Schema ────────────────────────────────────────────
export const checkInSchema = z.object({
  achievement: z.coerce.number().min(0, "Achievement must be non-negative"),
  status: z.enum(["NOT_STARTED", "ON_TRACK", "AT_RISK", "COMPLETED"]),
  notes: z.string().optional(),
});

export type CheckInFormData = z.infer<typeof checkInSchema>;

// ─── UoM Display Labels ────────────────────────────────────────
export const uomLabels: Record<string, string> = {
  NUMERIC_HIGHER: "Numeric (Higher is Better)",
  NUMERIC_LOWER: "Numeric (Lower is Better)",
  PERCENTAGE: "Percentage (%)",
  TIMELINE: "Timeline / Deadline",
  ZERO_BASED: "Zero-Based (0 = Success)",
};

// ─── Thrust Area Options ────────────────────────────────────────
export const thrustAreas = [
  "Product Development",
  "Customer Success",
  "Revenue Growth",
  "Operational Excellence",
  "Innovation & R&D",
  "Team & Culture",
  "Process Improvement",
  "Compliance & Governance",
  "Technology Enablement",
  "Strategic Initiatives",
];

// ─── Status Colors ──────────────────────────────────────────────
export const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  PENDING_APPROVAL: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  RETURNED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  LOCKED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

export const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  RETURNED: "Returned",
  LOCKED: "Locked",
};

export const checkInStatusColors: Record<string, string> = {
  NOT_STARTED: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  ON_TRACK: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  AT_RISK: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  COMPLETED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};
