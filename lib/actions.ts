import { Prisma } from "@prisma/client";
import { z } from "zod";

export type ActionState = { success?: boolean; message?: string; details?: string[] };
export type FormAction = (state: ActionState, data: FormData) => Promise<ActionState>;

export class BusinessError extends Error {}

export function actionError(error: unknown): ActionState {
  if (error instanceof z.ZodError) return { success: false, message: error.issues[0]?.message || "Periksa isian formulir." };
  if (error instanceof BusinessError) return { success: false, message: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { success: false, message: "Data sudah ada. Muat ulang halaman sebelum mencoba lagi." };
    if (error.code === "P2034") return { success: false, message: "Data sedang diperbarui. Silakan coba lagi." };
  }
  console.error("Action failed", error instanceof Error ? error.name : "UnknownError");
  return { success: false, message: "Proses belum berhasil. Periksa konfigurasi layanan atau coba lagi." };
}
