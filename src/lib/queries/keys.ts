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
};
