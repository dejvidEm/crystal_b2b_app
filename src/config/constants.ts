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

export const TIME_WINDOWS = [
  { value: "morning" as const, label: "Dopoludnia" },
  { value: "afternoon" as const, label: "Popoludní" },
  { value: "flexible" as const, label: "Flexibilne" },
] as const;

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
