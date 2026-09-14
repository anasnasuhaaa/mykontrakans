"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, UserRoundCheck, UserRoundX } from "lucide-react";
import { deleteMember, toggleMember } from "@/app/actions/members";
import { ConfirmAction } from "@/components/confirm-action";
import { MemberEditor } from "@/components/members/member-editor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MemberAction = "edit" | "toggle" | "delete" | null;

export function MemberActions({
  member,
  isCurrentUser,
}: {
  member: { id: string; name: string; email: string; role: string; isActive: boolean };
  isCurrentUser: boolean;
}) {
  const [activeAction, setActiveAction] = useState<MemberAction>(null);
  const closeAction = (open: boolean) => {
    if (!open) setActiveAction(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground"
            aria-label={`Buka aksi untuk ${member.name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setActiveAction("edit")}>
            <Pencil />
            Edit anggota
          </DropdownMenuItem>
          {!isCurrentUser && (
            <>
              <DropdownMenuItem onSelect={() => setActiveAction("toggle")}>
                {member.isActive ? <UserRoundX /> : <UserRoundCheck />}
                {member.isActive ? "Nonaktifkan" : "Aktifkan kembali"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setActiveAction("delete")}>
                <Trash2 />
                Hapus permanen
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <MemberEditor
        member={member}
        open={activeAction === "edit"}
        onOpenChange={closeAction}
        trigger={null}
      />

      {!isCurrentUser && (
        <>
          <ConfirmAction
            action={toggleMember}
            label={member.isActive ? "Nonaktifkan sementara" : "Aktifkan kembali"}
            description={member.isActive
              ? "Pengguna akan langsung keluar dan tidak dapat login sampai diaktifkan kembali. Riwayatnya tetap tersimpan."
              : "Pengguna akan mendapatkan kembali akses login ke aplikasi."}
            open={activeAction === "toggle"}
            onOpenChange={closeAction}
            trigger={null}
          >
            <input type="hidden" name="id" value={member.id} />
          </ConfirmAction>
          <ConfirmAction
            action={deleteMember}
            label="Hapus permanen"
            description="Akun, tagihan, dan pengajuan pembayaran milik pengguna akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
            open={activeAction === "delete"}
            onOpenChange={closeAction}
            trigger={null}
          >
            <input type="hidden" name="id" value={member.id} />
          </ConfirmAction>
        </>
      )}
    </>
  );
}
