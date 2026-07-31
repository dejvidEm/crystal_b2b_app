"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PageLoadingSkeleton } from "@/components/layout/loading-skeleton";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { useProfile } from "@/hooks/use-profile";

export default function CalendarPage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div>
      <PageHeader
        title="Kalendár"
        description={
          profile.role === "admin"
            ? "Prehľad požiadaviek všetkých partnerov podľa požadovaného dátumu."
            : "Prehľad požiadaviek vašej organizácie podľa požadovaného dátumu."
        }
      />
      <MonthCalendar role={profile.role} />
    </div>
  );
}
