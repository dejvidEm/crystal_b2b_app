/** Minimum vehicles required per dispatch / service request. */
export const MIN_VEHICLES_PER_DISPATCH = 3;

/** Soft upper bound for a single request. */
export const MAX_VEHICLES_PER_DISPATCH = 50;

export const APP_NAME = "Crystal B2B Partner Portal";
export const APP_SHORT_NAME = "Crystal B2B";
export const COMPANY_NAME = "Crystal Detailing";
export const TIMEZONE = "Europe/Bratislava";
export const LOCALE = "sk-SK";

export const SERVICE_PACKAGES = [
  {
    value: "fleet_refresh" as const,
    label: "Fleet Refresh",
    description:
      "Rýchla vonkajšia a interiérová obnova flotily pred odovzdaním alebo prezentáciou.",
  },
  {
    value: "fleet_interior_care" as const,
    label: "Fleet Interior Care",
    description:
      "Hĺbková starostlivosť o interiér – vysávanie, čistenie povrchov a odstránenie zápachu.",
  },
  {
    value: "vehicle_turnover" as const,
    label: "Vehicle Turnover",
    description:
      "Komplexná príprava vozidiel pri výmene medzi zákazníkmi, prenájmom alebo predajom.",
  },
] as const;

/** Selectable request times from 01:00 to 23:00. */
export const REQUEST_TIMES = Array.from({ length: 23 }, (_, index) => {
  const hours = index + 1;
  const value = `${String(hours).padStart(2, "0")}:00`;
  return { value, label: value };
});

export const DEFAULT_REQUEST_TIME = "09:00";

export const PRIORITIES = [
  { value: "standard" as const, label: "Štandardná" },
  { value: "priority" as const, label: "Prioritná" },
] as const;

export const REQUEST_STATUSES = [
  { value: "pending" as const, label: "Čaká na potvrdenie" },
  { value: "confirmed" as const, label: "Potvrdená" },
  { value: "in_progress" as const, label: "Prebieha" },
  { value: "completed" as const, label: "Dokončená" },
  { value: "rejected" as const, label: "Zamietnutá" },
  { value: "cancelled" as const, label: "Zrušená" },
] as const;

/** Shown before submit on the form. */
export const TERM_VALIDITY_NOTICE =
  "Termín je platný až po potvrdení tímom Crystal Detailing.";

/** Shown after a request has been submitted (e.g. pending detail). */
export const CONFIRMATION_NOTICE =
  `Požiadavka bola odoslaná. ${TERM_VALIDITY_NOTICE}`;

export const VEHICLE_CATEGORIES = [
  {
    value: "rental" as const,
    label: "Autá z požičovne",
    shortLabel: "Z požičovne",
  },
  {
    value: "staff" as const,
    label: "Autá personálu",
    shortLabel: "Personál",
  },
  {
    value: "for_sale" as const,
    label: "Autá na predaj",
    shortLabel: "Na predaj",
  },
] as const;

export const VEHICLE_STATUS_FILTERS = [
  { value: "active" as const, label: "Aktívne" },
  { value: "archived" as const, label: "Archivované" },
  { value: "all" as const, label: "Všetky stavy" },
] as const;

/** Seconds an admin can undo a cancel before partners see it. */
export const CANCEL_UNDO_SECONDS = 30;

export const ADMIN_STATUS_ACTIONS = {
  pending: [
    { status: "confirmed" as const, label: "Potvrdiť", variant: "default" as const },
    { status: "rejected" as const, label: "Zamietnuť", variant: "destructive" as const },
  ],
  confirmed: [
    { status: "in_progress" as const, label: "Spustiť", variant: "default" as const },
    { status: "cancelled" as const, label: "Zrušiť", variant: "outline" as const },
  ],
  in_progress: [
    { status: "completed" as const, label: "Dokončiť", variant: "default" as const },
    { status: "cancelled" as const, label: "Zrušiť", variant: "outline" as const },
  ],
  completed: [],
  rejected: [],
  cancelled: [],
} as const;
