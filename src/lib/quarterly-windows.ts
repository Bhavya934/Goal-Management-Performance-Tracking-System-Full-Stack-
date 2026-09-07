/**
 * AtomQuest Goals — Quarterly Window Enforcement
 *
 * Official windows (per BRD):
 *   Goal Setting:     May 1 – June 30
 *   Q1 Check-in:      July 1 – July 31
 *   Q2 Check-in:      October 1 – October 31
 *   Q3 Check-in:      January 1 – January 31
 *   Q4 / Annual:      March 1 – April 30
 *
 * Admin users have full override capability (bypass all windows).
 */

export interface WindowInfo {
  quarter: string;
  label: string;
  startDate: Date;
  endDate: Date;
  isOpen: boolean;
  description: string;
}

export interface QuarterlyWindowResult {
  /** The currently active check-in window (null if none open) */
  activeWindow: WindowInfo | null;
  /** All defined windows for the current fiscal year */
  allWindows: WindowInfo[];
  /** Whether the goal-setting window is open */
  goalSettingOpen: boolean;
  /** Human-readable message about current state */
  statusMessage: string;
}

/**
 * Get the fiscal year start based on a date.
 * Indian FY: April 1 – March 31. FY 2025-26 means Apr 2025 – Mar 2026.
 */
function getFiscalYearStart(now: Date): number {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  // If we're in Jan-Mar, the FY started the previous April
  return month < 3 ? year - 1 : year;
}

/**
 * Build the quarterly window definitions for a given fiscal year.
 * FY starts in April of `fyStartYear`.
 */
function buildWindows(fyStartYear: number): WindowInfo[] {
  return [
    {
      quarter: "GOAL_SETTING",
      label: "Goal Setting",
      startDate: new Date(fyStartYear, 4, 1),     // May 1
      endDate: new Date(fyStartYear, 5, 30, 23, 59, 59), // June 30 EOD
      isOpen: false,
      description: `May 1 – Jun 30, ${fyStartYear}`,
    },
    {
      quarter: "Q1",
      label: "Q1 Check-in",
      startDate: new Date(fyStartYear, 6, 1),      // July 1
      endDate: new Date(fyStartYear, 6, 31, 23, 59, 59), // July 31 EOD
      isOpen: false,
      description: `Jul 1 – Jul 31, ${fyStartYear}`,
    },
    {
      quarter: "Q2",
      label: "Q2 Check-in",
      startDate: new Date(fyStartYear, 9, 1),      // October 1
      endDate: new Date(fyStartYear, 9, 31, 23, 59, 59), // October 31 EOD
      isOpen: false,
      description: `Oct 1 – Oct 31, ${fyStartYear}`,
    },
    {
      quarter: "Q3",
      label: "Q3 Check-in",
      startDate: new Date(fyStartYear + 1, 0, 1),  // January 1 (next year)
      endDate: new Date(fyStartYear + 1, 0, 31, 23, 59, 59), // January 31 EOD
      isOpen: false,
      description: `Jan 1 – Jan 31, ${fyStartYear + 1}`,
    },
    {
      quarter: "Q4",
      label: "Q4 / Annual Review",
      startDate: new Date(fyStartYear + 1, 2, 1),  // March 1 (next year)
      endDate: new Date(fyStartYear + 1, 3, 30, 23, 59, 59), // April 30 EOD
      isOpen: false,
      description: `Mar 1 – Apr 30, ${fyStartYear + 1}`,
    },
  ];
}

/**
 * Get complete quarterly window state for a given date.
 */
