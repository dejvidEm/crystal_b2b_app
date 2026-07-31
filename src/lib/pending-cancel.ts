import type { RequestStatus } from "@/types";
import { CANCEL_UNDO_SECONDS } from "@/config/constants";

export type PendingCancel = {
  requestId: string;
  referenceCode: string;
  previousStatus: RequestStatus;
  startedAt: number;
  endsAt: number;
};

type Listener = () => void;

let pending: PendingCancel | null = null;
let timeoutId: ReturnType<typeof setTimeout> | null = null;
let tickId: ReturnType<typeof setInterval> | null = null;
let onCommit: ((pending: PendingCancel) => void | Promise<void>) | null = null;

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function clearTimers() {
  if (timeoutId != null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  if (tickId != null) {
    clearInterval(tickId);
    tickId = null;
  }
}

export function getPendingCancel() {
  return pending;
}

export function subscribePendingCancel(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setPendingCancelCommitHandler(
  handler: ((item: PendingCancel) => void | Promise<void>) | null,
) {
  onCommit = handler;
}

export function schedulePendingCancel(input: {
  requestId: string;
  referenceCode: string;
  previousStatus: RequestStatus;
}) {
  clearTimers();

  const startedAt = Date.now();
  pending = {
    requestId: input.requestId,
    referenceCode: input.referenceCode,
    previousStatus: input.previousStatus,
    startedAt,
    endsAt: startedAt + CANCEL_UNDO_SECONDS * 1000,
  };
  emit();

  tickId = setInterval(() => emit(), 250);

  timeoutId = setTimeout(() => {
    const current = pending;
    clearTimers();
    pending = null;
    emit();
    if (current && onCommit) {
      void onCommit(current);
    }
  }, CANCEL_UNDO_SECONDS * 1000);

  return pending;
}

export function undoPendingCancel() {
  if (!pending) return null;
  const restored = pending;
  clearTimers();
  pending = null;
  emit();
  return restored;
}

export function isPendingCancel(requestId: string) {
  return pending?.requestId === requestId;
}

export function getPendingCancelSecondsLeft() {
  if (!pending) return 0;
  return Math.max(0, Math.ceil((pending.endsAt - Date.now()) / 1000));
}
