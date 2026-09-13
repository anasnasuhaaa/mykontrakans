import { z } from "zod";

export const amountSchema = z.coerce
  .number()
  .int("Nominal harus berupa Rupiah bulat.")
  .min(1, "Nominal harus lebih dari nol.")
  .max(100000000, "Nominal maksimal Rp100.000.000.");

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(60),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export const settingsSchema = z.object({
  houseName: z.string().trim().min(2).max(60),
  monthlyDuesAmount: amountSchema,
  monthlyDueDay: z.coerce.number().int().min(1).max(31),
});

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().min(1, "Pilih kategori."),
  amount: amountSchema,
  description: z.string().trim().min(2, "Deskripsi minimal 2 karakter.").max(255),
  transactionDate: z.coerce.date().default(() => new Date()),
});
