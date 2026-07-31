"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  createServiceRequest,
  fetchCalendarRequests,
  fetchDashboardStats,
  fetchRequestDetail,
  fetchRequests,
  updateRequestStatus,
} from "@/lib/queries/requests";
import { queryKeys } from "@/lib/queries/keys";
import type {
  CreateServiceRequestInput,
  RequestStatus,
  UserRole,
} from "@/types";

export function useDashboardStats(role: UserRole | undefined) {
  return useQuery({
    queryKey: [...queryKeys.dashboard, role],
    queryFn: () =>
      fetchDashboardStats(createClient(), role ?? "partner"),
    enabled: Boolean(role),
  });
}

export function useRequests(status?: RequestStatus) {
  return useQuery({
    queryKey: queryKeys.requests.list({ status }),
    queryFn: () => fetchRequests(createClient(), { status }),
  });
}

export function useCalendarRequests(from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.requests.calendar(from, to),
    queryFn: () => fetchCalendarRequests(createClient(), from, to),
    enabled: Boolean(from && to),
  });
}

export function useRequestDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.requests.detail(id),
    queryFn: () => fetchRequestDetail(createClient(), id),
    enabled: Boolean(id),
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateServiceRequestInput) =>
      createServiceRequest(createClient(), input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      status,
      adminNote,
    }: {
      requestId: string;
      status: RequestStatus;
      adminNote?: string;
    }) => updateRequestStatus(createClient(), requestId, status, adminNote),
    onSuccess: async (_data, variables) => {
      toast.success("Stav požiadavky bol aktualizovaný");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.requests.detail(variables.requestId),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nepodarilo sa aktualizovať stav");
    },
  });
}
