"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { VehiclesPage } from "@/components/vehicles/vehicles-page";
import { PageLoadingSkeleton } from "@/components/layout/loading-skeleton";
import { useProfile } from "@/hooks/use-profile";

export default function VehiclesRoute() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();

  useEffect(() => {
    if (!isLoading && profile?.role === "admin") {
      router.replace("/dashboard");
    }
  }, [profile, isLoading, router]);

  if (isLoading || !profile) {
    return <PageLoadingSkeleton />;
  }

  if (profile.role === "admin") {
    return null;
  }

  return <VehiclesPage />;
}
