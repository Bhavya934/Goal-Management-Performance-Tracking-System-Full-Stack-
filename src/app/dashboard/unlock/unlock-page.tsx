"use client";

import { useState } from "react";
import { unlockUserGoals } from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Unlock,
  Lock,
  Loader2,
  Target,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UnlockPageProps {
  users: any[];
}

export function UnlockPage({ users }: UnlockPageProps) {
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const handleUnlock = async (userId: string) => {
    setUnlocking(userId);
    try {
      const result = await unlockUserGoals(userId);
      if (result.error) toast.error(result.error);
      else toast.success(`${result.count} goals unlocked!`);
    } finally {
      setUnlocking(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Unlock className="h-6 w-6 text-primary" />
          Unlock Goals
        </h1>
        <p className="text-muted-foreground text-sm">
          Unlock locked goals to allow modifications
        </p>
      </div>

      {users.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No locked goals</h3>
            <p className="text-muted-foreground text-sm text-center max-w-md">
              There are no locked goals to unlock right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Warning */}
          <div className="p-4 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm border border-amber-500/20 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Admin Action</p>
              <p className="text-xs mt-1 opacity-80">
                Unlocking goals will change their status from "Locked" back to
                "Approved", allowing employees to make check-ins and managers to
                modify them.
              </p>
            </div>
          </div>

          {users.map((user: any) => {
            const initials = user.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase();

            return (
              <Card key={user.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{user.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {user.email} • {user.goals.length} locked goal(s)
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnlock(user.id)}
                      disabled={unlocking === user.id}
                      className="cursor-pointer"
                    >
                      {unlocking === user.id ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Unlock All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {user.goals.map((goal: any, i: number) => (
                      <div
                        key={goal.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30"
                      >
                        <Lock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="text-sm font-medium flex-1 truncate">
                          {goal.title}
                        </span>
                        <Badge variant="secondary" className="text-xs font-mono">
                          {goal.weightage}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