export function getQuarterlyWindows(now: Date = new Date()): QuarterlyWindowResult {
  const fyStart = getFiscalYearStart(now);
  const windows = buildWindows(fyStart);

  // Mark which windows are currently open
  let activeWindow: WindowInfo | null = null;
  let goalSettingOpen = false;

  for (const w of windows) {
    w.isOpen = now >= w.startDate && now <= w.endDate;
    if (w.isOpen) {
      if (w.quarter === "GOAL_SETTING") {
        goalSettingOpen = true;
      } else {
        activeWindow = w;
      }
    }
  }

  // Build status message
  let statusMessage: string;
  if (activeWindow) {
    statusMessage = `${activeWindow.label} window is open until ${formatDateLong(activeWindow.endDate)}.`;
  } else if (goalSettingOpen) {
    const gs = windows.find((w) => w.quarter === "GOAL_SETTING")!;
    statusMessage = `Goal Setting window is open until ${formatDateLong(gs.endDate)}. Check-in windows are currently closed.`;
  } else {
    // Find next upcoming window
    const upcoming = windows.filter((w) => now < w.startDate).sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );
    if (upcoming.length > 0) {
      statusMessage = `No active check-in window. Next window: ${upcoming[0].label} opens on ${formatDateLong(upcoming[0].startDate)}.`;
    } else {
      statusMessage = "All quarterly windows for this fiscal year have closed. Contact your admin for assistance.";
    }
  }

  return { activeWindow, allWindows: windows, goalSettingOpen, statusMessage };
}

/**
 * Check if a specific quarter's check-in window is open.
 * Returns { allowed, message }.
 */
export function isCheckInAllowed(
  quarter: string,
  userRole: string,
  now: Date = new Date()
): { allowed: boolean; message: string } {
  // Admin always has override capability
  if (userRole === "ADMIN") {
    return { allowed: true, message: "Admin override: all windows accessible" };
  }

  const { allWindows } = getQuarterlyWindows(now);
  const window = allWindows.find((w) => w.quarter === quarter);

  if (!window) {
    return { allowed: false, message: `Unknown quarter: ${quarter}` };
  }

  if (window.isOpen) {
    return { allowed: true, message: `${window.label} window is open until ${formatDateLong(window.endDate)}.` };
  }

  // Window not open — tell user when it opens/opened
  if (now < window.startDate) {
    return {
      allowed: false,
      message: `${window.label} window is not open yet. Opens on ${formatDateLong(window.startDate)}. Please check back then.`,
    };
  }

  return {
    allowed: false,
    message: `${window.label} window closed on ${formatDateLong(window.endDate)}. Please contact your admin if you need to make changes.`,
  };
}

/**
 * Check if goal setting (create/edit/submit) is allowed.
 */
export function isGoalSettingAllowed(
  userRole: string,
  now: Date = new Date()
): { allowed: boolean; message: string } {
  if (userRole === "ADMIN") {
    return { allowed: true, message: "Admin override: goal setting always accessible" };
  }

  const { goalSettingOpen, allWindows } = getQuarterlyWindows(now);

  if (goalSettingOpen) {
    const gs = allWindows.find((w) => w.quarter === "GOAL_SETTING")!;
    return { allowed: true, message: `Goal setting window open until ${formatDateLong(gs.endDate)}.` };
  }

  const gs = allWindows.find((w) => w.quarter === "GOAL_SETTING")!;
  if (now < gs.startDate) {
    return {
      allowed: false,
      message: `Goal setting window opens on ${formatDateLong(gs.startDate)}. Please wait until then.`,
    };
  }

  return {
    allowed: false,
    message: `Goal setting window closed on ${formatDateLong(gs.endDate)}. Please contact your admin for assistance.`,
  };
}

/**
 * Serializable version of window info for passing to client components.
 */
export interface SerializedWindowInfo {
  quarter: string;
  label: string;
  startDate: string;
  endDate: string;
  isOpen: boolean;
  description: string;
}

export function serializeWindows(windows: WindowInfo[]): SerializedWindowInfo[] {
  return windows.map((w) => ({
    quarter: w.quarter,
    label: w.label,
    startDate: w.startDate.toISOString(),
    endDate: w.endDate.toISOString(),
    isOpen: w.isOpen,
    description: w.description,
  }));
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
