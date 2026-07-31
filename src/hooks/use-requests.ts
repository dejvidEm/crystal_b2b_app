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
  const supabase = createClient();

  return useQuery({
    queryKey: [...queryKeys.dashboard, role],
    queryFn: () => fetchDashboardStats(supabase, role ?? "partner"),
    enabled: Boolean(role),
  });
}

export function useRequests(status?: RequestStatus) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.requests.list({ status }),
    queryFn: () => fetchRequests(supabase, { status }),
  });
}

export function useCalendarRequests(from: string, to: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.requests.calendar(from, to),
    queryFn: () => fetchCalendarRequests(supabase, from, to),
    enabled: Boolean(from && to),
  });
}

export function useRequestDetail(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.requests.detail(id),
    queryFn: () => fetchRequestDetail(supabase, id),
    enabled: Boolean(id),
  });
}

export function useCreateRequest() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateServiceRequestInput) =>
      createServiceRequest(supabase, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateRequestStatus() {
  const supabase = createClient();
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
    }) => updateRequestStatus(supabase, requestId, status, adminNote),
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
