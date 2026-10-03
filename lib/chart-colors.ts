/**
 * Dashboard chart palette (shared by server and client code).
 * Validated with the dataviz palette checker as a 3-slot categorical set:
 * maroon / gold / green. Gold is below 3:1 on white, so segments always
 * ship with visible labels and counts.
 */
export const SERIES = { maroon: "#9a1219", gold: "#c98a1b", green: "#1b8a72" } as const;
