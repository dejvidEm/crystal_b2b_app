"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItems } from "@/components/layout/app-sidebar";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

type MobileNavigationProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: UserRole;
  onSignOut: () => void;
};

export function MobileNavigation({
  open,
  onOpenChange,
  role,
  onSignOut,
}: MobileNavigationProps) {
  const pathname = usePathname();
  const items = getNavItems(role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-0 top-0 h-full max-w-xs translate-x-0 translate-y-0 rounded-none border-r sm:rounded-none">
        <DialogHeader>
          <DialogTitle className="sr-only">Navigácia</DialogTitle>
          <Logo />
        </DialogHeader>
        <nav className="mt-4 space-y-1" aria-label="Mobilná navigácia">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                item.href !== "/orders/new" &&
                pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium",
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-white/5 hover:text-text",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button
          variant="outline"
          className="mt-6 w-full"
          onClick={() => onSignOut()}
        >
          Odhlásiť sa
        </Button>
      </DialogContent>
    </Dialog>
  );
}
