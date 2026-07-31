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
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label="Otvoriť menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-text">
              {profile.role === "admin"
                ? "Crystal Detailing"
                : profile.organization?.name ?? "Partner"}
            </p>
            <p className="text-xs text-muted">
              {profile.full_name || "Prihlásený používateľ"}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
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
