import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "MANAGER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch goals based on role
  const goalsQuery =
    role === "ADMIN" ? {} : { user: { managerId: session.user.id } };

  const goals = await prisma.goal.findMany({
    where: goalsQuery,
    include: {
      user: { select: { name: true, email: true, department: true } },
      checkIns: {
        orderBy: { quarter: "asc" as const },
        include: {
          comments: {
            include: { user: { select: { name: true } } },
          },
        },
      },
      approvals: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
        include: { reviewedBy: { select: { name: true } } },
      },
    },
    orderBy: [{ user: { name: "asc" } }, { sortOrder: "asc" }],
  });

  // ─── Sheet 1: Goals Overview ─────────────────────────────────
  const goalsData = goals.map((g) => ({
    Employee: g.user.name,
    Email: g.user.email,
    Department: g.user.department,
    "Thrust Area": g.thrustArea,
    Title: g.title,
    Description: g.description,
    UoM: formatUom(g.uom),
    Target: g.target,
    "Weightage (%)": g.weightage,
    Status: formatStatus(g.status),
    "Is Locked": g.isLocked ? "Yes" : "No",
    "Created At": g.createdAt.toISOString().split("T")[0],
  }));

  // ─── Sheet 2: Check-In Details ───────────────────────────────
  const checkInRows: Record<string, string | number>[] = [];
  for (const g of goals) {
    for (const ci of g.checkIns) {
      checkInRows.push({
        Employee: g.user.name,
        Department: g.user.department,
        "Goal Title": g.title,
        UoM: formatUom(g.uom),
        Target: g.target,
        Quarter: ci.quarter,
        Achievement: ci.achievement,
        "Progress (%)": Math.round(ci.progressPercent * 10) / 10,
        Status: formatCheckInStatus(ci.status),
        Notes: ci.notes || "",
        "Manager Comments": ci.comments
          .map((c) => `${c.user.name}: ${c.content}`)
          .join(" | "),
        "Updated At": ci.updatedAt.toISOString().split("T")[0],
      });
    }
  }

  // ─── Sheet 3: Status Summary ─────────────────────────────────
  const statusCounts: Record<string, number> = {};
  goals.forEach((g) => {
    const label = formatStatus(g.status);
    statusCounts[label] = (statusCounts[label] || 0) + 1;
  });
  const statusSummary = Object.entries(statusCounts).map(([status, count]) => ({
    Status: status,
    Count: count,
    "Percentage (%)":
      goals.length > 0
        ? Math.round((count / goals.length) * 1000) / 10
        : 0,
  }));

  // ─── Sheet 4: Thrust Area Summary ────────────────────────────
  const thrustCounts: Record<string, number> = {};
  goals.forEach((g) => {
    thrustCounts[g.thrustArea] = (thrustCounts[g.thrustArea] || 0) + 1;
  });
  const thrustSummary = Object.entries(thrustCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([area, count]) => ({
      "Thrust Area": area,
      "Goal Count": count,
      "Percentage (%)":
        goals.length > 0
          ? Math.round((count / goals.length) * 1000) / 10
          : 0,
    }));

  // ─── Sheet 5: Quarterly Progress ─────────────────────────────
  const quarterProgress = ["Q1", "Q2", "Q3", "Q4"].map((q) => {
    const qCheckIns = goals.flatMap((g) =>
      g.checkIns.filter((ci) => ci.quarter === q)
    );
    const avgProgress =
      qCheckIns.length > 0
        ? qCheckIns.reduce((sum, ci) => sum + ci.progressPercent, 0) /
          qCheckIns.length
        : 0;
    return {
      Quarter: q,
      "Check-Ins Submitted": qCheckIns.length,
      "Average Progress (%)": Math.round(avgProgress * 10) / 10,
      "Completed Count": qCheckIns.filter((ci) => ci.status === "COMPLETED")
        .length,
    };
  });

  // ─── Sheet 6: Department Summary ─────────────────────────────
  const deptMap: Record<string, { total: number; approved: number; avgProgress: number; progressCount: number }> = {};
  goals.forEach((g) => {
    const dept = g.user.department;
    if (!deptMap[dept]) deptMap[dept] = { total: 0, approved: 0, avgProgress: 0, progressCount: 0 };
    deptMap[dept].total++;
    if (g.status === "APPROVED" || g.status === "LOCKED") deptMap[dept].approved++;
    g.checkIns.forEach((ci) => {
      deptMap[dept].avgProgress += ci.progressPercent;
      deptMap[dept].progressCount++;
    });
  });
  const deptSummary = Object.entries(deptMap).map(([dept, data]) => ({
    Department: dept,
    "Total Goals": data.total,
    "Approved/Locked": data.approved,
    "Avg Progress (%)": data.progressCount > 0
      ? Math.round((data.avgProgress / data.progressCount) * 10) / 10
      : 0,
  }));

  // ─── Build Workbook ──────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  // Helper: create sheet with auto-width columns
  function addSheet(
    name: string,
    data: Record<string, string | number | boolean>[],
    headerColor?: string
  ) {
    if (data.length === 0) {
      data = [{ Info: "No data available" }];
    }
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-width columns
    const colWidths = Object.keys(data[0]).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...data.map((row) => String(row[key] ?? "").length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
    });
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  addSheet("Goals Overview", goalsData);
  addSheet("Check-In Details", checkInRows);
  addSheet("Status Summary", statusSummary);
  addSheet("Thrust Areas", thrustSummary);
  addSheet("Quarterly Progress", quarterProgress);
  addSheet("Department Summary", deptSummary);

  // Generate buffer
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const today = new Date().toISOString().split("T")[0];
  const filename = `atomquest-goals-report-${today}.xlsx`;

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatUom(uom: string): string {
  const map: Record<string, string> = {
    NUMERIC_HIGHER: "Numeric (Higher is Better)",
    NUMERIC_LOWER: "Numeric (Lower is Better)",
    PERCENTAGE: "Percentage",
    TIMELINE: "Timeline",
    ZERO_BASED: "Zero Based",
  };
  return map[uom] || uom;
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    RETURNED: "Returned",
    LOCKED: "Locked",
  };
  return map[status] || status;
}

function formatCheckInStatus(status: string): string {
  const map: Record<string, string> = {
    NOT_STARTED: "Not Started",
    ON_TRACK: "On Track",
    AT_RISK: "At Risk",
    COMPLETED: "Completed",
  };
  return map[status] || status;
}
