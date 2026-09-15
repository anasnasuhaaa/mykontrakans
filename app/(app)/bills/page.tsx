import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { formatJakartaMonthYear, formatJakartaDate, getBillDisplayStatus, getJakartaDate } from "@/lib/dates";
import { formatRupiah } from "@/lib/utils";
import { BillingGenerator } from "@/components/billing/billing-generator";
import { ManualPaymentForm } from "@/components/billing/manual-payment-form";
import { ConfirmAction } from "@/components/confirm-action";
import { deleteBillingPeriod } from "@/app/actions/billing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Wallet, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

export default async function BillsPage() {
  const user = await requireUser();
  const isFinance = user.role === "ADMIN" || user.role === "TREASURER";
  const nowJkt = getJakartaDate();
  const currentYear = nowJkt.getFullYear();
  const currentMonth = nowJkt.getMonth() + 1;

  const db = getDb();
  const eligibleMembers = isFinance ? await db.user.findMany({
    where: { isActive: true, role: { not: "ADMIN" } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  }) : [];
  const today = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(nowJkt.getDate()).padStart(2, "0")}`;
  const periods = await db.billingPeriod.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      bills: {
        where: { member: { role: { not: "ADMIN" } } },
        include: {
          member: { select: { id: true, name: true, email: true, avatarUrl: true } },
          manualPayment: { select: { id: true } },
          submissions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, status: true, rejectionReason: true },
          },
        },
      },
    },
  });

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Keuangan bersama</p>
          <h1 className="page-title">Tagihan kas bulanan</h1>
        </div>
        {isFinance && <BillingGenerator defaultYear={currentYear} defaultMonth={currentMonth} members={eligibleMembers} />}
      </header>

      {periods.length === 0 ? (
        <Card className="empty-state">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Wallet className="size-6" />
          </div>
          <h2 className="text-xl font-semibold">Belum ada periode tagihan</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isFinance
              ? "Klik tombol di atas untuk membuat tagihan kas bulan berjalan."
              : "Admin atau Bendahara belum membuat tagihan kas untuk periode ini."}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {periods.map((period) => {
            const myBill = period.bills.find((b) => b.memberId === user.id);
            const paidCount = period.bills.filter((b) => b.status === "PAID").length;
            const totalCount = period.bills.length;
            const myStatus = myBill ? getBillDisplayStatus(myBill.status, period.dueDate) : null;
            const latestSub = myBill?.submissions[0];

            return (
              <Card key={period.id} className="overflow-hidden rounded-2xl">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">
                        {formatJakartaMonthYear(period.year, period.month)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Jatuh tempo: {formatJakartaDate(period.dueDate)} · {formatRupiah(period.amountPerMember)} / anggota
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Kelunasan</p>
                        <p className="font-medium">
                          {paidCount} / {totalCount} anggota
                        </p>
                      </div>
                      <div className="h-10 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%` }}
                        />
                      </div>
                      {isFinance && (
                        <ConfirmAction
                          action={deleteBillingPeriod}
                          label="Hapus periode"
                          description="Periode dan seluruh tagihan yang masih kosong akan dihapus permanen. Periode yang sudah memiliki aktivitas pembayaran tidak dapat dihapus."
                        >
                          <input type="hidden" name="periodId" value={period.id} />
                        </ConfirmAction>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 p-4 sm:p-6">
                  {/* Personal bill card for the logged-in user */}
                  {myBill && (
                    <div className="rounded-xl border bg-card p-5 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Kewajiban kas saya</p>
                          <p className="text-2xl font-bold tracking-tight">{formatRupiah(myBill.amount)}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant={myStatus?.variant}>{myStatus?.label}</Badge>
                            {myBill.status === "REJECTED" && latestSub?.rejectionReason && (
                              <p className="text-xs text-destructive">
                                Alasan penolakan: {latestSub.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          {myBill.status === "PAID" ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-5" /> Pembayaran telah lunas
                            </span>
                          ) : myBill.status === "PENDING_REVIEW" ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                              <AlertCircle className="size-5" /> Bukti dalam antrean review
                            </span>
                          ) : (
                            <Button asChild className="min-h-11">
                              <Link href={`/bills/${myBill.id}/pay`}>
                                Bayar via QRIS <ArrowRight className="size-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shared payment transparency for every authenticated household member. */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">Status pembayaran seluruh anggota</h3>
                    <div className="divide-y rounded-xl border bg-card">
                      {period.bills.map((bill) => {
                        const status = getBillDisplayStatus(bill.status, period.dueDate);
                        return (
                          <div key={bill.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar className="size-10">
                                <AvatarImage src={bill.member.avatarUrl || undefined} alt={`Foto profil ${bill.member.name}`} className="object-cover" />
                                <AvatarFallback className="font-semibold">{bill.member.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium leading-tight">{bill.member.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{bill.member.email}</p>
                              </div>
                            </div>
                            <div className="ml-[52px] flex w-full flex-wrap items-center justify-between gap-3 sm:ml-0 sm:w-auto sm:justify-end">
                              <span className="text-sm font-medium">{formatRupiah(bill.amount)}</span>
                              <Badge variant={status.variant}>{status.label}</Badge>
                              {bill.manualPayment && <span className="text-xs text-muted-foreground">Dicatat manual</span>}
                              {isFinance && bill.status !== "PAID" && <ManualPaymentForm billId={bill.id} memberName={bill.member.name} amount={bill.amount} today={today} pendingReview={bill.status === "PENDING_REVIEW"} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
