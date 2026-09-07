"use client";

import { useState } from "react";
import { createGoalCycle, toggleCycleActive } from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Calendar,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Power,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface CyclesPageProps {
  cycles: any[];
}

export function CyclesPage({ cycles }: CyclesPageProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(false);

  const handleCreate = async () => {
    if (!name || !startDate || !endDate) {
      toast.error("All fields are required");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createGoalCycle({ name, startDate, endDate, isActive });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Goal cycle created!");
        setDialogOpen(false);
        setName("");
        setStartDate("");
        setEndDate("");
        setIsActive(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (cycleId: string) => {
    setToggling(cycleId);
    try {
      const result = await toggleCycleActive(cycleId);
      if (result.error) toast.error(result.error);
      else toast.success("Cycle updated!");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Goal Cycles
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage goal setting periods
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              New Cycle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Goal Cycle</DialogTitle>
              <DialogDescription>
                Define a new goal setting period
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cycle Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., FY 2025-26"
                />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Set as active cycle</span>
              </label>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={submitting}
                  className="cursor-pointer"
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Goals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No goal cycles created yet
                  </TableCell>
                </TableRow>
              ) : (
                cycles.map((cycle: any) => (
                  <TableRow key={cycle.id}>
                    <TableCell className="font-medium">{cycle.name}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(cycle.startDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(cycle.endDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {cycle._count.goals}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {cycle.isActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(cycle.id)}
                        disabled={toggling === cycle.id}
                        className="cursor-pointer"
                      >
                        {toggling === cycle.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
