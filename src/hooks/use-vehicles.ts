"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import {
  createVehicle,
  fetchActiveVehicles,
  fetchVehicles,
  setVehicleActive,
  updateVehicle,
} from "@/lib/queries/vehicles";
import type { VehicleInput, VehicleListFilters } from "@/types";
import { useProfile } from "@/hooks/use-profile";

export function useVehicles(filters: VehicleListFilters) {
  return useQuery({
    queryKey: queryKeys.vehicles.list({
      category: filters.category,
      status: filters.status,
      search: filters.search,
    }),
    queryFn: () => fetchVehicles(createClient(), filters),
  });
}

export function useActiveVehicles() {
  return useQuery({
    queryKey: queryKeys.vehicles.active,
    queryFn: () => fetchActiveVehicles(createClient()),
    staleTime: 60_000,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (input: VehicleInput) => {
      if (!profile?.organization_id || !profile.id) {
        throw new Error("Chýba organizácia alebo profil.");
      }
      return createVehicle(
        createClient(),
        input,
        profile.organization_id,
        profile.id,
      );
    },
    onSuccess: async () => {
      toast.success("Vozidlo bolo pridané do evidencie");
      await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nepodarilo sa pridať vozidlo");
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: VehicleInput }) =>
      updateVehicle(createClient(), id, input),
    onSuccess: async () => {
      toast.success("Vozidlo bolo uložené");
      await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nepodarilo sa uložiť vozidlo");
    },
  });
}

export function useSetVehicleActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setVehicleActive(createClient(), id, isActive),
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.isActive
          ? "Vozidlo bolo obnovené"
          : "Vozidlo bolo archivované",
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nepodarilo sa zmeniť stav vozidla");
    },
  });
}
