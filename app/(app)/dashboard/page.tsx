import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import {
  getFinancialSummary,
  getMonthlyCashFlow,
  getExpenseByCategory,
  getCurrentPeriodProgress,
} from "@/lib/finance";
import { formatJakartaDate, getBillDisplayStatus } from "@/lib/dates";
import { formatRupiah } from "@/lib/utils";
import {
  CashFlowAreaChart,
  ExpenseDonutChart,
  PaymentProgressCard,
} from "@/components/dashboard/dashboard-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileCheck,
  PlusCircle,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();
  const isFinance = user.role === "ADMIN" || user.role === "TREASURER";
  const db = getDb();
  const [
    summary,
    cashFlow,
    expenseBreakdown,
    periodProgress,
    recentTransactions,
    myLatestBill,
  ] = await Promise.all([
    getFinancialSummary(),
    getMonthlyCashFlow(6),
    getExpenseByCategory(),
    getCurrentPeriodProgress(),
    db.transaction.findMany({
      take: 5,
      orderBy: { transactionDate: "desc" },
      include: {
        category: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    }),
    user.role === "ADMIN" ? Promise.resolve(null) : db.memberBill.findFirst({
      where: { memberId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        billingPeriod: true,
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  const billStatus = myLatestBill
    ? getBillDisplayStatus(myLatestBill.status, myLatestBill.billingPeriod.dueDate)
    : null;
  const latestSubmission = myLatestBill?.submissions[0];

  return (
    <div className="page-stack">
      {/* Header & Greetings */}
      <header className="page-header">
        <div>
          <p className="page-eyebrow normal-case tracking-normal">
            Selamat datang, <span className="text-foreground">{user.name}</span>
          </p>
          <h1 className="page-title">Ringkasan Keuangan</h1>
        </div>

        {/* Action shortcuts */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {isFinance ? (
            <>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/payments/review" className="gap-1.5">
                  <FileCheck className="size-4" />
                  Review {summary.pendingReviewsCount > 0 && `(${summary.pendingReviewsCount})`}
                </Link>
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/transactions" className="gap-1.5">
                  <PlusCircle className="size-4" />
                  Catat Transaksi
                </Link>
              </Button>
            </>
          ) : (
            myLatestBill && myLatestBill.status !== "PAID" && (
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/bills/${myLatestBill.id}/pay`} className="gap-1.5">
                  Bayar Kas Sekarang <ArrowRight className="size-4" />
                </Link>
              </Button>
            )
          )}
        </div>
      </header>

      {/* Member Personal Obligation Card (Mobile-First Priority) */}
      {myLatestBill && (
        <Card className="overflow-hidden rounded-2xl border bg-card shadow-xs">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  Tagihan Kas Anda ({myLatestBill.billingPeriod.month}/{myLatestBill.billingPeriod.year})
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {formatRupiah(myLatestBill.amount)}
                  </span>
                  {billStatus && <Badge variant={billStatus.variant}>{billStatus.label}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Jatuh tempo: {formatJakartaDate(myLatestBill.billingPeriod.dueDate)}
                </p>
                {latestSubmission?.rejectionReason && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    Catatan penolakan: {latestSubmission.rejectionReason}
                  </p>
                )}
              </div>

              <div>
                {myLatestBill.status === "PAID" ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-5" /> Pembayaran Lunas
                  </span>
                ) : myLatestBill.status === "PENDING_REVIEW" ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
                    <Clock className="size-5" /> Bukti Sedang Direview
                  </span>
                ) : (
                  <Button asChild className="min-h-11 w-full sm:w-auto">
                    <Link href={`/bills/${myLatestBill.id}/pay`}>
                      Bayar via QRIS <ArrowRight className="size-4 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Key Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Current Balance */}
        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Saldo Kas Saat Ini</span>
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Wallet className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">
              {formatRupiah(summary.currentBalance)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Total masuk: {formatRupiah(summary.totalIncome)}
            </p>
          </CardContent>
        </Card>

        {/* Income This Month */}
        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Pemasukan Bulan Ini</span>
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatRupiah(summary.incomeThisMonth)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Dari iuran anggota</p>
          </CardContent>
        </Card>

        {/* Expense This Month */}
        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Pengeluaran Bulan Ini</span>
              <div className="rounded-xl bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
                <ArrowDownRight className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {formatRupiah(summary.expenseThisMonth)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Listrik, WiFi, dll.</p>
          </CardContent>
        </Card>

        {/* Unpaid Bills or Pending Review */}
        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {isFinance && summary.pendingReviewsCount > 0 ? "Antrean Review" : "Belum Lunas"}
              </span>
              <div
                className={`rounded-xl p-2 ${
                  isFinance && summary.pendingReviewsCount > 0
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isFinance && summary.pendingReviewsCount > 0 ? (
                  <AlertCircle className="size-4" />
                ) : (
                  <Clock className="size-4" />
                )}
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">
              {isFinance && summary.pendingReviewsCount > 0
                ? `${summary.pendingReviewsCount} pengajuan`
                : `${summary.unpaidBillsCount} tagihan`}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {isFinance && summary.pendingReviewsCount > 0
                ? "Menunggu verifikasi bukti"
                : "Menunggu pembayaran"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Completion Progress */}
      {periodProgress && <PaymentProgressCard completion={periodProgress} />}

      {/* Charts (Cashflow & Distribution) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CashFlowAreaChart data={cashFlow} />
        <ExpenseDonutChart data={expenseBreakdown} />
      </div>

      {/* Recent Transactions */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
            <CardDescription>Catatan arus kas terakhir</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={isFinance ? "/transactions" : "/history"}>
              Lihat semua <ArrowRight className="size-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Belum ada transaksi kas yang dicatat.
            </div>
          ) : (
            <div className="divide-y">
              {recentTransactions.map((tx) => {
                const isIncome = tx.type === "INCOME";
                return (
                  <div
                    key={tx.id}
                    className="flex items-start justify-between gap-3 p-4 transition-colors hover:bg-muted/30 sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex size-8 items-center justify-center rounded-lg ${
                          isIncome
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="size-4" />
                        ) : (
                          <ArrowDownRight className="size-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium leading-tight">{tx.description}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatJakartaDate(new Date(tx.transactionDate))} · {tx.category.name}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-bold tabular-nums ${
                        isIncome
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isIncome ? "+" : "-"} {formatRupiah(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
