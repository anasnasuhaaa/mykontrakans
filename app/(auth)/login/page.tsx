import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/password-field";

export default function LoginPage() {
  return <main className="min-h-dvh p-5 sm:p-8 lg:grid lg:grid-cols-2 lg:gap-12">
    <section className="relative hidden overflow-hidden rounded-[2rem] bg-[#1748b5] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-3 text-xl font-semibold"><BrandLogo className="size-10" alt="" /> MyKontrakans</div>
      <div className="relative z-10 max-w-lg space-y-6"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">Satu rumah. Satu cerita. <ArrowUpRight className="size-4" /></span><h1 className="text-6xl leading-[1.1] font-semibold tracking-tight">Tinggal bersama,<br />lebih tertata.</h1><p className="max-w-sm text-lg leading-relaxed text-blue-100">Urus kas dan kebutuhan rumah, tanpa ribet. Lebih banyak waktu untuk hal yang berarti.</p></div>
      <div className="absolute -right-32 top-1/3 size-[32rem] rounded-full border-[70px] border-white/5" aria-hidden="true" />
      <p className="text-sm text-blue-100">Rumah nyaman dimulai dari kebersamaan.</p>
    </section>
    <section className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2 font-semibold lg:invisible"><BrandLogo className="size-8" alt="" /> MyKontrakans</div><ThemeToggle /></div>
      <div className="mx-auto my-auto w-full max-w-sm py-16">
        <div className="mb-8"><BrandLogo className="mb-6 size-14" /><h2 className="text-3xl font-semibold tracking-tight">Selamat pulang.</h2><p className="mt-3 text-muted-foreground">Masuk untuk melihat kabar kas rumahmu.</p></div>
        <ActionForm action={login} submitLabel="Masuk" className="[&_button[type=submit]]:w-full" noValidate>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" placeholder="nama@email.com" required className="h-12" /></div>
          <PasswordField label="Password" name="password" autoComplete="current-password" required className="h-12" />
        </ActionForm>
        <Link href="/forgot-password" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">Lupa password?</Link>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">Belum punya akses? Minta undangan dari Admin kontrakan.</p>
      </div>
      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4" /> Akses khusus anggota kontrakan</p>
    </section>
  </main>;
}
