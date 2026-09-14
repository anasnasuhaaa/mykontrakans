"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LayoutDashboard, Wallet, ArrowLeftRight, Users, UserRound, History, Tags, Settings, ClipboardCheck, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const items = [
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard, roles: ["ADMIN", "TREASURER", "MEMBER"] },
  { href: "/bills", label: "Tagihan kas", icon: Wallet, roles: ["ADMIN", "TREASURER", "MEMBER"] },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight, roles: ["ADMIN", "TREASURER"] },
  { href: "/history", label: "Riwayat", icon: History, roles: ["MEMBER"] },
  { href: "/payments/review", label: "Review pembayaran", icon: ClipboardCheck, roles: ["ADMIN", "TREASURER"] },
  { href: "/members", label: "Anggota", icon: Users, roles: ["ADMIN", "TREASURER", "MEMBER"] },
  { href: "/categories", label: "Kategori", icon: Tags, roles: ["ADMIN", "TREASURER"] },
  { href: "/settings", label: "Pengaturan", icon: Settings, roles: ["ADMIN"] },
  { href: "/profile", label: "Profil", icon: UserRound, roles: ["ADMIN", "TREASURER", "MEMBER"] },
];

export function AppShell({ user, children }: { user: { name: string; role: string; avatarUrl?: string | null }; children: React.ReactNode }) {
  const pathname = usePathname();
  const visible = items.filter((item) => item.roles.includes(user.role));
  const mobile = visible.filter((item) => !["/categories", "/settings", "/payments/review"].includes(item.href));
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return <div className="min-h-dvh">
    <a href="#main-content" className="sr-only z-50 rounded bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed">Langsung ke konten</a>
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card px-5 py-8 lg:flex">
      <Link href="/dashboard" className="mb-12 flex items-center gap-3 px-3 text-lg font-semibold tracking-tight"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><House className="size-6" /></span>MyKontrakans</Link>
      <p className="mb-3 px-4 text-xs font-medium tracking-widest text-muted-foreground">RUANG BERSAMA</p>
      <nav aria-label="Navigasi utama" className="space-y-1">{visible.map((item) => <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined} className={cn("flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm transition-colors", active(item.href) ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><item.icon className="size-5" />{item.label}</Link>)}</nav>
      <div className="mt-auto flex items-center justify-between border-t pt-5"><Link href="/profile" className="flex min-w-0 items-center gap-3"><Avatar className="size-10"><AvatarImage src={user.avatarUrl || undefined} alt={`Foto profil ${user.name}`} className="object-cover" /><AvatarFallback className="font-semibold">{user.name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><span className="truncate text-sm font-medium">{user.name}</span></Link><form action={logout}><Button variant="ghost" size="icon" aria-label="Keluar"><LogOut className="size-4" /></Button></form></div>
    </aside>
    <div className="lg:pl-64"><header className="flex h-20 items-center justify-between px-5 sm:px-8 lg:px-10"><Link href="/dashboard" className="flex items-center gap-2 font-semibold lg:hidden"><House className="size-6 text-primary" />MyKontrakans</Link><span className="hidden text-sm text-muted-foreground lg:block">Rumah yang nyaman, kas yang transparan.</span><div className="flex items-center gap-2"><ThemeToggle /><Link href="/profile" aria-label="Buka profil"><Avatar className="size-11"><AvatarImage src={user.avatarUrl || undefined} alt={`Foto profil ${user.name}`} className="object-cover" /><AvatarFallback className="bg-primary/10 font-semibold text-primary">{user.name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar></Link></div></header>
      <main id="main-content" className="mx-auto max-w-[1440px] px-5 pt-3 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-8 lg:px-10 lg:pb-12">{children}</main>
    </div>
    <nav aria-label="Navigasi mobile" className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-card/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">{mobile.map((item) => <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined} className={cn("flex min-h-14 min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[10px]", active(item.href) ? "font-semibold text-primary" : "text-muted-foreground")}><span className={cn("rounded-full px-4 py-1", active(item.href) && "bg-primary/10")}><item.icon className="size-5" /></span>{item.label}</Link>)}</nav>
  </div>;
}
