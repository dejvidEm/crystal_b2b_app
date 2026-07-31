export const queryKeys = {
  profile: ["profile"] as const,
  requests: {
    all: ["requests"] as const,
    list: (filters?: Record<string, string | undefined>) =>
      ["requests", "list", filters ?? {}] as const,
    detail: (id: string) => ["requests", "detail", id] as const,
    calendar: (from: string, to: string) =>
      ["requests", "calendar", from, to] as const,
  },
  dashboard: ["dashboard"] as const,
  vehicles: {
    all: ["vehicles"] as const,
    list: (filters?: Record<string, string | undefined>) =>
      ["vehicles", "list", filters ?? {}] as const,
    active: ["vehicles", "active"] as const,
    detail: (id: string) => ["vehicles", "detail", id] as const,
  },
  organizations: {
    all: ["organizations"] as const,
  },
};
