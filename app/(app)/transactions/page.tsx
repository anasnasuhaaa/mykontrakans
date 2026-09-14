import { requireUser, financeRoles } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getFinancialSummary } from "@/lib/finance";
import { formatRupiah } from "@/lib/utils";
import { TransactionForm } from "@/components/finance/transaction-form";
import { TransactionList } from "@/components/finance/transaction-list";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default async function TransactionsPage() {
  await requireUser(financeRoles);

  const db = getDb();
  const [summary, categories, transactions] = await Promise.all([
    getFinancialSummary(),
    db.financialCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true },
    }),
    db.transaction.findMany({
      orderBy: { transactionDate: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Buku kas & pengeluaran</p>
          <h1 className="page-title">Kelola transaksi</h1>
        </div>
        <TransactionForm categories={categories} />
      </header>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
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
          </CardContent>
        </Card>

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
          </CardContent>
        </Card>

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
          </CardContent>
        </Card>
      </div>

      <TransactionList transactions={transactions} categories={categories} canManage={true} />
    </div>
  );
}
