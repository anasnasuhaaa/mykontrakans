import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email("Email tidak valid."));
export const passwordSchema = z.string().min(6, "Password minimal 6 karakter.").max(72, "Password maksimal 72 karakter.")
  .refine((value) => new TextEncoder().encode(value).length <= 72, "Password maksimal 72 byte.");
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Masukkan password.").max(72),
});

export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "Tautan reset password tidak valid. Minta tautan baru."),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((input) => input.password === input.confirmPassword, {
  message: "Konfirmasi password tidak sama.", path: ["confirmPassword"],
});
