import { put } from "@vercel/blob";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { BusinessError } from "@/lib/actions";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_UPLOAD_LABEL,
  MAX_IMAGE_UPLOAD_SIZE,
} from "@/lib/upload-constraints";

const allowedMimeTypes = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);

export type UploadedFileResult = {
  url: string;
  mimeType: string;
  size: number;
};

function validateUpload(file: File, label: string): void {
  if (!allowedMimeTypes.has(file.type.toLowerCase())) {
    throw new BusinessError(`Format ${label} harus JPG, JPEG, PNG, atau WEBP.`);
  }
  if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
    throw new BusinessError(`Ukuran ${label} tidak boleh melebihi ${MAX_IMAGE_UPLOAD_LABEL}.`);
  }
  if (file.size === 0) {
    throw new BusinessError(`File ${label} kosong.`);
  }
}

export function validateImageFile(file: File): void {
  validateUpload(file, "bukti pembayaran");
}

export function validateAvatarImageFile(file: File): void {
  validateUpload(file, "foto profil");
}

async function persistImage(file: File, folder: string): Promise<UploadedFileResult> {
  const rawExtension = file.type.split("/")[1] || "jpg";
  const extension = rawExtension === "jpeg" ? "jpg" : rawExtension;
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

export async function uploadEvidenceFile(file: File, folder = "evidence"): Promise<UploadedFileResult> {
  validateImageFile(file);
  return persistImage(file, folder);
}

export async function uploadProfileImage(file: File): Promise<UploadedFileResult> {
  validateAvatarImageFile(file);
  return persistImage(file, "profile-avatars");
}
