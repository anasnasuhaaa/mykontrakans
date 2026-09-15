"use client";

import { useState } from "react";
import { resetPassword } from "@/app/actions/password-reset";
import { ActionForm } from "@/components/action-form";
import { PasswordField } from "@/components/password-field";

export function PasswordResetForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  if (message) return <p role="status" className="text-sm">{message}</p>;
  return <ActionForm action={async (state, form) => {
    const result = await resetPassword(state, form);
    if (result.success) setMessage(result.message || "Password berhasil diperbarui.");
    return result;
  }} submitLabel="Simpan password baru">
    <input type="hidden" name="token" value={token} />
    <PasswordField name="password" label="Password baru" minLength={6} maxLength={72} autoComplete="new-password" required />
    <PasswordField name="confirmPassword" label="Ulangi password baru" minLength={6} maxLength={72} autoComplete="new-password" required />
  </ActionForm>;
}
