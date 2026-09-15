"use client";

import { useState } from "react";
import { settleBillManually } from "@/app/actions/payments";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/utils";

export function ManualPaymentForm({ billId, memberName, amount, today, pendingReview }: {
  billId: string; memberName: string; amount: number; today: string; pendingReview: boolean;
}) {
  const [open, setOpen] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="outline" size="sm" className="min-h-11">Catat lunas</Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Catat pelunasan manual</DialogTitle>
        <DialogDescription>Pembayaran {memberName} sebesar {formatRupiah(amount)} akan dicatat sebagai pemasukan kas dan tagihan menjadi lunas.</DialogDescription>
      </DialogHeader>
      <ActionForm action={async (state, form) => {
        const result = await settleBillManually(state, form);
        if (result.success) setOpen(false);
        return result;
      }} submitLabel="Simpan pelunasan">
        <input type="hidden" name="billId" value={billId} />
        <label className="block space-y-2 text-sm font-medium">
          <span>Metode pembayaran</span>
          <select name="method" required defaultValue="CASH" className="h-11 w-full rounded-md border border-input bg-background px-3">
            <option value="CASH">Tunai</option><option value="BANK_TRANSFER">Transfer bank</option>
          </select>
        </label>
        <Field name="paymentDate" label="Tanggal pembayaran" type="date" defaultValue={today} max={today} required />
        <Field name="note" label="Catatan (opsional)" placeholder="Contoh: Diterima langsung oleh bendahara" maxLength={255} />
        {pendingReview && <p className="rounded-lg bg-muted p-3 text-sm">Bukti yang sedang menunggu review akan ditutup karena pembayaran dicatat melalui pelunasan ini.</p>}
      </ActionForm>
    </DialogContent>
  </Dialog>;
}
