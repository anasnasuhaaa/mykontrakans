"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, financeRoles } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { actionError, BusinessError, type ActionState } from "@/lib/actions";
import { uploadEvidenceFile } from "@/lib/storage";
import { notifySafely } from "@/lib/email";
import { formatRupiah } from "@/lib/utils";

const rejectSchema = z.object({
  submissionId: z.string().min(1, "ID bukti transfer tidak ditemukan."),
  reason: z.string().trim().min(5, "Alasan penolakan minimal 5 karakter.").max(255, "Alasan penolakan maksimal 255 karakter."),
});

export async function submitPaymentEvidence(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser();
  try {
    const billId = String(form.get("billId") || "").trim();
    if (!billId) {
      throw new BusinessError("ID tagihan tidak ditemukan.");
    }

    const file = form.get("evidence");
    if (!(file instanceof File) || file.size === 0) {
      throw new BusinessError("Pilih file bukti transfer pembayaran.");
    }

    const db = getDb();
    const bill = await db.memberBill.findUnique({
      where: { id: billId },
      include: {
        billingPeriod: true,
        member: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!bill) {
      throw new BusinessError("Tagihan tidak ditemukan.");
    }

    if (bill.member.role === "ADMIN") {
      throw new BusinessError("Admin tidak dikenai tagihan kas.");
    }

    // Only the bill owner or finance admin can submit
    if (bill.memberId !== actor.id && actor.role !== "ADMIN" && actor.role !== "TREASURER") {
      throw new BusinessError("Anda tidak memiliki izin untuk membayar tagihan ini.");
    }

    if (bill.status === "PAID") {
      throw new BusinessError("Tagihan ini sudah lunas.");
    }

    if (bill.status === "PENDING_REVIEW") {
      throw new BusinessError("Bukti pembayaran sedang menunggu proses review oleh Bendahara.");
    }

    // Upload evidence file (uses Vercel Blob if configured, or local upload in development)
    const uploaded = await uploadEvidenceFile(file, "payment-evidence");

    await db.$transaction(async (tx) => {
      // Create new payment submission
      const submission = await tx.paymentSubmission.create({
        data: {
          billId: bill.id,
          memberId: actor.id,
          evidencePath: uploaded.url,
          evidenceType: uploaded.mimeType,
          status: "PENDING_REVIEW",
        },
      });

      // Update bill status to PENDING_REVIEW
      await tx.memberBill.update({
        where: { id: bill.id },
        data: {
          status: "PENDING_REVIEW",
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "PAYMENT_SUBMITTED",
          entityType: "PaymentSubmission",
          entityId: submission.id,
          metadata: {
            billId: bill.id,
            amount: bill.amount,
            period: `${bill.billingPeriod.month}/${bill.billingPeriod.year}`,
            evidenceUrl: uploaded.url,
          },
        },
      });
    }, { isolationLevel: "Serializable" });

    // Send confirmation email to member
    await notifySafely({
      to: bill.member.email,
      name: bill.member.name,
      subject: "Bukti Pembayaran Kas Diterima",
      message: `Bukti transfer pembayaran kas Anda untuk periode ${bill.billingPeriod.month}/${bill.billingPeriod.year} sebesar ${formatRupiah(bill.amount)} telah berhasil diterima.\n\nStatus saat ini: Menunggu Review. Bendahara atau Admin akan memverifikasi bukti pembayaran Anda segera.`,
      button: "Lihat Status Tagihan",
      link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/bills`,
    });

    revalidatePath("/bills");
    revalidatePath(`/bills/${bill.id}/pay`);
    revalidatePath("/dashboard");
    revalidatePath("/payments/review");

    return {
      success: true,
      message: "Bukti pembayaran berhasil dikirim dan sedang dalam antrean review.",
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function approvePaymentSubmission(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser(financeRoles);
  try {
    const submissionId = String(form.get("submissionId") || "").trim();
    if (!submissionId) {
      throw new BusinessError("ID pengajuan tidak ditemukan.");
    }

    const db = getDb();
    const submission = await db.paymentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        bill: {
          include: {
            billingPeriod: true,
            member: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!submission) {
      throw new BusinessError("Data pengajuan pembayaran tidak ditemukan.");
    }

    if (submission.status !== "PENDING_REVIEW") {
      throw new BusinessError("Pengajuan ini sudah diproses sebelumnya.");
    }

    const bill = submission.bill;
    if (bill.status === "PAID") {
      throw new BusinessError("Tagihan ini sudah tercatat lunas.");
    }

    await db.$transaction(async (tx) => {
      // Find or create Uang Kas category
      let category = await tx.financialCategory.findFirst({
        where: {
          OR: [
            { systemKey: "MONTHLY_DUES" },
            { name: "Uang Kas", type: "INCOME" },
          ],
        },
      });

      if (!category) {
        category = await tx.financialCategory.create({
          data: {
            name: "Uang Kas",
            type: "INCOME",
            systemKey: "MONTHLY_DUES",
          },
        });
      }

      // 1. Mark submission approved (status: PAID)
      await tx.paymentSubmission.update({
        where: { id: submission.id },
        data: {
          status: "PAID",
          reviewerId: actor.id,
          reviewedAt: new Date(),
        },
      });

      // 2. Mark bill paid
      await tx.memberBill.update({
        where: { id: bill.id },
        data: {
          status: "PAID",
        },
      });

      // 3. Create unique income transaction
      await tx.transaction.create({
        data: {
          type: "INCOME",
          categoryId: category.id,
          amount: bill.amount,
          description: `Iuran kas ${bill.billingPeriod.month}/${bill.billingPeriod.year} — ${bill.member.name}`,
          transactionDate: new Date(),
          createdById: actor.id,
          relatedPaymentId: submission.id,
          receiptPath: submission.evidencePath,
          receiptType: submission.evidenceType,
        },
      });

      // 4. Audit log
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "PAYMENT_APPROVED",
          entityType: "PaymentSubmission",
          entityId: submission.id,
          metadata: {
            billId: bill.id,
            memberId: bill.member.id,
            memberName: bill.member.name,
            amount: bill.amount,
            period: `${bill.billingPeriod.month}/${bill.billingPeriod.year}`,
          },
        },
      });
    }, { isolationLevel: "Serializable" });

    // Send success email to member
    await notifySafely({
      to: bill.member.email,
      name: bill.member.name,
      subject: "Pembayaran Kas Disetujui",
      message: `Selamat! Pembayaran kas Anda untuk periode ${bill.billingPeriod.month}/${bill.billingPeriod.year} sebesar ${formatRupiah(bill.amount)} telah diverifikasi dan disetujui oleh ${actor.name}.\n\nStatus tagihan: LUNAS.`,
      button: "Lihat Bukti & Riwayat",
      link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/bills`,
    });

    revalidatePath("/payments/review");
    revalidatePath("/bills");
    revalidatePath(`/bills/${bill.id}/pay`);
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/history");

    return {
      success: true,
      message: `Pembayaran ${bill.member.name} berhasil disetujui dan dicatat ke kas.`,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function rejectPaymentSubmission(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser(financeRoles);
  try {
    const parsed = rejectSchema.parse({
      submissionId: form.get("submissionId"),
      reason: form.get("reason"),
    });

    const db = getDb();
    const submission = await db.paymentSubmission.findUnique({
      where: { id: parsed.submissionId },
      include: {
        bill: {
          include: {
            billingPeriod: true,
            member: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!submission) {
      throw new BusinessError("Data pengajuan pembayaran tidak ditemukan.");
    }

    if (submission.status !== "PENDING_REVIEW") {
      throw new BusinessError("Pengajuan ini sudah diproses sebelumnya.");
    }

    const bill = submission.bill;

    await db.$transaction(async (tx) => {
      // 1. Mark submission rejected
      await tx.paymentSubmission.update({
        where: { id: submission.id },
        data: {
          status: "REJECTED",
          rejectionReason: parsed.reason,
          reviewerId: actor.id,
          reviewedAt: new Date(),
        },
      });

      // 2. Mark bill rejected
      await tx.memberBill.update({
        where: { id: bill.id },
        data: {
          status: "REJECTED",
        },
      });

      // 3. Audit log
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "PAYMENT_REJECTED",
          entityType: "PaymentSubmission",
          entityId: submission.id,
          metadata: {
            billId: bill.id,
            memberId: bill.member.id,
            memberName: bill.member.name,
            reason: parsed.reason,
          },
        },
      });
    }, { isolationLevel: "Serializable" });

    // Send rejection email to member
    await notifySafely({
      to: bill.member.email,
      name: bill.member.name,
      subject: "Pembayaran Kas Perlu Diperbaiki",
      message: `Bukti transfer kas Anda untuk periode ${bill.billingPeriod.month}/${bill.billingPeriod.year} tidak dapat disetujui oleh ${actor.name}.\n\nAlasan: ${parsed.reason}\n\nSilakan unggah ulang bukti transfer yang sesuai melalui aplikasi.`,
      button: "Upload Ulang Bukti",
      link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/bills/${bill.id}/pay`,
    });

    revalidatePath("/payments/review");
    revalidatePath("/bills");
    revalidatePath(`/bills/${bill.id}/pay`);
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Pembayaran ${bill.member.name} ditolak. Notifikasi telah dikirim ke anggota.`,
    };
  } catch (error) {
    return actionError(error);
  }
}
