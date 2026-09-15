import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/password-reset";
import { ActionForm } from "@/components/action-form";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Field } from "@/components/form-fields";

export default function ForgotPasswordPage() {
  return <main className="min-h-dvh p-6">
    <div className="flex justify-end"><ThemeToggle /></div>
    <section className="mx-auto mt-12 max-w-md rounded-3xl bg-card p-7 shadow-sm">
      <BrandLogo className="mb-6 size-12" />
      <h1 className="text-3xl font-semibold">Lupa password?</h1>
      <p className="my-4 text-muted-foreground">Masukkan email akunmu. Kami akan mengirim tautan untuk membuat password baru.</p>
      <ActionForm action={requestPasswordReset} submitLabel="Kirim tautan reset">
        <Field name="email" label="Email" type="email" autoComplete="email" placeholder="nama@email.com" maxLength={254} required />
      </ActionForm>
      <Link className="mt-6 inline-flex min-h-11 items-center text-sm text-primary" href="/login">Kembali ke halaman masuk</Link>
    </section>
  </main>;
}
