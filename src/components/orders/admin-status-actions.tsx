"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ADMIN_STATUS_ACTIONS, CANCEL_UNDO_SECONDS } from "@/config/constants";
import { usePendingCancel } from "@/hooks/use-pending-cancel";
import { useUpdateRequestStatus } from "@/hooks/use-requests";
import type { RequestStatus } from "@/types";

type AdminStatusActionsProps = {
  requestId: string;
  referenceCode: string;
  status: RequestStatus;
  size?: "default" | "sm";
  className?: string;
  fullWidth?: boolean;
};

export function AdminStatusActions({
  requestId,
  referenceCode,
  status,
  size = "default",
  className,
  fullWidth = false,
}: AdminStatusActionsProps) {
  const updateStatus = useUpdateRequestStatus();
  const { startCancel, isPendingCancel } = usePendingCancel();
  const [cancelOpen, setCancelOpen] = useState(false);

  const actions =
    ADMIN_STATUS_ACTIONS[status as keyof typeof ADMIN_STATUS_ACTIONS] ?? [];

  if (actions.length === 0 || isPendingCancel(requestId)) {
    return null;
  }

  return (
    <>
      <div className={className ?? "flex flex-col gap-2 sm:flex-row sm:flex-wrap"}>
        {actions.map((action) => {
          const isCancel = action.status === "cancelled";
          return (
            <Button
              key={action.status}
              size={size}
              variant={action.variant}
              disabled={updateStatus.isPending}
              className={
                fullWidth ? "min-h-11 w-full sm:w-auto" : undefined
              }
              onClick={() => {
                if (isCancel) {
                  setCancelOpen(true);
                  return;
                }
                updateStatus.mutate({
                  requestId,
                  status: action.status as RequestStatus,
                });
              }}
            >
              {action.label}
            </Button>
          );
        })}
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Zrušiť požiadavku?"
        description={`Po potvrdení máte ${CANCEL_UNDO_SECONDS} sekúnd na vrátenie. Partner uvidí zrušenie až po uplynutí tejto doby, pokiaľ akciu dovtedy nevrátite.`}
        confirmLabel="Áno, zrušiť"
        cancelLabel="Nechať"
        destructive
        onConfirm={() => {
          setCancelOpen(false);
          startCancel({
            requestId,
            referenceCode,
            previousStatus: status,
          });
        }}
      />
    </>
  );
}
