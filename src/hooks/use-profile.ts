"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchProfile } from "@/lib/queries/requests";
import { queryKeys } from "@/lib/queries/keys";

export function useProfile() {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => fetchProfile(supabase),
    staleTime: 5 * 60_000,
  });
}
