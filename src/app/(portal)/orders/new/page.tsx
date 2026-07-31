"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoadingSkeleton } from "@/components/layout/loading-skeleton";
import { NewRequestForm } from "@/components/orders/new-request-form";
import { useProfile } from "@/hooks/use-profile";

export default function NewOrderPage() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();

  useEffect(() => {
    if (!isLoading && profile?.role === "admin") {
      router.replace("/unauthorized");
    }
  }, [profile, isLoading, router]);

  if (isLoading || !profile) {
    return <PageLoadingSkeleton />;
  }

  if (profile.role === "admin") {
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Nová požiadavka"
        description="Odošlite požiadavku na servis. Termín je platný až po potvrdení tímom Crystal Detailing."
      />
      <NewRequestForm profile={profile} />
    </div>
  );
}
