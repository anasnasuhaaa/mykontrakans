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
      member: { select: { id: true, name: true, email: true, role: true } },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!bill) {
    notFound();
  }

  if (bill.member.role === "ADMIN") {
    redirect("/bills");
  }

  // Ensure member is the owner or finance role
  if (bill.memberId !== user.id && user.role !== "ADMIN" && user.role !== "TREASURER") {
    redirect("/bills");
  }

  const periodLabel = formatJakartaMonthYear(bill.billingPeriod.year, bill.billingPeriod.month);
  const dueDateLabel = formatJakartaDate(bill.billingPeriod.dueDate);
  const latestSubmission = bill.submissions[0];

  return (
    <div className="page-stack">
      <div>
        <Link
          href="/bills"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" /> Kembali ke daftar tagihan
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-eyebrow">Pembayaran kas</p>
            <h1 className="page-title">Tagihan {periodLabel}</h1>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-muted-foreground">Nominal yang harus dibayar</p>
            <p className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">{formatRupiah(bill.amount)}</p>
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
