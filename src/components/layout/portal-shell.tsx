"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PageLoadingSkeleton } from "@/components/layout/loading-skeleton";
import { useProfile } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";

export function PortalShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: profile, isLoading, isError, error } = useProfile();

  useEffect(() => {
    async function handleInvalid() {
      if (isLoading) return;
      if (!profile || !profile.is_active) {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace("/unauthorized");
      }
    }
    void handleInvalid();
  }, [profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <PageLoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-sm text-rose-300">
          {error instanceof Error
            ? error.message
            : "Nepodarilo sa načítať profil"}
        </p>
      </div>
    );
  }

  if (!profile || !profile.is_active) {
    return (
      <div className="min-h-screen bg-background p-6">
        <PageLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <AppSidebar role={profile.role} />
      </div>
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <AppHeader profile={profile} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
