import { z } from "zod";
import { emailSchema, passwordSchema } from "./auth";

export const memberSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100),
  email: emailSchema,
  role: z.enum(["ADMIN", "TREASURER", "MEMBER"]),
});
export const onboardingSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "Link undangan tidak valid."),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, { message: "Konfirmasi password tidak sama.", path: ["confirmPassword"] });
