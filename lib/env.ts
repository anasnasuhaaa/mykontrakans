import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url().refine((value) => value.startsWith("postgres"), "Gunakan URL PostgreSQL."),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
});

export function getServerEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Konfigurasi server belum lengkap: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  }
  if (process.env.NODE_ENV === "production" && !parsed.data.NEXT_PUBLIC_APP_URL.startsWith("https://")) {
    throw new Error("NEXT_PUBLIC_APP_URL harus HTTPS di production.");
  }
  return parsed.data;
}
