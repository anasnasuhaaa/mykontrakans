import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

const rejectSchema = z.object({
  submissionId: z.string().min(1, "ID bukti transfer tidak ditemukan."),
  reason: z.string().trim().min(5, "Alasan penolakan minimal 5 karakter.").max(255, "Alasan penolakan maksimal 255 karakter."),
});

test("payment rejection schema enforces reason length", () => {
  // Valid reason
  assert.equal(
    rejectSchema.safeParse({
      submissionId: "sub_123",
      reason: "Nominal pada mutasi tidak sesuai dengan tagihan.",
    }).success,
    true
  );

  // Too short (< 5 chars)
  assert.equal(
    rejectSchema.safeParse({
      submissionId: "sub_123",
      reason: "salah",
    }).success,
    true
  );
  assert.equal(
    rejectSchema.safeParse({
      submissionId: "sub_123",
      reason: "no",
    }).success,
    false
  );

  // Missing submission ID
  assert.equal(
    rejectSchema.safeParse({
      submissionId: "",
      reason: "Alasan penolakan yang cukup panjang.",
    }).success,
    false
  );

  // Too long (> 255 chars)
  assert.equal(
    rejectSchema.safeParse({
      submissionId: "sub_123",
      reason: "a".repeat(256),
    }).success,
    false
  );
});
