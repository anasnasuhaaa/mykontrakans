import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";

export const JAKARTA_TZ = "Asia/Jakarta";

export function getJakartaDate(date: Date = new Date()): TZDate {
  return new TZDate(date, JAKARTA_TZ);
}

export function formatJakartaMonthYear(year: number, month: number): string {
  const d = new TZDate(year, month - 1, 1, JAKARTA_TZ);
  return format(d, "MMMM yyyy");
}

export function formatJakartaDate(date: Date): string {
  const d = new TZDate(date, JAKARTA_TZ);
  return format(d, "d MMMM yyyy");
}

export type BillDisplayStatus = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  tone: "success" | "warning" | "danger" | "neutral";
};

export function getBillDisplayStatus(
  status: "UNPAID" | "PENDING_REVIEW" | "PAID" | "REJECTED",
  dueDate: Date,
  now: Date = new Date()
): BillDisplayStatus {
  if (status === "PAID") {
    return { label: "Lunas", variant: "default", tone: "success" };
  }
  if (status === "PENDING_REVIEW") {
    return { label: "Menunggu review", variant: "secondary", tone: "warning" };
  }
  if (status === "REJECTED") {
    return { label: "Ditolak", variant: "destructive", tone: "danger" };
  }

  // Calculate day difference in Asia/Jakarta
  const nowJkt = getJakartaDate(now);
  const dueJkt = getJakartaDate(dueDate);

  // Normalize to start of day in Jakarta
  const nowDay = new Date(Date.UTC(nowJkt.getFullYear(), nowJkt.getMonth(), nowJkt.getDate())).getTime();
  const dueDay = new Date(Date.UTC(dueJkt.getFullYear(), dueJkt.getMonth(), dueJkt.getDate())).getTime();

  const msPerDay = 86400000;
  const diffDays = Math.floor((nowDay - dueDay) / msPerDay);

  if (diffDays > 0) {
    return {
      label: `Melebihi ${diffDays} hari`,
      variant: "destructive",
      tone: "danger",
    };
  }

  // 3 days before due date up to due date (diffDays between -3 and 0)
  if (diffDays >= -3) {
    return {
      label: "Belum dibayar",
      variant: "secondary",
      tone: "warning",
    };
  }

  return {
    label: "Akan datang",
    variant: "outline",
    tone: "neutral",
  };
}
