"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, UserRound } from "lucide-react";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { ProfileWithOrganization } from "@/types";

export function AppHeader({ profile }: { profile: ProfileWithOrganization }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 lg:hidden"
            aria-label="Otvoriť menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="min-w-0 sm:block">
            <p className="truncate text-sm font-medium text-text">
              {profile.role === "admin"
                ? "Crystal Detailing"
                : profile.organization?.name ?? "Partner"}
            </p>
            <p className="hidden truncate text-xs text-muted sm:block">
              {profile.full_name || "Prihlásený používateľ"}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-11 gap-2 md:h-10">
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">Účet</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-muted"
              onSelect={(e) => e.preventDefault()}
            >
              {profile.role === "admin" ? "Administrátor" : "Partner"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Odhlásiť sa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <MobileNavigation
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        role={profile.role}
        onSignOut={() => void signOut()}
      />
    </>
  );
}
