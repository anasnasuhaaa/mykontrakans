import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email("Email tidak valid."));
export const passwordSchema = z.string().min(12, "Password minimal 12 karakter.").max(72, "Password maksimal 72 karakter.")
  .refine((value) => new TextEncoder().encode(value).length <= 72, "Password maksimal 72 byte.");
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Masukkan password.").max(72),
});
