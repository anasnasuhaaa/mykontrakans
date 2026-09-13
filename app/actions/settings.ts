"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser, financeRoles } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { actionError, BusinessError, type ActionState } from "@/lib/actions";
import { categorySchema, settingsSchema } from "@/lib/validators/finance";

export async function saveCategory(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser(financeRoles);
  try {
    const input = categorySchema.parse(Object.fromEntries(form));
    const id = z.string().max(100).parse(form.get("id") || "");
    await getDb().$transaction(async (tx) => {
      if (id) {
        const category = await tx.financialCategory.findUniqueOrThrow({ where: { id }, include: { _count: { select: { transactions: true } } } });
        if (category.type !== input.type && (category.systemKey || category._count.transactions > 0)) throw new BusinessError("Jenis kategori yang sudah digunakan tidak dapat diubah.");
      }
      const category = id ? await tx.financialCategory.update({ where: { id }, data: { ...input, isActive: form.get("isActive") === "true" } }) : await tx.financialCategory.create({ data: input });
      if (category.systemKey && !category.isActive) throw new BusinessError("Kategori kas sistem harus tetap aktif.");
      await tx.auditLog.create({ data: { actorId: actor.id, action: "CATEGORY_SAVED", entityType: "FinancialCategory", entityId: category.id } });
    }, { isolationLevel: "Serializable" });
    revalidatePath("/categories");
    return { success: true, message: "Kategori disimpan." };
  } catch (error) { return actionError(error); }
}

export async function deleteCategory(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser(financeRoles);
  try {
    const id = z.string().min(1).parse(form.get("id"));
    await getDb().$transaction(async (tx) => {
      const category = await tx.financialCategory.findUniqueOrThrow({ where: { id }, include: { _count: { select: { transactions: true } } } });
      if (category.systemKey) throw new BusinessError("Kategori kas sistem tidak dapat dihapus.");
      if (category._count.transactions) throw new BusinessError("Kategori telah digunakan. Nonaktifkan melalui Edit agar riwayat tetap utuh.");
      await tx.financialCategory.delete({ where: { id } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "CATEGORY_DELETED", entityType: "FinancialCategory", entityId: id } });
    });
    revalidatePath("/categories");
    return { success: true, message: "Kategori dihapus." };
  } catch (error) { return actionError(error); }
}

export async function saveSettings(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser(["ADMIN"]);
  try {
    const input = settingsSchema.parse(Object.fromEntries(form));
    await getDb().$transaction(async (tx) => {
      await tx.appSetting.upsert({ where: { id: "default" }, update: input, create: input });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "SETTINGS_UPDATED", entityType: "AppSetting", entityId: "default", metadata: input } });
    });
    revalidatePath("/", "layout");
    return { success: true, message: "Pengaturan disimpan. Berlaku untuk tagihan baru." };
  } catch (error) { return actionError(error); }
}
