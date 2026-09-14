"use client";

import { generateBillingPeriod } from "@/app/actions/billing";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function BillingGenerator({ defaultYear, defaultMonth }: { defaultYear: number; defaultMonth: number }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="min-h-11 w-full sm:w-auto">Buat tagihan periode baru</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat tagihan bulanan</DialogTitle>
          <DialogDescription>
            Sistem akan membuat tagihan kas untuk Bendahara dan Anggota aktif. Admin tidak dikenai tagihan.
          </DialogDescription>
        </DialogHeader>
        <ActionForm action={generateBillingPeriod} submitLabel="Generate tagihan">
          <div className="grid grid-cols-2 gap-4">
            <Field name="month" label="Bulan (1-12)" type="number" min={1} max={12} defaultValue={defaultMonth} required />
            <Field name="year" label="Tahun" type="number" min={2020} max={2100} defaultValue={defaultYear} required />
          </div>
          <p className="text-xs text-muted-foreground">
            Nominal dan tanggal jatuh tempo mengikuti pengaturan kas saat ini.
          </p>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
