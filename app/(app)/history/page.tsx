import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { formatJakartaMonthYear, formatJakartaDate } from "@/lib/dates";
import { formatRupiah } from "@/lib/utils";
import { TransactionList } from "@/components/finance/transaction-list";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default async function HistoryPage() {
  const user = await requireUser();
  const db = getDb();

  const [myBills, transactions] = await Promise.all([
    db.memberBill.findMany({
      where: { memberId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        billingPeriod: true,
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            evidencePath: true,
            rejectionReason: true,
            reviewedAt: true,
          },
        },
      },
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
      <header>
        <p className="page-eyebrow">Transparansi keuangan</p>
        <h1 className="page-title">Riwayat & catatan kas</h1>
      </header>

      {/* Section 1: My Personal Payment History */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Riwayat Iuran Kas Saya</h2>
          <p className="text-xs text-muted-foreground">
            Status pembayaran iuran kas bulanan Anda untuk setiap periode.
          </p>
        </div>

        {myBills.length === 0 ? (
          <Card className="empty-state text-muted-foreground">
            <p className="text-sm">Belum ada catatan tagihan kas untuk akun Anda.</p>
          </Card>
        ) : (
          <div className="surface-list">
            {myBills.map((bill) => {
              const sub = bill.submissions[0];
              const isPaid = bill.status === "PAID";
              const isPending = bill.status === "PENDING_REVIEW";
              const isRejected = bill.status === "REJECTED";

              return (
                <div
                  key={bill.id}
                  className="flex flex-col gap-3 p-4.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-base">
                        {formatJakartaMonthYear(bill.billingPeriod.year, bill.billingPeriod.month)}
                      </p>
                      {isPaid && (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">
                          <CheckCircle2 className="size-3 mr-1" /> Lunas
                        </Badge>
                      )}
                      {isPending && (
                        <Badge variant="secondary" className="text-amber-600 dark:text-amber-400">
                          <Clock className="size-3 mr-1" /> Menunggu Review
                        </Badge>
                      )}
                      {isRejected && (
                        <Badge variant="destructive">
                          <AlertCircle className="size-3 mr-1" /> Ditolak
                        </Badge>
                      )}
                      {bill.status === "UNPAID" && (
                        <Badge variant="outline">Belum Dibayar</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Jatuh tempo: {formatJakartaDate(bill.billingPeriod.dueDate)}
                      {sub?.reviewedAt && ` · Diverifikasi: ${formatJakartaDate(new Date(sub.reviewedAt))}`}
                    </p>
                    {sub?.rejectionReason && (
                      <p className="text-xs text-destructive">
                        Catatan: {sub.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="text-right font-bold text-base">
                    {formatRupiah(bill.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: House Ledger Transparency */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Buku Kas Bersama</h2>
          <p className="text-xs text-muted-foreground">
            Catatan seluruh pemasukan dan pengeluaran kontrakan untuk transparansi bersama.
          </p>
        </div>

        <TransactionList transactions={transactions} canManage={false} />
      </section>
    </div>
  );
}
