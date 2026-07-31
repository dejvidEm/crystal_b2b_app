"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { CalendarEvent } from "@/components/calendar/calendar-event";
import { RequestDetail } from "@/components/orders/request-detail";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { useCalendarRequests, useRequestDetail } from "@/hooks/use-requests";
import {
  addMonths,
  cn,
  format,
  formatDateSk,
  formatMonthYearSk,
  getMonthMatrix,
  getMonthRangeIso,
  isSameMonth,
  isToday,
  sk,
  subMonths,
} from "@/lib/utils";
import type { ServiceRequestListItem, UserRole } from "@/types";

const WEEKDAYS = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

export function MonthCalendar({ role }: { role: UserRole }) {
  const [month, setMonth] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const range = useMemo(() => getMonthRangeIso(month), [month]);
  const days = useMemo(() => getMonthMatrix(month), [month]);

  const { data: requests = [], isLoading, isError, error } = useCalendarRequests(
    range.from,
    range.to,
  );

  const detailQuery = useRequestDetail(selectedId ?? "");

  const byDate = useMemo(() => {
    const map = new Map<string, ServiceRequestListItem[]>();
    for (const request of requests) {
      const list = map.get(request.requested_date) ?? [];
      list.push(request);
      map.set(request.requested_date, list);
    }
    return map;
  }, [requests]);

  const agenda = useMemo(
    () =>
      [...requests].sort((a, b) =>
        a.requested_date.localeCompare(b.requested_date),
      ),
    [requests],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="min-w-0 flex-1 text-lg font-semibold capitalize text-text sm:text-xl">
          {formatMonthYearSk(month)}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 md:h-10 md:w-10"
            aria-label="Predchádzajúci mesiac"
            onClick={() => setMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-11 md:h-10"
            onClick={() => setMonth(new Date())}
          >
            Dnes
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 md:h-10 md:w-10"
            aria-label="Nasledujúci mesiac"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {isLoading ? <LoadingSkeleton rows={6} /> : null}
      {isError ? (
        <EmptyState
          title="Kalendár sa nepodarilo načítať"
          description={error instanceof Error ? error.message : undefined}
        />
      ) : null}

      {!isLoading && !isError ? (
        <>
          <div className="hidden overflow-hidden rounded-[12px] border border-border md:block">
            <div className="grid grid-cols-7 border-b border-border bg-surface-elevated">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 bg-surface">
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayRequests = byDate.get(key) ?? [];
                const inMonth = isSameMonth(day, month);

                return (
                  <div
                    key={key}
                    className={cn(
                      "min-h-28 border-b border-r border-border/70 p-2",
                      !inMonth && "bg-background/40 opacity-50",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs",
                          isToday(day)
                            ? "bg-accent text-background font-semibold"
                            : "text-muted",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayRequests.slice(0, 3).map((request) => (
                        <CalendarEvent
                          key={request.id}
                          request={request}
                          role={role}
                          compact
                          onClick={() => setSelectedId(request.id)}
                        />
                      ))}
                      {dayRequests.length > 3 ? (
                        <p className="px-1 text-[11px] text-muted">
                          +{dayRequests.length - 3} ďalšie
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:hidden">
            <h3 className="mb-3 text-sm font-semibold text-text">Agenda</h3>
            {agenda.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Žiadne požiadavky v tomto mesiaci"
                description="Po odoslaní alebo potvrdení požiadaviek sa tu zobrazia termíny."
              />
            ) : (
              <div className="space-y-2">
                {agenda.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-[12px] border border-border bg-surface p-3"
                  >
                    <p className="mb-2 text-xs text-muted">
                      {formatDateSk(request.requested_date)} ·{" "}
                      {format(parseDateSafe(request.requested_date), "EEEE", {
                        locale: sk,
                      })}
                    </p>
                    <CalendarEvent
                      request={request}
                      role={role}
                      onClick={() => setSelectedId(request.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}

      <Dialog
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent
          hideClose
          className="flex max-h-[min(90vh,900px)] w-[calc(100%-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100%-2rem)]"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6">
            <DialogHeader className="pr-0">
              <DialogTitle>Detail požiadavky</DialogTitle>
            </DialogHeader>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              aria-label="Zavrieť"
              onClick={() => setSelectedId(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {detailQuery.isLoading ? <LoadingSkeleton rows={4} /> : null}
            {detailQuery.data ? (
              <RequestDetail
                request={detailQuery.data}
                role={role}
                compact
              />
            ) : null}
            {detailQuery.isError ? (
              <p className="text-sm text-rose-300">
                {detailQuery.error instanceof Error
                  ? detailQuery.error.message
                  : "Nepodarilo sa načítať detail"}
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function parseDateSafe(value: string) {
  return new Date(`${value}T12:00:00`);
}
