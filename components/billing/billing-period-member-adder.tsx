"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { addMembersToBillingPeriod } from "@/app/actions/billing";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type EligibleMember = { id: string; name: string; email: string };

export function BillingPeriodMemberAdder({ periodId, periodLabel, members }: {
  periodId: string;
  periodLabel: string;
  members: EligibleMember[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(members.map((member) => member.id));

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setSelected(members.map((member) => member.id));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11">
          <UserPlus className="size-4" /> Tambah anggota
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah anggota ke {periodLabel}</DialogTitle>
          <DialogDescription>
            Pilih anggota aktif yang belum memiliki tagihan. Nominalnya mengikuti nominal periode ini.
          </DialogDescription>
        </DialogHeader>
        <ActionForm action={async (state, form) => {
          const result = await addMembersToBillingPeriod(state, form);
          if (result.success) setOpen(false);
          return result;
        }} submitLabel="Tambahkan anggota">
          <input type="hidden" name="periodId" value={periodId} />
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Anggota yang ditambahkan</legend>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{selected.length} dari {members.length} dipilih</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelected(selected.length === members.length ? [] : members.map((member) => member.id))}
              >
                {selected.length === members.length ? "Hapus pilihan" : "Pilih semua"}
              </Button>
            </div>
            <div className="max-h-56 divide-y overflow-y-auto rounded-xl border">
              {members.map((member) => (
                <label key={member.id} className="flex min-h-12 cursor-pointer items-center gap-3 p-3">
                  <input
                    type="checkbox"
                    name="memberIds"
                    value={member.id}
                    checked={selected.includes(member.id)}
                    onChange={(event) => setSelected(event.target.checked
                      ? [...selected, member.id]
                      : selected.filter((id) => id !== member.id))}
                    className="size-4 shrink-0 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{member.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
