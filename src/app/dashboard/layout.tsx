import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/components/auth-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <AuthProvider>
      <TooltipProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto max-w-7xl p-4 pt-16 md:p-6 md:pt-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </AuthProvider>
  );
}
