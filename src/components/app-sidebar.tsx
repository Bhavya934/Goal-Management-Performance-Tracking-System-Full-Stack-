"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { logoutAction } from "@/lib/actions/auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Target,
  LayoutDashboard,
  PlusCircle,
  ClipboardCheck,
  Users,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Calendar,
  Unlock,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["EMPLOYEE", "MANAGER", "ADMIN"],
  },
  {
    title: "My Goals",
    href: "/dashboard/goals",
    icon: Target,
    roles: ["EMPLOYEE", "MANAGER", "ADMIN"],
  },
  {
    title: "Create Goal",
    href: "/dashboard/goals/create",
    icon: PlusCircle,
    roles: ["EMPLOYEE"],
  },
  {
    title: "Approvals",
    href: "/dashboard/approvals",
    icon: ClipboardCheck,
    roles: ["MANAGER", "ADMIN"],
  },
  {
    title: "Check-ins",
    href: "/dashboard/check-ins",
    icon: FileCheck,
    roles: ["EMPLOYEE", "MANAGER", "ADMIN"],
  },
  {
    title: "Team",
    href: "/dashboard/team",
    icon: Users,
    roles: ["MANAGER", "ADMIN"],
  },
  {
    title: "Shared Goals",
    href: "/dashboard/shared-goals",
    icon: Users,
    roles: ["MANAGER", "ADMIN"],
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["MANAGER", "ADMIN"],
  },
  {
    title: "Completion",
    href: "/dashboard/completion",
    icon: ClipboardCheck,
    roles: ["ADMIN"],
  },
  {
    title: "Goal Cycles",
    href: "/dashboard/cycles",
    icon: Calendar,
    roles: ["ADMIN"],
  },
  {
    title: "Unlock Goals",
    href: "/dashboard/unlock",
    icon: Unlock,
    roles: ["ADMIN"],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = session?.user?.role ?? "EMPLOYEE";

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(role)
  );

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "U";

  const roleLabel = role === "ADMIN" ? "Admin / HR" : role === "MANAGER" ? "Manager L1" : "Employee";

  const roleColor =
    role === "ADMIN"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : role === "MANAGER"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : "bg-blue-500/10 text-blue-600 dark:text-blue-400";

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shrink-0">
          <Target className="h-5 w-5" />
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold tracking-tight truncate">AtomQuest</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Goals Portal</span>
          </div>
        )}
        {/* Mobile close button */}
        {mobileOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto md:hidden cursor-pointer"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", collapsed && !mobileOpen && "mx-auto")} />
              {(!collapsed || mobileOpen) && <span className="truncate">{item.title}</span>}
            </Link>
          );

          if (collapsed && !mobileOpen) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger className="w-full">{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.href}>{linkContent}</div>;
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 p-3 space-y-2">
        {/* User info */}
        <div className={cn("flex items-center gap-3 p-2 rounded-xl", collapsed && !mobileOpen && "justify-center")}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{session?.user?.name}</span>
              <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full w-fit", roleColor)}>
                {roleLabel}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={cn("flex items-center", collapsed && !mobileOpen ? "flex-col gap-1" : "justify-between")}>
          <ThemeToggle />
          <form action={logoutAction}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={collapsed && !mobileOpen ? "right" : "top"}>Sign out</TooltipContent>
            </Tooltip>
          </form>
          {/* Collapse toggle - desktop only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground cursor-pointer hidden md:flex"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? "right" : "top"}>
              {collapsed ? "Expand" : "Collapse"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden h-10 w-10 rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg cursor-pointer"
        onClick={() => setMobileOpen(true)}
        id="mobile-menu-btn"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-card/95 backdrop-blur-xl border-r border-border/50 transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen border-r border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300 sticky top-0",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
