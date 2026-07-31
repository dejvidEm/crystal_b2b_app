"use client";

import { use } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { RequestDetail } from "@/components/orders/request-detail";
import { useProfile } from "@/hooks/use-profile";
import { useRequestDetail } from "@/hooks/use-requests";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: request, isLoading, isError, error } = useRequestDetail(id);

  if (profileLoading || isLoading) {
    return <LoadingSkeleton rows={6} />;
  }

  if (isError) {
    return (
      <EmptyState
        title="Požiadavku sa nepodarilo načítať"
        description={error instanceof Error ? error.message : undefined}
      />
    );
  }

  if (!request || !profile) {
    return (
      <EmptyState
        title="Požiadavka neexistuje"
        description="Požiadavka nebola nájdená alebo k nej nemáte prístup."
      />
    );
  }

  return (
    <div>
      <PageHeader title="Detail požiadavky" />
      <RequestDetail request={request} role={profile.role} />
    </div>
  );
}
