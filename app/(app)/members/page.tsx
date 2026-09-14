import { deleteMember, sendInvitations, toggleMember } from "@/app/actions/members";
import { ActionForm } from "@/components/action-form";
import { ConfirmAction } from "@/components/confirm-action";
import { MemberEditor } from "@/components/members/member-editor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { requireUser, publicUserSelect, roleLabels } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getBillDisplayStatus } from "@/lib/dates";

export default async function MembersPage() {
  const actor = await requireUser();
  const isAdmin = actor.role === "ADMIN";
  const members = await getDb().user.findMany({
    select: {
      ...publicUserSelect,
      bills: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          status: true,
          billingPeriod: { select: { month: true, year: true, dueDate: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Rumah kita</p>
          <h1 className="text-3xl font-semibold tracking-tight">Anggota</h1>
          <p className="mt-2 text-sm text-muted-foreground">Lihat profil dan pantau status pembayaran terbaru seluruh penghuni.</p>
        </div>
        {isAdmin && <MemberEditor />}
      </header>

      <div className="divide-y rounded-2xl bg-card px-5 shadow-sm">
        {members.map((member) => {
          const latestBill = member.role === "ADMIN" ? null : member.bills[0];
          const paymentStatus = latestBill
            ? getBillDisplayStatus(latestBill.status, latestBill.billingPeriod.dueDate)
            : null;

          return (
            <article key={member.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className="size-14">
                  <AvatarImage src={member.avatarUrl || undefined} alt={`Foto profil ${member.name}`} className="object-cover" />
                  <AvatarFallback className="text-lg font-semibold">{member.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="font-semibold">{member.name}{member.id === actor.id && " (Anda)"}</h2>
                  <p className="break-all text-sm text-muted-foreground">{member.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{roleLabels[member.role]}</Badge>
                    <Badge variant="outline">{!member.isActive ? "Nonaktif sementara" : member.activatedAt ? "Aktif" : "Belum aktivasi"}</Badge>
                    {member.role === "ADMIN" ? (
                      <Badge variant="outline">Bebas kas</Badge>
                    ) : paymentStatus && latestBill ? (
                      <Badge variant={paymentStatus.variant}>
                        {latestBill.billingPeriod.month}/{latestBill.billingPeriod.year}: {paymentStatus.label}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Belum ada tagihan</Badge>
                    )}
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="flex flex-wrap gap-2">
                  <MemberEditor member={member} />
                  {member.id !== actor.id && (
                    <>
                      <ConfirmAction
                        action={toggleMember}
                        label={member.isActive ? "Nonaktifkan sementara" : "Aktifkan kembali"}
                        description={member.isActive
                          ? "Pengguna akan langsung keluar dan tidak dapat login sampai diaktifkan kembali. Riwayatnya tetap tersimpan."
                          : "Pengguna akan mendapatkan kembali akses login ke aplikasi."}
                      >
                        <input type="hidden" name="id" value={member.id} />
                      </ConfirmAction>
                      <ConfirmAction
                        action={deleteMember}
                        label="Hapus permanen"
                        description="Akun, tagihan, dan pengajuan pembayaran milik pengguna akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
                      >
                        <input type="hidden" name="id" value={member.id} />
                      </ConfirmAction>
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {isAdmin && (
        <section className="rounded-2xl bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Kirim ulang undangan</h2>
          <ActionForm action={sendInvitations} submitLabel="Kirim undangan">
            {members.filter((member) => !member.activatedAt && member.isActive).map((member) => (
              <label key={member.id} className="flex min-h-11 items-center gap-3">
                <input type="checkbox" name="ids" value={member.id} className="size-5 accent-primary" />
                <span>{member.name}</span>
              </label>
            ))}
          </ActionForm>
        </section>
      )}
    </div>
  );
}
