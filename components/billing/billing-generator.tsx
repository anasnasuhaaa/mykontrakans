"use client";

import { useState } from "react";
import { generateBillingPeriod } from "@/app/actions/billing";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function BillingGenerator({ defaultYear, defaultMonth, members }: {
  defaultYear: number;
  defaultMonth: number;
  members: { id: string; name: string; email: string }[];
}) {
  const [selected, setSelected] = useState<string[]>(members.map((member) => member.id));
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-h-11 w-full sm:w-auto">Buat tagihan periode baru</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat tagihan bulanan</DialogTitle>
          <DialogDescription>
            Pilih Bendahara dan Anggota aktif yang perlu membayar pada periode ini. Admin tidak dikenai tagihan.
          </DialogDescription>
        </DialogHeader>
        <ActionForm action={async (state, form) => {
          const result = await generateBillingPeriod(state, form);
          if (result.success) setOpen(false);
          return result;
        }} submitLabel="Buat tagihan">
          <div className="grid grid-cols-2 gap-4">
            <Field name="month" label="Bulan (1-12)" type="number" min={1} max={12} defaultValue={defaultMonth} required />
            <Field name="year" label="Tahun" type="number" min={2020} max={2100} defaultValue={defaultYear} required />
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Anggota yang wajib membayar</legend>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{selected.length} dari {members.length} dipilih</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(selected.length === members.length ? [] : members.map((member) => member.id))}>
                {selected.length === members.length ? "Hapus pilihan" : "Pilih semua"}
              </Button>
            </div>
            <div className="max-h-56 divide-y overflow-y-auto rounded-xl border">
              {members.map((member) => (
                <label key={member.id} className="flex min-h-12 cursor-pointer items-center gap-3 p-3">
                  <input type="checkbox" name="memberIds" value={member.id} checked={selected.includes(member.id)}
                    onChange={(event) => setSelected(event.target.checked ? [...selected, member.id] : selected.filter((id) => id !== member.id))}
                    className="size-4 shrink-0 accent-primary" />
                  <span className="min-w-0"><span className="block text-sm font-medium">{member.name}</span><span className="block truncate text-xs text-muted-foreground">{member.email}</span></span>
                </label>
              ))}
              {members.length === 0 && <p className="p-3 text-sm text-muted-foreground">Belum ada anggota aktif yang dapat dipilih.</p>}
            </div>
          </fieldset>
          <p className="text-xs text-muted-foreground">
            Nominal dan tanggal jatuh tempo mengikuti pengaturan kas saat ini.
          </p>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
