"use client";

import { Button } from "@/components/ui/button";
import { CANCEL_UNDO_SECONDS } from "@/config/constants";
import {
  usePendingCancel,
  usePendingCancelCommit,
} from "@/hooks/use-pending-cancel";

export function PendingCancelBanner() {
  usePendingCancelCommit();
  const { pending, secondsLeft, undoCancel } = usePendingCancel();

  if (!pending) return null;

  return (
    <div className="mb-5 rounded-[12px] border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-amber-100">
            Rušíte požiadavku {pending.referenceCode}
          </p>
          <p className="mt-1 text-sm text-amber-100/80">
            Partner zrušenie ešte nevidí. Na vrátenie ostáva {secondsLeft} s.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 shrink-0"
          onClick={undoCancel}
        >
          Vrátiť zrušenie
        </Button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-amber-500/20">
        <div
          className="h-full rounded-full bg-amber-400 transition-[width] duration-200 ease-linear"
          style={{
            width: `${Math.max(
              0,
              (secondsLeft / CANCEL_UNDO_SECONDS) * 100,
            )}%`,
          }}
        />
      </div>
    </div>
  );
}
