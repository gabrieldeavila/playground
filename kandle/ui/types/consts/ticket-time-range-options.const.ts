import { TicketTimeRange } from "@/types/enum/ticket-time-range.enum";

export const TICKET_TIME_RANGE_OPTIONS = [
  { value: TicketTimeRange.OneDay, label: "Hoje" },
  { value: TicketTimeRange.SevenDays, label: "7 dias" },
  { value: TicketTimeRange.ThirtyDays, label: "30 dias" },
  { value: TicketTimeRange.NinetyDays, label: "90 dias" },
] as const;
