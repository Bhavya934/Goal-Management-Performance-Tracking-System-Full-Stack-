"use client";

import { useState } from "react";
import { createSharedGoal } from "@/lib/actions/admin-actions";
import { uomLabels, thrustAreas } from "@/lib/schemas";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Target,
  Loader2,
  CheckCircle2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SharedGoalsPageProps {
  sharedGoals: any[];
  employees: Array<{
    id: string;
    name: string;
    email: string;
    department: string;
  }>;
}

export function SharedGoalsPage({
  sharedGoals,
  employees,
}: SharedGoalsPageProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Form state
  const [thrustArea, setThrustArea] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uom, setUom] = useState("");
  const [target, setTarget] = useState("");
  const [weightage, setWeightage] = useState("");

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!thrustArea || !title || !description || !uom || !target || !weightage) {
      toast.error("Please fill all fields");
      return;
    }
    if (selectedUsers.length === 0) {
      toast.error("Select at least one employee");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createSharedGoal({
        thrustArea,
        title,
        description,
        uom,
        target: parseFloat(target),
        assignedUserIds: selectedUsers,
        weightage: parseFloat(weightage),
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Shared goal created and assigned!");
        setDialogOpen(false);
        resetForm();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setThrustArea("");
    setTitle("");
    setDescription("");
    setUom("");
    setTarget("");
    setWeightage("");
    setSelectedUsers([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Shared Goals
          </h1>
          <p className="text-muted-foreground text-sm">
            Create and manage goals shared across team members
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Create Shared Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Shared Goal</DialogTitle>
              <DialogDescription>
                This goal will be added to each selected employee's goal sheet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Thrust Area *</Label>
                <Select value={thrustArea} onValueChange={setThrustArea}>
                  <SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Goal title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Goal description..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid gap-4 grid-cols-3">
                <div className="space-y-2">
                  <Label>UoM *</Label>
                  <Select value={uom} onValueChange={setUom}>
                    <SelectTrigger>
                      <SelectValue placeholder="UoM" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(uomLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target *</Label>
                  <Input
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="Target"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weightage % *</Label>
                  <Input
                    type="number"
                    value={weightage}
                    onChange={(e) => setWeightage(e.target.value)}
                    placeholder="10-100"
                    min={10}
                    max={100}
                  />
                </div>
              </div>

              {/* Employee Selection */}
              <div className="space-y-2">
                <Label>Assign to Employees *</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-[200px] overflow-y-auto">
                  {employees.map((emp) => (
                    <label
                      key={emp.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        selectedUsers.includes(emp.id)
                          ? "bg-primary/10"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(emp.id)}
                        onChange={() => toggleUser(emp.id)}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{emp.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {emp.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedUsers.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedUsers.length} employee(s) selected
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4 mr-2" />
                  )}
                  Create & Assign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Shared Goals List */}
      {sharedGoals.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No shared goals yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-md">
              Create shared goals to assign the same objective across multiple
              team members.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sharedGoals.map((sg: any) => (
            <Card key={sg.id} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{sg.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {sg.thrustArea} • Created by {sg.createdBy.name} •{" "}
                        Target: {sg.target}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {sg.goals.length} assigned
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">
                  {sg.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sg.goals.map((goal: any) => (
                    <Badge
                      key={goal.id}
                      variant="outline"
                      className="text-xs"
                    >
                      <User className="h-3 w-3 mr-1" />
                      {goal.user.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
