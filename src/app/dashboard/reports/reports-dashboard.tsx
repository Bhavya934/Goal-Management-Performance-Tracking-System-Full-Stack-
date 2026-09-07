"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, PieChart as PieIcon, TrendingUp, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { useState } from "react";

interface GoalExportRow {
  employee: string;
  email: string;
  department: string;
  thrustArea: string;
  title: string;
  uom: string;
  target: number;
  weightage: number;
  status: string;
}

interface ReportsDashboardProps {
  statusBreakdown: Record<string, number>;
  thrustAreaBreakdown: Record<string, number>;
  departmentBreakdown: Record<string, number>;
  quarterData: Array<{
    quarter: string;
    avgProgress: number;
    checkInCount: number;
  }>;
  totalGoals: number;
  viewerRole: string;
  goalsForExport: GoalExportRow[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  PENDING_APPROVAL: "#f59e0b",
  APPROVED: "#10b981",
  RETURNED: "#ef4444",
  LOCKED: "#3b82f6",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending",
  APPROVED: "Approved",
  RETURNED: "Returned",
  LOCKED: "Locked",
};

const UOM_LABELS: Record<string, string> = {
  NUMERIC_HIGHER: "Numeric (Higher)",
  NUMERIC_LOWER: "Numeric (Lower)",
  PERCENTAGE: "Percentage",
  TIMELINE: "Timeline",
  ZERO_BASED: "Zero Based",
};

const CHART_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#f97316",
  "#14b8a6",
  "#a855f7",
];

export function ReportsDashboard({
  statusBreakdown,
  thrustAreaBreakdown,
  departmentBreakdown,
  quarterData,
  totalGoals,
  viewerRole,
  goalsForExport,
}: ReportsDashboardProps) {
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Transform data for charts
  const statusData = Object.entries(statusBreakdown).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    fill: STATUS_COLORS[status] || "#94a3b8",
  }));

  const thrustAreaData = Object.entries(thrustAreaBreakdown)
    .map(([area, count]) => ({
      name: area.length > 15 ? area.substring(0, 15) + "..." : area,
      fullName: area,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const handleExportCSV = () => {
    const headers = [
      "Employee",
      "Email",
      "Department",
      "Thrust Area",
      "Title",
      "UoM",
      "Target",
      "Weightage (%)",
      "Status",
    ];

    const rows = goalsForExport.map((g) => [
      g.employee,
      g.email,
      g.department,
      g.thrustArea,
      `"${g.title.replace(/"/g, '""')}"`,
      UOM_LABELS[g.uom] || g.uom,
      String(g.target),
      String(g.weightage),
      STATUS_LABELS[g.status] || g.status,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atomquest-goals-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const res = await fetch("/api/export/excel");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `atomquest-goals-report-${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel export error:", err);
      alert("Failed to export Excel file. Please try again.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground text-sm">
            {totalGoals} total goals •{" "}
            {viewerRole === "ADMIN" ? "Organization-wide" : "Team"} view
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="cursor-pointer"
            id="export-csv-btn"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            id="export-excel-btn"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isExportingExcel ? "Generating..." : "Export Excel"}
          </Button>
        </div>
      </div>

      {/* Excel info banner */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-sm">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">Excel export</strong> includes 6 sheets: Goals Overview, Check-In Details, Status Summary, Thrust Areas, Quarterly Progress, and Department Summary — with auto-sized columns.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Pie Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" />
              Goal Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Thrust Area Bar Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Goals by Thrust Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            {thrustAreaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={thrustAreaData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.3}
                  />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [value, "Goals"]}
                    labelFormatter={(label: string) => {
                      const item = thrustAreaData.find((d) => d.name === label);
                      return item?.fullName || label;
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quarterly Progress Line Chart */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Quarterly Progress Trend
            </CardTitle>
            <CardDescription>
              Average progress across all goals per quarter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={quarterData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis dataKey="quarter" />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Avg Progress"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgProgress"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Check-in counts */}
            <div className="flex justify-center gap-6 mt-4">
              {quarterData.map((q) => (
                <div key={q.quarter} className="text-center">
                  <span className="text-xs text-muted-foreground">
                    {q.quarter}
                  </span>
                  <p className="text-sm font-medium">
                    {q.checkInCount} check-in{q.checkInCount !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
