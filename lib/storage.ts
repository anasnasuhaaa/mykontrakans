import { put } from "@vercel/blob";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { BusinessError } from "@/lib/actions";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export type UploadedFileResult = {
  url: string;
  mimeType: string;
  size: number;
};

export function validateImageFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    throw new BusinessError("Format bukti pembayaran harus JPG, JPEG, PNG, atau WEBP.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new BusinessError("Ukuran bukti pembayaran tidak boleh melebihi 5 MB.");
  }
  if (file.size === 0) {
    throw new BusinessError("File bukti pembayaran kosong.");
  }
}

export async function uploadEvidenceFile(file: File, folder = "evidence"): Promise<UploadedFileResult> {
  validateImageFile(file);

  const extension = file.type.split("/")[1] || "jpg";
  const uniqueId = randomBytes(16).toString("hex");
  const filename = `${folder}/${Date.now()}-${uniqueId}.${extension}`;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const blob = await put(filename, file, {
      access: "public",
      token,
    });
    return {
      url: blob.url,
      mimeType: file.type,
      size: file.size,
    };
  }

  // Fallback for local development when BLOB_READ_WRITE_TOKEN is not configured
  const uploadsDir = join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadsDir, { recursive: true });

  const localFileName = `${Date.now()}-${uniqueId}.${extension}`;
  const localFilePath = join(uploadsDir, localFileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(localFilePath, buffer);

  return {
    url: `/uploads/${folder}/${localFileName}`,
    mimeType: file.type,
    size: file.size,
  };
}
