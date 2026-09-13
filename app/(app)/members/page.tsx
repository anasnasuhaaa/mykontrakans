import { requireUser, publicUserSelect, roleLabels } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { MemberEditor } from "@/components/members/member-editor";
import { ActionForm } from "@/components/action-form";
import { ConfirmAction } from "@/components/confirm-action";
import { sendInvitations, toggleMember } from "@/app/actions/members";
import { Badge } from "@/components/ui/badge";

export default async function MembersPage() {
  const actor = await requireUser(["ADMIN"]);
  const members = await getDb().user.findMany({ select: publicUserSelect, orderBy: { createdAt: "asc" } });
  return <div className="space-y-8"><header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">Rumah kita</p><h1 className="text-3xl font-semibold tracking-tight">Anggota</h1></div><MemberEditor /></header>
    <div className="divide-y rounded-2xl bg-card px-5 shadow-sm">{members.map((member) => <article key={member.id} className="flex flex-wrap items-center justify-between gap-4 py-5"><div className="min-w-0"><h2 className="font-semibold">{member.name}</h2><p className="break-all text-sm text-muted-foreground">{member.email}</p><div className="mt-2 flex gap-2"><Badge variant="secondary">{roleLabels[member.role]}</Badge><Badge variant="outline">{!member.isActive ? "Nonaktif" : member.activatedAt ? "Aktif" : "Belum aktivasi"}</Badge></div></div><div className="flex gap-2"><MemberEditor member={member} />{member.id !== actor.id && <ConfirmAction action={toggleMember} label={member.isActive ? "Nonaktifkan" : "Aktifkan"} description="Riwayat tagihan dan transaksi tetap disimpan."><input type="hidden" name="id" value={member.id} /></ConfirmAction>}</div></article>)}</div>
    <section className="rounded-2xl bg-card p-6"><h2 className="mb-4 text-lg font-semibold">Kirim ulang undangan</h2><ActionForm action={sendInvitations} submitLabel="Kirim undangan">{members.filter((member) => !member.activatedAt && member.isActive).map((member) => <label key={member.id} className="flex min-h-11 items-center gap-3"><input type="checkbox" name="ids" value={member.id} className="size-5 accent-primary" /><span>{member.name}</span></label>)}</ActionForm></section>
  </div>;
}
