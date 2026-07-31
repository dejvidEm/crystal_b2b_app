"use client";

import Link from "next/link";
import { ClipboardList, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { RequestCard } from "@/components/orders/request-card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { useRequests } from "@/hooks/use-requests";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OrdersPage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: requests = [], isLoading, isError, error } = useRequests();

  useEffect(() => {
    if (!profileLoading && profile?.role === "admin") {
      router.replace("/dashboard");
    }
  }, [profile, profileLoading, router]);

  if (profileLoading || isLoading) {
    return <LoadingSkeleton rows={6} />;
  }

  if (profile?.role === "admin") {
    return null;
  }

  if (isError) {
    return (
      <EmptyState
        title="Požiadavky sa nepodarilo načítať"
        description={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Moje požiadavky"
        description="Prehľad všetkých servisných požiadaviek vašej organizácie."
        actions={
          <Button asChild>
            <Link href="/orders/new">
              <PlusCircle className="h-4 w-4" />
              Nová požiadavka
            </Link>
          </Button>
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Zatiaľ žiadne požiadavky"
          description="Po odoslaní sa tu zobrazia všetky vaše požiadavky a ich stavy."
          actionLabel="Nová požiadavka"
          onAction={() => router.push("/orders/new")}
        />
      ) : (
        <div className="grid gap-3">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
