"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginAction } from "@/lib/actions/auth-actions";
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
import { Target, Loader2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    const result = await loginAction(data);
    if (result?.error) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-chart-1/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/25">
            <Target className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AtomQuest Goals</h1>
          <p className="text-muted-foreground mt-2">
            In-House Goal Setting & Tracking Portal
          </p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access the portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alice@atomquest.com"
                  autoComplete="email"
                  {...register("email")}
                  className="h-11"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center mb-3 font-medium uppercase tracking-wider">
                Demo Accounts
              </p>
              <div className="grid gap-2 text-xs">
                {[
                  { email: "alice@atomquest.com", pass: "alice123", role: "Employee", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
                  { email: "manager@atomquest.com", pass: "manager123", role: "Manager", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
                  { email: "admin@atomquest.com", pass: "admin123", role: "Admin/HR", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
                ].map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${demo.color}`}
                    onClick={() => {
                      const emailInput = document.getElementById("email") as HTMLInputElement;
                      const passwordInput = document.getElementById("password") as HTMLInputElement;
                      if (emailInput && passwordInput) {
                        // Use native setter to trigger React state update
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                          window.HTMLInputElement.prototype,
                          "value"
                        )?.set;
                        nativeInputValueSetter?.call(emailInput, demo.email);
                        emailInput.dispatchEvent(new Event("input", { bubbles: true }));
                        nativeInputValueSetter?.call(passwordInput, demo.pass);
                        passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
                      }
                    }}
                  >
                    <span className="font-medium">{demo.role}</span>
                    <span className="opacity-75">{demo.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          AtomQuest Goals Portal v1.0 • Hackathon 2025
        </p>
      </div>
    </div>
  );
}
