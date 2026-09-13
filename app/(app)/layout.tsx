import { requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <main className="mx-auto w-full max-w-6xl p-6">{children}</main>;
}
