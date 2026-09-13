import Link from "next/link";
import { activateAccount } from "@/app/actions/members";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/form-fields";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main className="min-h-dvh p-6"><div className="flex justify-end"><ThemeToggle /></div><section className="mx-auto mt-12 max-w-md rounded-3xl bg-card p-7 shadow-sm"><p className="mb-6 font-semibold text-primary">MyKontrakans</p><h1 className="text-3xl font-semibold">Selamat bergabung.</h1><p className="my-4 text-muted-foreground">Buat password minimal 12 karakter untuk mengaktifkan akun.</p>{token && /^[a-f0-9]{64}$/.test(token) ? <ActionForm action={activateAccount} submitLabel="Aktifkan akun"><input type="hidden" name="token" value={token} /><Field name="password" label="Password baru" type="password" minLength={12} maxLength={72} autoComplete="new-password" required /><Field name="confirmPassword" label="Ulangi password" type="password" autoComplete="new-password" required /></ActionForm> : <p role="alert" className="text-destructive">Link undangan tidak valid. Minta undangan baru kepada Admin.</p>}<Link className="mt-6 inline-flex min-h-11 items-center text-sm text-primary" href="/login">Kembali ke halaman masuk</Link></section></main>;
}
