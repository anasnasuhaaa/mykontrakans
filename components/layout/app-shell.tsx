"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CircleEllipsis,
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  Tags,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  desktopLabel?: string;
  icon: LucideIcon;
  roles: string[];
};

const items: NavItem[] = [
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard, roles: ["ADMIN", "TREASURER", "MEMBER"] },
  { href: "/bills", label: "Tagihan", desktopLabel: "Tagihan kas", icon: Wallet, roles: ["ADMIN", "TREASURER", "MEMBER"] },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight, roles: ["ADMIN", "TREASURER"] },
  { href: "/history", label: "Riwayat", icon: History, roles: ["MEMBER"] },
  { href: "/payments/review", label: "Review", desktopLabel: "Review pembayaran", icon: ClipboardCheck, roles: ["ADMIN", "TREASURER"] },
  { href: "/members", label: "Anggota", icon: Users, roles: ["ADMIN", "TREASURER", "MEMBER"] },
  { href: "/categories", label: "Kategori", icon: Tags, roles: ["ADMIN", "TREASURER"] },
  { href: "/settings", label: "Pengaturan", icon: Settings, roles: ["ADMIN"] },
  { href: "/profile", label: "Profil", icon: UserRound, roles: ["ADMIN", "TREASURER", "MEMBER"] },
];

const primaryMobileRoutes: Record<string, string[]> = {
  ADMIN: ["/dashboard", "/bills", "/transactions", "/members"],
  TREASURER: ["/dashboard", "/bills", "/transactions", "/members"],
  MEMBER: ["/dashboard", "/bills", "/history", "/members", "/profile"],
};

export function AppShell({ user, children }: { user: { name: string; role: string; avatarUrl?: string | null }; children: React.ReactNode }) {
  const pathname = usePathname();
  const visible = items.filter((item) => item.roles.includes(user.role));
  const primaryRoutes = primaryMobileRoutes[user.role] ?? primaryMobileRoutes.MEMBER;
  const mobilePrimary = visible.filter((item) => primaryRoutes.includes(item.href));
  const mobileMore = visible.filter((item) => !primaryRoutes.includes(item.href) && item.href !== "/profile");
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const moreActive = mobileMore.some((item) => active(item.href));

  return (
    <div className="min-h-dvh">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-primary p-3 text-primary-foreground focus:fixed focus:left-4 focus:top-4 focus:not-sr-only">
        Langsung ke konten
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card/75 px-5 py-7 backdrop-blur-xl lg:flex">
        <Link href="/dashboard" className="mb-10 flex items-center gap-3 rounded-xl px-3 py-1 text-lg font-semibold tracking-tight">
          <BrandLogo className="size-10" alt="" />
          MyKontrakans
        </Link>
        <p className="mb-3 px-4 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground">RUANG BERSAMA</p>
        <nav aria-label="Navigasi utama" className="space-y-1">
          {visible.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active(item.href) ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors",
                active(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-[18px]" />
              {item.desktopLabel ?? item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-5">
          <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 transition-colors hover:bg-muted">
            <Avatar className="size-10">
              <AvatarImage src={user.avatarUrl || undefined} alt={`Foto profil ${user.name}`} className="object-cover" />
              <AvatarFallback className="font-semibold">{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">{user.name}</span>
          </Link>
          <form action={logout}>
            <Button variant="ghost" size="icon" aria-label="Keluar">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70">
          <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
            <Link href="/dashboard" className="flex min-h-11 items-center gap-2.5 rounded-xl font-semibold tracking-tight lg:hidden">
              <BrandLogo className="size-9" alt="" />
              <span className="text-[15px]">MyKontrakans</span>
            </Link>
            <span className="hidden text-sm text-muted-foreground lg:block">Rumah yang nyaman, kas yang transparan.</span>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <Link href="/profile" aria-label="Buka profil" className="rounded-full ring-offset-card transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Avatar className="size-10 border border-border/80 shadow-xs sm:size-11">
                  <AvatarImage src={user.avatarUrl || undefined} alt={`Foto profil ${user.name}`} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>

        <main id="main-content" className="mx-auto max-w-[1440px] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pb-12">
          {children}
        </main>
      </div>

      <nav aria-label="Navigasi mobile" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_-20px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg justify-around">
          {mobilePrimary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active(item.href) ? "page" : undefined}
              className={cn(
                "flex min-h-[58px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium transition-colors",
                active(item.href) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className={cn("rounded-full px-4 py-1 transition-colors", active(item.href) && "bg-primary/10")}>
                <item.icon className="size-5" />
              </span>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          ))}

          {mobileMore.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  aria-label="Buka menu lainnya"
                  aria-current={moreActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-[58px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium transition-colors",
                    moreActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span className={cn("rounded-full px-4 py-1 transition-colors", moreActive && "bg-primary/10")}>
                    <CircleEllipsis className="size-5" />
                  </span>
                  Lainnya
                </button>
              </DialogTrigger>
              <DialogContent className="top-auto bottom-[calc(5rem+env(safe-area-inset-bottom))] w-[calc(100%-1.5rem)] max-w-md translate-y-0 gap-3 rounded-2xl p-4 sm:top-1/2 sm:bottom-auto sm:translate-y-[-50%]">
                <DialogHeader className="pr-8 text-left">
                  <DialogTitle>Menu lainnya</DialogTitle>
                  <DialogDescription>Akses pengelolaan dan pengaturan rumah.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                  {mobileMore.map((item) => (
                    <DialogClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active(item.href) ? "page" : undefined}
                        className={cn(
                          "flex min-h-12 items-center gap-3 rounded-xl border px-4 text-sm font-medium transition-colors",
                          active(item.href)
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "bg-card text-foreground hover:bg-muted",
                        )}
                      >
                        <item.icon className="size-5 text-current" />
                        {item.desktopLabel ?? item.label}
                      </Link>
                    </DialogClose>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </nav>
    </div>
  );
}
