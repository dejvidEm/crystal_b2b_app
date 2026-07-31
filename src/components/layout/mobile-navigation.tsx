"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { getNavItems } from "@/components/layout/app-sidebar";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
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
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="mobile-nav-overlay fixed inset-0 z-50 bg-black/70" />
        <DialogPrimitive.Content
          className={cn(
            "mobile-nav-panel fixed inset-y-0 left-0 z-50 flex h-full w-[min(100%,20rem)] flex-col",
            "border-r border-border bg-surface px-5 pt-[max(1.25rem,env(safe-area-inset-top))] shadow-2xl outline-none",
            "pb-[max(1.25rem,env(safe-area-inset-bottom))]",
          )}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            Navigácia
          </DialogPrimitive.Title>

          <div className="flex items-start justify-between gap-3">
            <Logo />
            <DialogPrimitive.Close
              className="rounded-[8px] p-2 text-muted transition-colors hover:bg-white/5 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              aria-label="Zavrieť menu"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <nav className="mt-8 flex-1 space-y-1" aria-label="Mobilná navigácia">
            {items.map((item, index) => {
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
                  style={{ animationDelay: `${80 + index * 40}ms` }}
                  className={cn(
                    "mobile-nav-item flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors",
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
            className="mt-auto w-full"
            onClick={() => onSignOut()}
          >
            Odhlásiť sa
          </Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
