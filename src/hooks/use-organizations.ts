"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import {
  fetchOrganizations,
  updateOrganizationMinVehicles,
} from "@/lib/queries/organizations";

export function useOrganizations() {
  return useQuery({
    queryKey: queryKeys.organizations.all,
    queryFn: () => fetchOrganizations(createClient()),
  });
}

export function useUpdateOrganizationMinVehicles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      minVehicles,
    }: {
      organizationId: string;
      minVehicles: number;
    }) =>
      updateOrganizationMinVehicles(
        createClient(),
        organizationId,
        minVehicles,
      ),
    onSuccess: async () => {
      toast.success("Minimálny odber bol uložený");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.all,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nepodarilo sa uložiť minimálny odber");
    },
  });
}
