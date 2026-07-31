"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { CANCEL_UNDO_SECONDS } from "@/config/constants";
import { queryKeys } from "@/lib/queries/keys";
import { updateRequestStatus } from "@/lib/queries/requests";
import {
  getPendingCancel,
  getPendingCancelSecondsLeft,
  schedulePendingCancel,
  setPendingCancelCommitHandler,
  subscribePendingCancel,
  undoPendingCancel,
  type PendingCancel,
} from "@/lib/pending-cancel";
import type {
  RequestStatus,
  ServiceRequestDetail,
  ServiceRequestListItem,
} from "@/types";

function patchRequestStatusInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  requestId: string,
  status: RequestStatus,
) {
  queryClient.setQueryData<ServiceRequestDetail | null>(
    queryKeys.requests.detail(requestId),
    (current) => (current ? { ...current, status } : current),
  );

  queryClient.setQueriesData<ServiceRequestListItem[]>(
    { queryKey: queryKeys.requests.all },
    (current) => {
      if (!Array.isArray(current)) return current;
      return current.map((item) =>
        item.id === requestId ? { ...item, status } : item,
      );
    },
  );
}

/** Register the delayed DB commit once (e.g. from the admin banner). */
export function usePendingCancelCommit() {
  const queryClient = useQueryClient();

  useEffect(() => {
    setPendingCancelCommitHandler(async (item) => {
      try {
        await updateRequestStatus(createClient(), item.requestId, "cancelled");
        toast.success("Požiadavka bola zrušená");
        await queryClient.invalidateQueries({
          queryKey: queryKeys.requests.detail(item.requestId),
        });
        await queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      } catch (error) {
        patchRequestStatusInCache(
          queryClient,
          item.requestId,
          item.previousStatus,
        );
        toast.error(
          error instanceof Error
            ? error.message
            : "Nepodarilo sa zrušiť požiadavku",
        );
      }
    });

    return () => setPendingCancelCommitHandler(null);
  }, [queryClient]);
}

export function usePendingCancel() {
  const queryClient = useQueryClient();
  const pending = useSyncExternalStore(
    subscribePendingCancel,
    getPendingCancel,
    () => null,
  );
  const secondsLeft = getPendingCancelSecondsLeft();

  function startCancel(input: {
    requestId: string;
    referenceCode: string;
    previousStatus: RequestStatus;
  }) {
    if (input.previousStatus === "cancelled") return;

    const existing = getPendingCancel();
    if (existing && existing.requestId !== input.requestId) {
      toast.error("Najprv dokončite alebo vráťte prebiehajúce zrušenie.");
      return;
    }

    schedulePendingCancel(input);
    patchRequestStatusInCache(queryClient, input.requestId, "cancelled");

    toast.message(`Požiadavka ${input.referenceCode} sa zruší`, {
      description: `Partner ešte zrušenie nevidí. Máte ${CANCEL_UNDO_SECONDS} s na vrátenie.`,
      duration: CANCEL_UNDO_SECONDS * 1000,
      action: {
        label: "Vrátiť",
        onClick: () => undoCancel(),
      },
    });
  }

  function undoCancel() {
    const restored = undoPendingCancel();
    if (!restored) return;

    patchRequestStatusInCache(
      queryClient,
      restored.requestId,
      restored.previousStatus,
    );
    toast.success("Zrušenie bolo vrátené");
  }

  return {
    pending,
    secondsLeft,
    startCancel,
    undoCancel,
    isPendingCancel: (requestId: string) => pending?.requestId === requestId,
  };
}

export type { PendingCancel };
