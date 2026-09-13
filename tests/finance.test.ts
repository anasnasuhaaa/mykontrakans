import assert from "node:assert/strict";
import test from "node:test";
import { getBillDisplayStatus } from "../lib/dates";
import { amountSchema, categorySchema, settingsSchema } from "../lib/validators/finance";

test("finance validators enforce bounds and types", () => {
  assert.equal(amountSchema.safeParse(100000).success, true);
  assert.equal(amountSchema.safeParse(-500).success, false);
  assert.equal(amountSchema.safeParse(0).success, false);
  assert.equal(categorySchema.safeParse({ name: "Listrik", type: "EXPENSE" }).success, true);
  assert.equal(categorySchema.safeParse({ name: "x", type: "EXPENSE" }).success, false);
  assert.equal(settingsSchema.safeParse({ houseName: "Kos", monthlyDuesAmount: 150000, monthlyDueDay: 15 }).success, true);
  assert.equal(settingsSchema.safeParse({ houseName: "Kos", monthlyDuesAmount: 150000, monthlyDueDay: 32 }).success, false);
});

test("bill display status respects date rules and priority statuses", () => {
  const due = new Date(Date.UTC(2026, 8, 10, 0, 0, 0)); // 10 Sept 2026

  // Paid never overridden
  assert.equal(getBillDisplayStatus("PAID", due, new Date(Date.UTC(2026, 8, 15))).label, "Lunas");

  // Pending review never overridden
  assert.equal(getBillDisplayStatus("PENDING_REVIEW", due, new Date(Date.UTC(2026, 8, 15))).label, "Menunggu review");

  // Rejected never overridden
  assert.equal(getBillDisplayStatus("REJECTED", due, new Date(Date.UTC(2026, 8, 15))).label, "Ditolak");

  // Before 3-day window: Sept 5
  assert.equal(getBillDisplayStatus("UNPAID", due, new Date(Date.UTC(2026, 8, 5))).label, "Akan datang");

  // Within 3-day window: Sept 7, 8, 9, 10
  assert.equal(getBillDisplayStatus("UNPAID", due, new Date(Date.UTC(2026, 8, 7))).label, "Belum dibayar");
  assert.equal(getBillDisplayStatus("UNPAID", due, new Date(Date.UTC(2026, 8, 10))).label, "Belum dibayar");

  // Overdue: Sept 12 (2 days overdue)
  const overdue2 = getBillDisplayStatus("UNPAID", due, new Date(Date.UTC(2026, 8, 12)));
  assert.equal(overdue2.label, "Melebihi 2 hari");
  assert.equal(overdue2.variant, "destructive");
});
