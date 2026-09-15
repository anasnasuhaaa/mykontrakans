import { z } from "zod";
import { getJakartaDate } from "@/lib/dates";

export const manualPaymentSchema = z.object({
  billId: z.string().min(1, "Tagihan tidak ditemukan.").max(100),
  method: z.enum(["CASH", "BANK_TRANSFER"], { error: "Pilih metode pembayaran." }),
  paymentDate: z.iso.date("Tanggal pembayaran tidak valid.").refine((value) => {
    const now = getJakartaDate();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return value <= today;
  }, "Tanggal pembayaran tidak boleh di masa depan."),
  note: z.string().trim().max(255, "Catatan maksimal 255 karakter.").default(""),
});

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
