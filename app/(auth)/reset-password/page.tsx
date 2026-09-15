import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { PasswordResetForm } from "@/components/password-reset-form";

export const metadata: Metadata = { referrer: "no-referrer", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main className="min-h-dvh p-6">
    <div className="flex justify-end"><ThemeToggle /></div>
    <section className="mx-auto mt-12 max-w-md rounded-3xl bg-card p-7 shadow-sm">
      <BrandLogo className="mb-6 size-12" />
      <h1 className="text-3xl font-semibold">Buat password baru</h1>
      <p className="my-4 text-muted-foreground">Gunakan minimal 6 karakter. Setelah berhasil, masuk kembali dengan password barumu.</p>
      {typeof token === "string" && /^[a-f0-9]{64}$/.test(token)
        ? <PasswordResetForm token={token} />
        : <p role="alert" className="text-destructive">Tautan reset password tidak valid. Silakan minta tautan baru.</p>}
      <div className="mt-6 flex flex-wrap gap-x-5">
        <Link className="inline-flex min-h-11 items-center text-sm text-primary" href="/login">Kembali ke halaman masuk</Link>
        <Link className="inline-flex min-h-11 items-center text-sm text-primary" href="/forgot-password">Minta tautan baru</Link>
      </div>
    </section>
  </main>;
}
