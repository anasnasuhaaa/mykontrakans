import { requireUser, financeRoles } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { PaymentReviewer } from "@/components/payments/payment-reviewer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCheck } from "lucide-react";

export default async function PaymentReviewPage() {
  await requireUser(financeRoles);

  const db = getDb();
  const pendingSubmissions = await db.paymentSubmission.findMany({
    where: {
      status: "PENDING_REVIEW",
      bill: { member: { role: { not: "ADMIN" } } },
    },
    orderBy: { createdAt: "asc" },
    include: {
      bill: {
        include: {
          billingPeriod: { select: { month: true, year: true } },
          member: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Verifikasi keuangan</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">Review pembayaran</h1>
            {pendingSubmissions.length > 0 && (
              <Badge variant="destructive" className="rounded-full px-2.5">
                {pendingSubmissions.length} antrean
              </Badge>
            )}
          </div>
        </div>
      </header>

      {pendingSubmissions.length === 0 ? (
        <Card className="empty-state">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCheck className="size-6" />
          </div>
          <h2 className="text-xl font-semibold">Semua antrean bersih</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tidak ada bukti transfer yang menunggu review saat ini.
          </p>
        </Card>
      ) : (
        <PaymentReviewer items={pendingSubmissions} />
      )}
    </div>
  );
}
