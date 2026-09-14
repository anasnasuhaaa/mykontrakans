import { sendInvitations } from "@/app/actions/members";
import { ActionForm } from "@/components/action-form";
import { MemberActions } from "@/components/members/member-actions";
import { MemberEditor } from "@/components/members/member-editor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { requireUser, publicUserSelect, roleLabels } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getBillDisplayStatus } from "@/lib/dates";

const roleBadgeClasses: Record<string, string> = {
  ADMIN: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/70 dark:bg-violet-950/60 dark:text-violet-300",
  TREASURER: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/60 dark:text-amber-300",
  MEMBER: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/70 dark:bg-sky-950/60 dark:text-sky-300",
};

const paymentBadgeClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/60 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/60 dark:text-amber-300",
  danger: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/60 dark:text-rose-300",
  neutral: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300",
};

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
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Rumah kita</p>
          <h1 className="page-title">Anggota</h1>
          <p className="mt-2 text-sm text-muted-foreground">Lihat profil dan pantau status pembayaran terbaru seluruh penghuni.</p>
        </div>
        {isAdmin && <MemberEditor />}
      </header>

      <div className="surface-list px-4 sm:px-5">
        {members.map((member) => {
          const latestBill = member.role === "ADMIN" ? null : member.bills[0];
          const paymentStatus = latestBill
            ? getBillDisplayStatus(latestBill.status, latestBill.billingPeriod.dueDate)
            : null;

          return (
            <article key={member.id} className="flex items-start gap-3 py-4 sm:items-center sm:gap-4 sm:py-5">
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
                <Avatar className="size-11 sm:size-12">
                  <AvatarImage src={member.avatarUrl || undefined} alt={`Foto profil ${member.name}`} className="object-cover" />
                  <AvatarFallback className="text-lg font-semibold">{member.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="font-semibold">{member.name}{member.id === actor.id && " (Anda)"}</h2>
                  <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={roleBadgeClasses[member.role]}>{roleLabels[member.role]}</Badge>
                    <Badge
                      variant="outline"
                      className={!member.isActive
                        ? paymentBadgeClasses.danger
                        : member.activatedAt ? paymentBadgeClasses.success : paymentBadgeClasses.warning}
                    >
                      {!member.isActive ? "Nonaktif sementara" : member.activatedAt ? "Aktif" : "Belum aktivasi"}
                    </Badge>
                    {member.role === "ADMIN" ? (
                      <Badge variant="outline" className={paymentBadgeClasses.neutral}>Bebas kas</Badge>
                    ) : paymentStatus && latestBill ? (
                      <Badge variant="outline" className={paymentBadgeClasses[paymentStatus.tone]}>
                        {latestBill.billingPeriod.month}/{latestBill.billingPeriod.year}: {paymentStatus.label}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={paymentBadgeClasses.neutral}>Belum ada tagihan</Badge>
                    )}
                  </div>
                </div>
              </div>

              {isAdmin && <MemberActions member={member} isCurrentUser={member.id === actor.id} />}
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
