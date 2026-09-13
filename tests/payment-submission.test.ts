import assert from "node:assert/strict";
import test from "node:test";
import { validateImageFile } from "../lib/storage";

test("image file validator enforces types and size bounds", () => {
  // Valid JPG
  const validJpg = new File(["dummy image content"], "evidence.jpg", { type: "image/jpeg" });
  assert.doesNotThrow(() => validateImageFile(validJpg));

  // Valid PNG
  const validPng = new File(["dummy png content"], "evidence.png", { type: "image/png" });
  assert.doesNotThrow(() => validateImageFile(validPng));

  // Valid WEBP
  const validWebp = new File(["dummy webp content"], "evidence.webp", { type: "image/webp" });
  assert.doesNotThrow(() => validateImageFile(validWebp));

  // Invalid PDF format
  const invalidPdf = new File(["dummy pdf content"], "evidence.pdf", { type: "application/pdf" });
  assert.throws(() => validateImageFile(invalidPdf), /Format bukti pembayaran harus JPG, JPEG, PNG, atau WEBP/);

  // Empty file (size 0)
  const emptyFile = new File([], "empty.jpg", { type: "image/jpeg" });
  assert.throws(() => validateImageFile(emptyFile), /kosong/);

  // Oversized file (> 5 MB)
  const oversizedBuffer = new Uint8Array(5 * 1024 * 1024 + 1024);
  const oversizedFile = new File([oversizedBuffer], "huge.jpg", { type: "image/jpeg" });
  assert.throws(() => validateImageFile(oversizedFile), /tidak boleh melebihi 5 MB/);
});
