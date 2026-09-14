import "server-only";
import { getDb } from "@/lib/db";
import { getJakartaDate } from "@/lib/dates";

export type FinancialSummary = {
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
  unpaidBillsCount: number;
  pendingReviewsCount: number;
};

export type MonthlyFlow = {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
};

export type CategoryExpense = {
  name: string;
  amount: number;
};

export type PeriodCompletion = {
  periodLabel: string;
  totalCount: number;
  paidCount: number;
  percent: number;
};

export async function getFinancialSummary(): Promise<FinancialSummary> {
  const db = getDb();
  const nowJkt = getJakartaDate();
  const currentYear = nowJkt.getFullYear();
  const currentMonth = nowJkt.getMonth(); // 0-indexed

  // Start of current month in UTC aligned with Jakarta
  const startOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0));
  const startOfNextMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 1, 0, 0, 0));

  const [
    incomeAgg,
    expenseAgg,
    monthIncomeAgg,
    monthExpenseAgg,
    unpaidCount,
    pendingCount,
  ] = await Promise.all([
    db.transaction.aggregate({
      where: { type: "INCOME" },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { type: "EXPENSE" },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        type: "INCOME",
        transactionDate: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        type: "EXPENSE",
        transactionDate: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
      _sum: { amount: true },
    }),
    db.memberBill.count({
      where: {
        status: { in: ["UNPAID", "REJECTED"] },
        member: { role: { not: "ADMIN" } },
      },
    }),
    db.paymentSubmission.count({
      where: {
        status: "PENDING_REVIEW",
        bill: { member: { role: { not: "ADMIN" } } },
      },
    }),
  ]);

  const totalIncome = incomeAgg._sum.amount ?? 0;
  const totalExpense = expenseAgg._sum.amount ?? 0;
  const currentBalance = totalIncome - totalExpense;

  return {
    currentBalance,
    totalIncome,
    totalExpense,
    incomeThisMonth: monthIncomeAgg._sum.amount ?? 0,
    expenseThisMonth: monthExpenseAgg._sum.amount ?? 0,
    unpaidBillsCount: unpaidCount,
    pendingReviewsCount: pendingCount,
  };
}

export async function getMonthlyCashFlow(monthsCount = 6): Promise<MonthlyFlow[]> {
  const db = getDb();
  const nowJkt = getJakartaDate();
  const flows: MonthlyFlow[] = [];

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  for (let i = monthsCount - 1; i >= 0; i--) {
    let year = nowJkt.getFullYear();
    let month = nowJkt.getMonth() - i;
    while (month < 0) {
      month += 12;
      year -= 1;
    }

    const start = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
    const label = `${monthNames[month]} ${year}`;

    const [income, expense] = await Promise.all([
      db.transaction.aggregate({
        where: {
          type: "INCOME",
          transactionDate: { gte: start, lt: end },
        },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: {
          type: "EXPENSE",
          transactionDate: { gte: start, lt: end },
        },
        _sum: { amount: true },
      }),
    ]);

    flows.push({
      monthKey: `${year}-${month + 1}`,
      label,
      income: income._sum.amount ?? 0,
      expense: expense._sum.amount ?? 0,
    });
  }

  return flows;
}

export async function getExpenseByCategory(): Promise<CategoryExpense[]> {
  const db = getDb();
  const expenses = await db.transaction.findMany({
    where: { type: "EXPENSE" },
    include: { category: { select: { name: true } } },
  });

  const totals: Record<string, number> = {};
  for (const exp of expenses) {
    const catName = exp.category.name;
    totals[catName] = (totals[catName] || 0) + exp.amount;
  }

  return Object.entries(totals).map(([name, amount]) => ({
    name,
    amount,
  }));
}

export async function getCurrentPeriodProgress(): Promise<PeriodCompletion | null> {
  const db = getDb();
  const latestPeriod = await db.billingPeriod.findFirst({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      bills: {
        where: { member: { role: { not: "ADMIN" } } },
        select: { status: true },
      },
    },
  });

  if (!latestPeriod) return null;

  const total = latestPeriod.bills.length;
  const paid = latestPeriod.bills.filter((b) => b.status === "PAID").length;
  const percent = total > 0 ? Math.round((paid / total) * 100) : 0;

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const periodLabel = `${monthNames[latestPeriod.month - 1]} ${latestPeriod.year}`;

  return {
    periodLabel,
    totalCount: total,
    paidCount: paid,
    percent,
  };
}
