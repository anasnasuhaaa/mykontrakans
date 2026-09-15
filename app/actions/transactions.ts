"use server";

import { revalidatePath } from "next/cache";
import { requireUser, financeRoles } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { actionError, BusinessError, type ActionState } from "@/lib/actions";
import { transactionSchema } from "@/lib/validators/finance";
import { uploadEvidenceFile } from "@/lib/storage";

export async function createTransaction(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser(financeRoles);
  try {
    const rawDate = form.get("transactionDate");
    const parsed = transactionSchema.parse({
      type: form.get("type"),
      categoryId: form.get("categoryId"),
      amount: form.get("amount"),
      description: form.get("description"),
      transactionDate: rawDate ? new Date(String(rawDate)) : new Date(),
    });

    const file = form.get("receipt");
    let receiptUrl: string | undefined;
    let receiptType: string | undefined;

    if (file instanceof File && file.size > 0) {
      const uploaded = await uploadEvidenceFile(file, "receipts");
      receiptUrl = uploaded.url;
      receiptType = uploaded.mimeType;
    }

    const db = getDb();
    await db.$transaction(async (tx) => {
      const category = await tx.financialCategory.findUnique({
        where: { id: parsed.categoryId },
      });

      if (!category) {
        throw new BusinessError("Kategori transaksi tidak ditemukan.");
      }

      if (category.type !== parsed.type) {
        throw new BusinessError("Tipe kategori tidak sesuai dengan tipe transaksi.");
      }

      const txRecord = await tx.transaction.create({
        data: {
          type: parsed.type,
          categoryId: category.id,
          amount: parsed.amount,
          description: parsed.description,
          transactionDate: parsed.transactionDate,
          createdById: actor.id,
          receiptPath: receiptUrl,
          receiptType: receiptType,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "TRANSACTION_CREATED",
          entityType: "Transaction",
          entityId: txRecord.id,
          metadata: {
            type: parsed.type,
            amount: parsed.amount,
            category: category.name,
            description: parsed.description,
          },
        },
      });
    });

    revalidatePath("/transactions");
    revalidatePath("/history");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `${parsed.type === "INCOME" ? "Pemasukan" : "Pengeluaran"} berhasil dicatat.`,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateTransaction(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser(financeRoles);
  try {
    const id = String(form.get("id") || "").trim();
    if (!id) {
      throw new BusinessError("ID transaksi tidak ditemukan.");
    }

    const rawDate = form.get("transactionDate");
    const parsed = transactionSchema.parse({
      type: form.get("type"),
      categoryId: form.get("categoryId"),
      amount: form.get("amount"),
      description: form.get("description"),
      transactionDate: rawDate ? new Date(String(rawDate)) : new Date(),
    });

    const db = getDb();
    const [existing, category] = await Promise.all([
      db.transaction.findUnique({ where: { id } }),
      db.financialCategory.findUnique({ where: { id: parsed.categoryId } }),
    ]);

    if (!existing) {
      throw new BusinessError("Transaksi tidak ditemukan.");
    }
    if (existing.relatedPaymentId || existing.relatedBillId) {
      throw new BusinessError("Transaksi otomatis dari pembayaran kas tidak dapat diedit manual.");
    }
    if (!category) {
      throw new BusinessError("Kategori transaksi tidak ditemukan.");
    }
    if (category.type !== parsed.type) {
      throw new BusinessError("Tipe kategori tidak sesuai dengan tipe transaksi.");
    }

    const file = form.get("receipt");
    let receiptUrl = existing.receiptPath;
    let receiptType = existing.receiptType;
    if (file instanceof File && file.size > 0) {
      const uploaded = await uploadEvidenceFile(file, "receipts");
      receiptUrl = uploaded.url;
      receiptType = uploaded.mimeType;
    }

    await db.$transaction(async (tx) => {
      const editable = await tx.transaction.findUnique({ where: { id } });
      if (!editable) {
        throw new BusinessError("Transaksi tidak ditemukan.");
      }
      if (editable.relatedPaymentId || editable.relatedBillId) {
        throw new BusinessError("Transaksi otomatis dari pembayaran kas tidak dapat diedit manual.");
      }

      await tx.transaction.update({
        where: { id },
        data: {
          type: parsed.type,
          categoryId: category.id,
          amount: parsed.amount,
          description: parsed.description,
          transactionDate: parsed.transactionDate,
          receiptPath: receiptUrl,
          receiptType,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "TRANSACTION_UPDATED",
          entityType: "Transaction",
          entityId: id,
          metadata: {
            type: parsed.type,
            amount: parsed.amount,
            category: category.name,
            description: parsed.description,
          },
        },
      });
    });

    revalidatePath("/transactions");
    revalidatePath("/history");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Transaksi berhasil diperbarui.",
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteTransaction(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser(financeRoles);
  try {
    const id = String(form.get("id") || "").trim();
    if (!id) {
      throw new BusinessError("ID transaksi tidak ditemukan.");
    }

    const db = getDb();
    await db.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new BusinessError("Transaksi tidak ditemukan.");
      }

      if (existing.relatedPaymentId || existing.relatedBillId) {
        throw new BusinessError("Transaksi otomatis dari pembayaran kas tidak dapat dihapus manual.");
      }

      await tx.transaction.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "TRANSACTION_DELETED",
          entityType: "Transaction",
          entityId: id,
          metadata: {
            type: existing.type,
            amount: existing.amount,
            description: existing.description,
          },
        },
      });
    });

    revalidatePath("/transactions");
    revalidatePath("/history");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Transaksi berhasil dihapus.",
    };
  } catch (error) {
    return actionError(error);
  }
}
