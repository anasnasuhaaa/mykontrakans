import assert from "node:assert/strict";
import test from "node:test";
import { transactionSchema } from "../lib/validators/finance";

test("transaction schema validates finance ledger requirements", () => {
  // Valid income
  const validIncome = transactionSchema.safeParse({
    type: "INCOME",
    categoryId: "cat_123",
    amount: 100000,
    description: "Iuran kas bulan September",
    transactionDate: new Date(),
  });
  assert.equal(validIncome.success, true);

  // Valid expense
  const validExpense = transactionSchema.safeParse({
    type: "EXPENSE",
    categoryId: "cat_456",
    amount: 50000,
    description: "Beli token listrik",
    transactionDate: "2026-09-10",
  });
  assert.equal(validExpense.success, true);

  // Negative amount
  const negative = transactionSchema.safeParse({
    type: "EXPENSE",
    categoryId: "cat_456",
    amount: -5000,
    description: "Beli token listrik",
  });
  assert.equal(negative.success, false);

  // Zero amount
  const zero = transactionSchema.safeParse({
    type: "EXPENSE",
    categoryId: "cat_456",
    amount: 0,
    description: "Beli token listrik",
  });
  assert.equal(zero.success, false);

  // Missing category
  const noCat = transactionSchema.safeParse({
    type: "INCOME",
    categoryId: "",
    amount: 50000,
    description: "Pemasukan lain",
  });
  assert.equal(noCat.success, false);

  // Description too short
  const shortDesc = transactionSchema.safeParse({
    type: "INCOME",
    categoryId: "cat_123",
    amount: 50000,
    description: "a",
  });
  assert.equal(shortDesc.success, false);
});
