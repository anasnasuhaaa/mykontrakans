import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import Module, { createRequire } from "node:module";
import { compare } from "bcryptjs";
import { hashToken } from "../lib/auth/tokens";
import { manualPaymentSchema } from "../lib/validators/finance";
import { resetPasswordSchema } from "../lib/validators/auth";

// Exercise real server actions while isolating database, email and Next request APIs.
const moduleLoader = Module as unknown as { _load: (id: string, ...args: unknown[]) => unknown };
const originalLoad = moduleLoader._load;
let database: unknown;
let role = "ADMIN";
let emailCount = 0;
let failEmail = false;
let cookieDeleted = false;
moduleLoader._load = function (id, ...args) {
  const path = id.replaceAll("\\", "/");
  if (path === "server-only") return {};
  if (/(?:@\/|\/)lib\/db(?:\.ts)?$/.test(path)) return { getDb: () => database };
  if (/(?:@\/|\/)lib\/auth\/session(?:\.ts)?$/.test(path)) return {
    financeRoles: ["ADMIN", "TREASURER"],
    requireUser: async (roles?: string[]) => {
      if (roles && !roles.includes(role)) throw new Error("Forbidden");
      return { id: "actor", name: "Pengelola", role };
    },
  };
  if (/(?:@\/|\/)lib\/email(?:\.ts)?$/.test(path)) return {
    notifySafely: async () => {},
    sendEmail: async () => { emailCount++; if (failEmail) throw new Error("EmailDeliveryFailed"); },
  };
  if (/(?:@\/|\/)lib\/env(?:\.ts)?$/.test(path)) return { getServerEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://example.test" }) };
  if (path === "next/cache") return { revalidatePath: () => {} };
  if (path === "next/headers") return { cookies: async () => ({ delete: () => { cookieDeleted = true; } }) };
  return originalLoad.call(this, id, ...args);
};
const loadAction = createRequire(import.meta.url);
const { generateBillingPeriod } = loadAction("../app/actions/billing.ts") as typeof import("../app/actions/billing");
const { settleBillManually, approvePaymentSubmission, rejectPaymentSubmission } = loadAction("../app/actions/payments.ts") as typeof import("../app/actions/payments");
const { requestPasswordReset, resetPassword } = loadAction("../app/actions/password-reset.ts") as typeof import("../app/actions/password-reset");
const { updateTransaction, deleteTransaction } = loadAction("../app/actions/transactions.ts") as typeof import("../app/actions/transactions");
moduleLoader._load = originalLoad;

function form(values: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  return data;
}

beforeEach(() => { role = "ADMIN"; emailCount = 0; failEmail = false; cookieDeleted = false; });

function billingFixture(eligible = ["member-a", "member-b"]) {
  let created: unknown;
  const tx = {
    user: { findMany: async ({ where }: { where: { id: { in: string[] }; isActive: boolean; role: { not: string } } }) => {
      assert.equal(where.isActive, true);
      assert.equal(where.role.not, "ADMIN");
      return eligible.filter((id) => where.id.in.includes(id)).map((id) => ({ id }));
    } },
    billingPeriod: {
      findUnique: async () => null,
      create: async ({ data }: { data: unknown }) => { created = data; return { id: "period" }; },
    },
    auditLog: { create: async () => ({}) },
  };
  database = { ...tx, appSetting: { findUnique: async () => ({ monthlyDuesAmount: 100000, monthlyDueDay: 31 }) }, $transaction: async (run: (value: typeof tx) => unknown) => run(tx) };
  return { created: () => created as { bills: { create: { memberId: string }[] }; dueDate: Date } | undefined };
}

test("period creates bills only for selected members, deduplicates names and clamps due date", async () => {
  for (const financeRole of ["ADMIN", "TREASURER"]) {
    role = financeRole;
    const fixture = billingFixture();
    const result = await generateBillingPeriod({}, form({ year: "2026", month: "2", memberIds: ["member-b", "member-b"] }));
    assert.equal(result.success, true);
    assert.deepEqual(fixture.created()?.bills.create.map((bill) => bill.memberId), ["member-b"]);
    assert.equal(fixture.created()?.dueDate.getUTCDate(), 28);
  }
});

test("period rejects no selection, inactive/unknown IDs and member role", async () => {
  const fixture = billingFixture();
  for (const ids of [[], ["unknown"], ["member-a", "inactive"]]) {
    assert.equal((await generateBillingPeriod({}, form({ year: "2026", month: "9", memberIds: ids }))).success, false);
    assert.equal(fixture.created(), undefined);
  }
  role = "MEMBER";
  await assert.rejects(generateBillingPeriod({}, form({ memberIds: ["member-a"] })), /Forbidden/);
});

function paymentFixture(initialStatus = "UNPAID", staleReview = false) {
  let status = initialStatus;
  let submissionStatus = "PENDING_REVIEW";
  const entries: { amount: number; relatedBillId: string; transactionDate: Date }[] = [];
  const bill = { id: "bill", memberId: "member", amount: 100000, status: initialStatus, billingPeriod: { month: 9, year: 2026 }, member: { id: "member", name: "Anggota", email: "member@example.test", role: "MEMBER" } };
  const tx = {
    memberBill: {
      findUnique: async () => ({ ...bill, status }),
      updateMany: async ({ where, data }: { where: { status: string | { in: string[] } }; data: { status: string } }) => {
        const matches = typeof where.status === "string" ? status === where.status : where.status.in.includes(status);
        if (!matches) return { count: 0 };
        status = data.status; return { count: 1 };
      },
    },
    financialCategory: { findFirst: async () => ({ id: "dues" }) },
    transaction: { create: async ({ data }: { data: typeof entries[number] }) => { entries.push(data); return { id: "transaction" }; } },
    paymentSubmission: {
      findUnique: async () => ({ id: "submission", status: staleReview ? "PENDING_REVIEW" : submissionStatus, bill: { ...bill, status: staleReview ? "PENDING_REVIEW" : status } }),
      updateMany: async ({ data }: { data: { status: string } }) => { submissionStatus = data.status; return { count: 1 }; },
    },
    auditLog: { create: async () => ({}) },
  };
  database = { ...tx, $transaction: async (run: (value: typeof tx) => unknown) => run(tx) };
  return { entries, status: () => status, submissionStatus: () => submissionStatus };
}

const paymentInput = { billId: "bill", method: "CASH", paymentDate: "2026-01-01", note: "Diterima tunai" };
test("manual settlement updates bill and ledger once, and closes queued QRIS evidence", async () => {
  for (const financeRole of ["ADMIN", "TREASURER"]) for (const status of ["UNPAID", "REJECTED", "PENDING_REVIEW"]) {
    role = financeRole;
    const fixture = paymentFixture(status);
    assert.equal((await settleBillManually({}, form(paymentInput))).success, true);
    assert.equal(fixture.status(), "PAID");
    assert.equal(fixture.entries.length, 1);
    assert.equal(fixture.entries[0].amount, 100000);
    assert.equal(fixture.entries[0].relatedBillId, "bill");
    assert.equal(fixture.entries[0].transactionDate.toISOString(), "2026-01-01T00:00:00.000Z");
    assert.equal(fixture.submissionStatus(), "REJECTED");
    assert.equal((await settleBillManually({}, form(paymentInput))).success, false);
    assert.equal((await approvePaymentSubmission({}, form({ submissionId: "submission" }))).success, false);
    assert.equal((await rejectPaymentSubmission({}, form({ submissionId: "submission", reason: "Tidak sesuai" }))).success, false);
    assert.equal(fixture.entries.length, 1);
    assert.equal(fixture.status(), "PAID");
  }
});

test("manual settlement rejects ordinary member and invalid/future dates", async () => {
  paymentFixture(); role = "MEMBER";
  await assert.rejects(settleBillManually({}, form(paymentInput)), /Forbidden/);
  for (const paymentDate of ["2026-02-30", "2099-01-01", "", "not-a-date"]) assert.equal(manualPaymentSchema.safeParse({ ...paymentInput, paymentDate }).success, false);
  assert.equal(manualPaymentSchema.safeParse({ ...paymentInput, method: "BANK_TRANSFER" }).success, true);
});

test("stale QRIS approval or rejection cannot overwrite a manual settlement", async () => {
  const fixture = paymentFixture("PAID", true);
  assert.equal((await approvePaymentSubmission({}, form({ submissionId: "submission" }))).success, false);
  assert.equal((await rejectPaymentSubmission({}, form({ submissionId: "submission", reason: "Tidak sesuai" }))).success, false);
  assert.equal(fixture.status(), "PAID");
  assert.equal(fixture.entries.length, 0);
});

test("income linked to manual settlement cannot be edited or removed from the ledger", async () => {
  const tx = { transaction: { findUnique: async () => ({ id: "transaction", relatedBillId: "bill", relatedPaymentId: null }) }, financialCategory: { findUnique: async () => ({ id: "dues", type: "INCOME" }) } };
  database = { ...tx, $transaction: async (run: (value: typeof tx) => unknown) => run(tx) };
  assert.equal((await deleteTransaction({}, form({ id: "transaction" }))).success, false);
  assert.equal((await updateTransaction({}, form({ id: "transaction", type: "INCOME", categoryId: "dues", amount: "200000", description: "Ubah nominal", transactionDate: "2026-01-01" }))).success, false);
});

function resetFixture(options: { expired?: boolean; active?: boolean; exists?: boolean; count?: number } = {}) {
  const token = "a".repeat(64);
  let tokenRecord: { tokenHash: string; userId: string; expiresAt: Date } | null = {
    tokenHash: hashToken(token), userId: "member", expiresAt: new Date(Date.now() + (options.expired ? -60000 : 60000)),
  };
  let passwordHash = "old-hash";
  let sessionsDeleted = false;
  const user = { id: "member", email: "member@example.test", name: "Anggota", isActive: options.active !== false, activatedAt: new Date(), passwordHash };
  const tx = {
    user: {
      findUnique: async () => options.exists === false ? null : user,
      update: async ({ data }: { data: { passwordHash: string } }) => { passwordHash = data.passwordHash; return user; },
    },
    passwordResetToken: {
      findUnique: async ({ where }: { where: { tokenHash: string } }) => tokenRecord?.tokenHash === where.tokenHash ? { ...tokenRecord, user } : null,
      upsert: async ({ create }: { create: NonNullable<typeof tokenRecord> }) => { tokenRecord = create; return create; },
      deleteMany: async () => { const count = tokenRecord ? 1 : 0; tokenRecord = null; return { count }; },
    },
    session: { deleteMany: async () => { sessionsDeleted = true; return { count: 2 }; } },
    authAttempt: { deleteMany: async () => ({ count: 1 }), upsert: async () => ({ count: options.count || 1 }) },
    auditLog: { create: async () => ({}) },
  };
  database = { ...tx, $transaction: async (run: (value: typeof tx) => unknown) => run(tx) };
  return { token, passwordHash: () => passwordHash, sessionsDeleted: () => sessionsDeleted, tokenRecord: () => tokenRecord };
}

test("password reset hashes new password, revokes sessions and rejects token replay", async () => {
  const fixture = resetFixture();
  const input = form({ token: fixture.token, password: "new-password-123", confirmPassword: "new-password-123" });
  assert.equal((await resetPassword({}, input)).success, true);
  assert.equal(await compare("new-password-123", fixture.passwordHash()), true);
  assert.equal(fixture.sessionsDeleted(), true);
  assert.equal(cookieDeleted, true);
  assert.equal((await resetPassword({}, input)).success, false);
});

test("expired, unknown, inactive and mismatched password resets cannot change credentials", async () => {
  for (const options of [{ expired: true }, { active: false }, {}]) {
    const fixture = resetFixture(options);
    const input = { token: Object.keys(options).length ? fixture.token : "b".repeat(64), password: "new-password-123", confirmPassword: "new-password-123" };
    assert.equal((await resetPassword({}, form(input))).success, false);
    assert.equal(fixture.passwordHash(), "old-hash");
    assert.equal(fixture.sessionsDeleted(), false);
  }
  assert.equal(resetPasswordSchema.safeParse({ token: "a".repeat(64), password: "abcdef", confirmPassword: "different" }).success, false);
});

test("reset requests use generic responses, rate limiting and hashed expiring tokens", async () => {
  const fixture = resetFixture();
  const response = await requestPasswordReset({}, form({ email: "member@example.test" }));
  assert.equal(response.success, true);
  assert.equal(emailCount, 1);
  assert.match(fixture.tokenRecord()!.tokenHash, /^[a-f0-9]{64}$/);
  assert.ok(fixture.tokenRecord()!.expiresAt.getTime() > Date.now() + 29 * 60000);
  for (const options of [{ exists: false }, { active: false }, { count: 4 }]) {
    resetFixture(options); emailCount = 0;
    assert.deepEqual(await requestPasswordReset({}, form({ email: "member@example.test" })), response);
    assert.equal(emailCount, 0);
  }
  const failed = resetFixture(); failEmail = true;
  assert.deepEqual(await requestPasswordReset({}, form({ email: "member@example.test" })), response);
  assert.equal(failed.tokenRecord(), null);
});
