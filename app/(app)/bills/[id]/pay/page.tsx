import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { formatJakartaMonthYear, formatJakartaDate } from "@/lib/dates";
import { formatRupiah } from "@/lib/utils";
import { PaymentSubmissionForm } from "@/components/payments/payment-submission-form";
import { ArrowLeft } from "lucide-react";

export default async function PayBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const db = getDb();
  const bill = await db.memberBill.findUnique({
    where: { id },
    include: {
      billingPeriod: true,
      member: { select: { id: true, name: true, email: true } },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!bill) {
    notFound();
  }

  // Ensure member is the owner or finance role
  if (bill.memberId !== user.id && user.role !== "ADMIN" && user.role !== "TREASURER") {
    redirect("/bills");
  }

  const periodLabel = formatJakartaMonthYear(bill.billingPeriod.year, bill.billingPeriod.month);
  const dueDateLabel = formatJakartaDate(bill.billingPeriod.dueDate);
  const latestSubmission = bill.submissions[0];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/bills"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" /> Kembali ke daftar tagihan
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Pembayaran Kas</p>
            <h1 className="text-3xl font-bold tracking-tight">Tagihan {periodLabel}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Nominal yang harus dibayar</p>
            <p className="text-3xl font-extrabold text-primary">{formatRupiah(bill.amount)}</p>
          </div>
        </div>
      </div>

      <PaymentSubmissionForm
        billId={bill.id}
        amount={bill.amount}
        periodLabel={periodLabel}
        dueDateLabel={dueDateLabel}
        status={bill.status}
        rejectionReason={latestSubmission?.rejectionReason}
        lastEvidenceUrl={latestSubmission?.evidencePath}
      />
    </div>
  );
}
