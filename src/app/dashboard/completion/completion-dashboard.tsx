"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Building2,
  Target,
  Clock,
  XCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useState } from "react";

interface CheckInQuarter {
  quarter: string;
  submitted: number;
  total: number;
  rate: number;
}

interface EmployeeStat {
  id: string;
  name: string;
  email: string;
  department: string;
  manager: string;
  totalGoals: number;
  approvedGoals: number;
  draftGoals: number;
  pendingGoals: number;
  returnedGoals: number;
  totalWeightage: number;
  goalSettingComplete: boolean;
  checkInCompletion: CheckInQuarter[];
  avgProgress: number;
}

interface DepartmentStat {
  department: string;
  employees: number;
  goalSettingComplete: number;
  completionRate: number;
  totalGoals: number;
  avgProgress: number;
}

interface OrgStats {
  totalEmployees: number;
  goalSettingDone: number;
  goalSettingRate: number;
  totalGoals: number;
  approvedGoals: number;
}

interface CompletionDashboardProps {
  employeeStats: EmployeeStat[];
  departmentStats: DepartmentStat[];
  orgStats: OrgStats;
}

const DEPT_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
];

export function CompletionDashboard({
  employeeStats,
  departmentStats,
  orgStats,
}: CompletionDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "COMPLETE" | "INCOMPLETE">("ALL");

  const departments = [...new Set(employeeStats.map((e) => e.department))];

  const filtered = employeeStats.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = filterDept === "ALL" || e.department === filterDept;
    const matchStatus =
      filterStatus === "ALL" ||
      (filterStatus === "COMPLETE" && e.goalSettingComplete) ||
      (filterStatus === "INCOMPLETE" && !e.goalSettingComplete);
    return matchSearch && matchDept && matchStatus;
  });

  const incompleteEmployees = employeeStats.filter((e) => !e.goalSettingComplete);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          Completion Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Organization-wide goal setting and check-in completion tracking
        </p>
      </div>

      {/* Org Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{orgStats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {departments.length} department{departments.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Goal Setting Complete
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {orgStats.goalSettingDone}
              <span className="text-lg text-muted-foreground font-normal">
                /{orgStats.totalEmployees}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                  style={{ width: `${orgStats.goalSettingRate}%` }}
                />
              </div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {orgStats.goalSettingRate}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Goals Set
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{orgStats.totalGoals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {orgStats.approvedGoals} approved/locked
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Need Attention
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{incompleteEmployees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Employees with incomplete goals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Department Comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Department Completion Rates
            </CardTitle>
            <CardDescription>
              Goal setting completion by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            {departmentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={departmentStats} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.3}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    dataKey="department"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Completion Rate"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="completionRate" radius={[0, 6, 6, 0]}>
                    {departmentStats.map((_, i) => (
                      <Cell
                        key={i}
                        fill={DEPT_COLORS[i % DEPT_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No department data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Details Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Department Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 font-medium text-muted-foreground">
                      Department
                    </th>
                    <th className="text-center py-2 font-medium text-muted-foreground">
                      Team
                    </th>
                    <th className="text-center py-2 font-medium text-muted-foreground">
                      Done
                    </th>
                    <th className="text-center py-2 font-medium text-muted-foreground">
                      Goals
                    </th>
                    <th className="text-center py-2 font-medium text-muted-foreground">
                      Avg Prog
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {departmentStats.map((dept) => (
                    <tr
                      key={dept.department}
                      className="border-b border-border/30 last:border-0"
                    >
                      <td className="py-3 font-medium">{dept.department}</td>
                      <td className="py-3 text-center">{dept.employees}</td>
                      <td className="py-3 text-center">
                        <Badge
                          variant={
                            dept.completionRate === 100 ? "default" : "secondary"
                          }
                          className={
                            dept.completionRate === 100
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                              : ""
                          }
                        >
                          {dept.goalSettingComplete}/{dept.employees}
                        </Badge>
                      </td>
                      <td className="py-3 text-center">{dept.totalGoals}</td>
                      <td className="py-3 text-center">
                        <span
                          className={
                            dept.avgProgress >= 75
                              ? "text-emerald-600 dark:text-emerald-400 font-medium"
                              : dept.avgProgress >= 40
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                          }
                        >
                          {dept.avgProgress}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee-Level Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Employee Completion Status
              </CardTitle>
              <CardDescription>
                {filtered.length} of {employeeStats.length} employees shown
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-border/50 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-[180px]"
                />
              </div>
              {/* Dept filter */}
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="text-sm border border-border/50 rounded-lg bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="ALL">All Depts</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as "ALL" | "COMPLETE" | "INCOMPLETE")
                }
                className="text-sm border border-border/50 rounded-lg bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="ALL">All Status</option>
                <option value="COMPLETE">Complete</option>
                <option value="INCOMPLETE">Incomplete</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2.5 font-medium text-muted-foreground">
                    Employee
                  </th>
                  <th className="text-left py-2.5 font-medium text-muted-foreground hidden sm:table-cell">
                    Department
                  </th>
                  <th className="text-left py-2.5 font-medium text-muted-foreground hidden md:table-cell">
                    Manager
                  </th>
                  <th className="text-center py-2.5 font-medium text-muted-foreground">
                    Goals
                  </th>
                  <th className="text-center py-2.5 font-medium text-muted-foreground">
                    Weightage
                  </th>
                  <th className="text-center py-2.5 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-center py-2.5 font-medium text-muted-foreground hidden lg:table-cell">
                    Q1
                  </th>
                  <th className="text-center py-2.5 font-medium text-muted-foreground hidden lg:table-cell">
                    Q2
                  </th>
                  <th className="text-center py-2.5 font-medium text-muted-foreground">
                    Avg Prog
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3">
                      <div>
                        <span className="font-medium">{emp.name}</span>
                        <span className="block text-xs text-muted-foreground sm:hidden">
                          {emp.department}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 hidden sm:table-cell text-muted-foreground">
                      {emp.department}
                    </td>
                    <td className="py-3 hidden md:table-cell text-muted-foreground">
                      {emp.manager}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-medium">{emp.totalGoals}</span>
                        {emp.draftGoals > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            ({emp.draftGoals}d)
                          </span>
                        )}
                        {emp.pendingGoals > 0 && (
                          <span className="text-[10px] text-amber-600">
                            ({emp.pendingGoals}p)
                          </span>
                        )}
                        {emp.returnedGoals > 0 && (
                          <span className="text-[10px] text-red-500">
                            ({emp.returnedGoals}r)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={
                          emp.totalWeightage === 100
                            ? "text-emerald-600 dark:text-emerald-400 font-medium"
                            : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        {emp.totalWeightage}%
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      {emp.goalSettingComplete ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Done
                        </Badge>
                      ) : emp.totalGoals === 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          No Goals
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 text-xs"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 text-center hidden lg:table-cell">
                      <CheckInCell data={emp.checkInCompletion[0]} />
                    </td>
                    <td className="py-3 text-center hidden lg:table-cell">
                      <CheckInCell data={emp.checkInCompletion[1]} />
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={
                          emp.avgProgress >= 75
                            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                            : emp.avgProgress >= 40
                            ? "text-amber-600 dark:text-amber-400 font-medium"
                            : emp.avgProgress > 0
                            ? "text-muted-foreground"
                            : "text-muted-foreground/50"
                        }
                      >
                        {emp.avgProgress > 0 ? `${emp.avgProgress}%` : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No employees match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Attention Required Section */}
      {incompleteEmployees.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Requires Follow-up ({incompleteEmployees.length})
            </CardTitle>
            <CardDescription>
              These employees have not completed their goal setting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {incompleteEmployees.map((emp) => {
                const issues: string[] = [];
                if (emp.totalGoals === 0) issues.push("No goals created");
                if (emp.totalWeightage < 100)
                  issues.push(`Weightage: ${emp.totalWeightage}% (need 100%)`);
                if (emp.draftGoals > 0)
                  issues.push(`${emp.draftGoals} draft goal${emp.draftGoals > 1 ? "s" : ""}`);
                if (emp.returnedGoals > 0)
                  issues.push(`${emp.returnedGoals} returned goal${emp.returnedGoals > 1 ? "s" : ""}`);
                if (emp.pendingGoals > 0)
                  issues.push(`${emp.pendingGoals} awaiting approval`);

                return (
                  <div
                    key={emp.id}
                    className="p-3 rounded-lg border border-border/50 bg-card/80"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{emp.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {emp.department}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Reports to {emp.manager}
                    </p>
                    <div className="space-y-1">
                      {issues.map((issue, i) => (
                        <div
                          key={i}
                          className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1"
                        >
                          <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CheckInCell({ data }: { data: CheckInQuarter }) {
  if (data.total === 0) return <span className="text-muted-foreground/50">—</span>;
  return (
    <span
      className={
        data.rate === 100
          ? "text-emerald-600 dark:text-emerald-400 font-medium"
          : data.rate > 0
          ? "text-amber-600 dark:text-amber-400"
          : "text-muted-foreground/50"
      }
    >
      {data.submitted}/{data.total}
    </span>
  );
}
