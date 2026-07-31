"use client";

import Link from "next/link";
import {
  CalendarCheck2,
  Car,
  CheckCircle2,
  ClipboardList,
  PlusCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import {
  PageLoadingSkeleton,
  StatCardsSkeleton,
} from "@/components/layout/loading-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { RequestCard } from "@/components/orders/request-card";
import { RequestTable } from "@/components/orders/request-table";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { useDashboardStats } from "@/hooks/use-requests";
import { formatDateSk, getRequestPackageLabel } from "@/lib/utils";

export function DashboardPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const {
    data: stats,
    isLoading,
    isError,
    error,
  } = useDashboardStats(profile?.role);

  if (profileLoading || isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!profile) {
    return null;
  }

  if (isError) {
    return (
      <EmptyState
        title="Prehľad sa nepodarilo načítať"
        description={error instanceof Error ? error.message : undefined}
      />
    );
  }

  if (!stats) {
    return <StatCardsSkeleton />;
  }

  if (profile.role === "admin") {
    return (
      <div>
        <PageHeader
          title="Prehľad"
          description="Prehľad požiadaviek všetkých B2B partnerov."
        />

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Čakajúce požiadavky"
            value={stats.pendingCount}
            icon={ClipboardList}
          />
          <StatCard
            label="Potvrdené nadchádzajúce"
            value={stats.confirmedUpcomingCount}
            icon={CalendarCheck2}
          />
          <StatCard
            label="Vozidlá tento mesiac"
            value={stats.vehiclesThisMonth}
            icon={Car}
            hint="Potvrdené, prebiehajúce a dokončené"
          />
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text">
            Čakajúce a nedávne požiadavky
          </h2>
          {stats.pendingRequests.length === 0 &&
          stats.recentRequests.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Zatiaľ žiadne požiadavky"
              description="Keď partneri odošlú požiadavky, zobrazia sa tu."
            />
          ) : (
            <RequestTable
              requests={
                stats.pendingRequests.length > 0
                  ? stats.pendingRequests
                  : stats.recentRequests
              }
              showOrganization
              showActions
            />
          )}
        </section>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Prehľad"
        description="Spravujte servisné požiadavky pre vašu organizáciu."
        actions={
          <Button asChild>
            <Link href="/orders/new">
              <PlusCircle className="h-4 w-4" />
              Nová požiadavka
            </Link>
          </Button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Čakajúce požiadavky"
          value={stats.pendingCount}
          icon={ClipboardList}
        />
        <StatCard
          label="Dokončené požiadavky"
          value={stats.completedCount}
          icon={CheckCircle2}
        />
        <div className="rounded-[12px] border border-border bg-surface p-5 sm:col-span-2 xl:col-span-1">
          <p className="text-sm text-muted">Najbližší potvrdený servis</p>
          {stats.nextConfirmed ? (
            <div className="mt-3 space-y-1">
              <p className="text-xl font-semibold text-text">
                {formatDateSk(stats.nextConfirmed.requested_date)}
              </p>
              <p className="text-sm text-muted">
                {stats.nextConfirmed.reference_code} ·{" "}
                {getRequestPackageLabel(stats.nextConfirmed.service_package)} ·{" "}
                {stats.nextConfirmed.vehicle_count} voz.
              </p>
              <Button asChild variant="link" className="h-auto px-0">
                <Link href={`/orders/${stats.nextConfirmed.id}`}>
                  Otvoriť detail
                </Link>
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Momentálne nemáte potvrdený termín.
            </p>
          )}
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text">Nedávne požiadavky</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/orders">Všetky</Link>
          </Button>
        </div>
        {stats.recentRequests.length === 0 ? (
          <EmptyState
            icon={PlusCircle}
            title="Zatiaľ žiadne požiadavky"
            description="Vytvorte prvú požiadavku na servis vozidiel."
            actionLabel="Nová požiadavka"
            onAction={() => {
              window.location.href = "/orders/new";
            }}
          />
        ) : (
          <div className="grid gap-3">
            {stats.recentRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
