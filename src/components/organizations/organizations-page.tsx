"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAX_VEHICLES_PER_DISPATCH,
  MIN_VEHICLES_PER_DISPATCH,
} from "@/config/constants";
import {
  useOrganizations,
  useUpdateOrganizationMinVehicles,
} from "@/hooks/use-organizations";
import type { Organization } from "@/types";

export function OrganizationsPage() {
  const { data: organizations = [], isLoading, isError, error } =
    useOrganizations();
  const updateMin = useUpdateOrganizationMinVehicles();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [draftMins, setDraftMins] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput), 250);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter((org) => {
      const haystack = [
        org.name,
        org.company_id,
        org.billing_email,
        org.phone,
        org.service_address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [organizations, search]);

  function getDraftValue(org: Organization) {
    return draftMins[org.id] ?? String(org.min_vehicles_per_request);
  }

  function isDirty(org: Organization) {
    return Number.parseInt(getDraftValue(org), 10) !== org.min_vehicles_per_request;
  }

  async function saveMin(org: Organization) {
    const value = Number.parseInt(getDraftValue(org), 10);

    if (
      !Number.isFinite(value) ||
      value < 1 ||
      value > MAX_VEHICLES_PER_DISPATCH
    ) {
      toast.error(
        `Minimálny odber musí byť medzi 1 a ${MAX_VEHICLES_PER_DISPATCH}.`,
      );
      setDraftMins((current) => {
        const next = { ...current };
        delete next[org.id];
        return next;
      });
      return;
    }

    if (value === org.min_vehicles_per_request) return;

    setSavingId(org.id);
    try {
      await updateMin.mutateAsync({
        organizationId: org.id,
        minVehicles: value,
      });
      setDraftMins((current) => {
        const next = { ...current };
        delete next[org.id];
        return next;
      });
    } catch {
      setDraftMins((current) => {
        const next = { ...current };
        delete next[org.id];
        return next;
      });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Partneri"
        description="Prehľad spoločností s účtom. Pre každú firmu nastavíte minimálny počet vozidiel v jednej požiadavke."
      />

      <div className="mb-5">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            className="pl-9"
            placeholder="Hľadať firmu, IČO, e-mail…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? <LoadingSkeleton rows={5} /> : null}
      {isError ? (
        <p className="text-sm text-rose-300">
          {error instanceof Error ? error.message : "Chyba načítania"}
        </p>
      ) : null}

      {!isLoading && !isError && filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Žiadne spoločnosti"
          description={
            search
              ? "Nič nezodpovedá vyhľadávaniu."
              : "Zatiaľ nie sú vytvorené žiadne partnerské organizácie."
          }
        />
      ) : null}

      {!isLoading && filtered.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-[12px] border border-border md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border bg-surface-elevated/80 text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Spoločnosť</th>
                    <th className="px-4 py-3 font-medium">Kontakt</th>
                    <th className="px-4 py-3 font-medium">Stav</th>
                    <th className="px-4 py-3 font-medium">
                      Min. odber (vozidlá)
                    </th>
                    <th className="px-4 py-3 font-medium">Akcia</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((org) => {
                    const draft = getDraftValue(org);
                    const dirty = isDirty(org);
                    return (
                      <tr
                        key={org.id}
                        className="border-b border-border/70 bg-surface last:border-0 hover:bg-surface-elevated/60"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-text">{org.name}</p>
                          {org.company_id ? (
                            <p className="mt-1 text-xs text-muted">
                              IČO: {org.company_id}
                            </p>
                          ) : null}
                          {org.service_address ? (
                            <p className="mt-1 text-xs text-muted">
                              {org.service_address}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          <p>{org.billing_email || "—"}</p>
                          <p className="mt-1">{org.phone || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge active={org.is_active} />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={1}
                            max={MAX_VEHICLES_PER_DISPATCH}
                            className="w-24"
                            value={draft}
                            disabled={savingId === org.id}
                            onChange={(e) =>
                              setDraftMins((current) => ({
                                ...current,
                                [org.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void saveMin(org);
                              }
                            }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant={dirty ? "default" : "outline"}
                            disabled={!dirty || savingId === org.id}
                            onClick={() => void saveMin(org)}
                          >
                            {savingId === org.id ? "Ukladám…" : "Uložiť"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {filtered.map((org) => {
              const draft = getDraftValue(org);
              const dirty = isDirty(org);
              return (
                <div
                  key={org.id}
                  className="rounded-[12px] border border-border bg-surface p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-text">{org.name}</p>
                      {org.company_id ? (
                        <p className="mt-1 text-sm text-muted">
                          IČO: {org.company_id}
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge active={org.is_active} />
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-muted">
                    <p>{org.billing_email || "Bez e-mailu"}</p>
                    <p>{org.phone || "Bez telefónu"}</p>
                    {org.service_address ? <p>{org.service_address}</p> : null}
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor={`min-${org.id}`}>
                      Minimálny odber (vozidlá)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`min-${org.id}`}
                        type="number"
                        min={1}
                        max={MAX_VEHICLES_PER_DISPATCH}
                        value={draft}
                        disabled={savingId === org.id}
                        onChange={(e) =>
                          setDraftMins((current) => ({
                            ...current,
                            [org.id]: e.target.value,
                          }))
                        }
                      />
                      <Button
                        className="min-h-11 shrink-0"
                        variant={dirty ? "default" : "outline"}
                        disabled={!dirty || savingId === org.id}
                        onClick={() => void saveMin(org)}
                      >
                        {savingId === org.id ? "…" : "Uložiť"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted">
                      Predvolené je {MIN_VEHICLES_PER_DISPATCH}. Rozsah 1–
                      {MAX_VEHICLES_PER_DISPATCH}.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      className={
        active
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
          : "border-white/10 bg-white/5 text-muted"
      }
    >
      {active ? "Aktívna" : "Neaktívna"}
    </Badge>
  );
}
