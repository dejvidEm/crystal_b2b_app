"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OrganizationsPage } from "@/components/organizations/organizations-page";
import { PageLoadingSkeleton } from "@/components/layout/loading-skeleton";
import { useProfile } from "@/hooks/use-profile";

export default function OrganizationsRoute() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();

  useEffect(() => {
    if (!isLoading && profile && profile.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [profile, isLoading, router]);

  if (isLoading || !profile) {
    return <PageLoadingSkeleton />;
  }

  if (profile.role !== "admin") {
    return null;
  }

  return <OrganizationsPage />;
}
