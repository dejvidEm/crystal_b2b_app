"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  PlusCircle,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Prehľad",
    icon: LayoutDashboard,
    roles: ["admin", "partner"],
  },
  {
    href: "/orders/new",
    label: "Nová požiadavka",
    icon: PlusCircle,
    roles: ["partner"],
  },
  {
    href: "/orders",
    label: "Moje požiadavky",
    icon: ClipboardList,
    roles: ["partner"],
  },
  {
    href: "/calendar",
    label: "Kalendár",
    icon: CalendarDays,
    roles: ["admin", "partner"],
  },
];

export function getNavItems(role: UserRole) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function AppSidebar({
  role,
  className,
}: {
  role: UserRole;
  className?: string;
}) {
  const pathname = usePathname();
  const items = getNavItems(role);

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-surface",
        className,
      )}
    >
      <div className="border-b border-border px-5 py-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Hlavná navigácia">
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
              className={cn(
                "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-white/5 hover:text-text",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-5 py-4 text-xs text-muted">
        Crystal Detailing Bratislava
      </div>
    </aside>
  );
}
