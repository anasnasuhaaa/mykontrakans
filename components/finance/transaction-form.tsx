"use client";

import { useState } from "react";
import { createTransaction } from "@/app/actions/transactions";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

export type CategoryOption = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

export function TransactionForm({
  categories,
  defaultType = "EXPENSE",
}: {
  categories: CategoryOption[];
  defaultType?: "INCOME" | "EXPENSE";
}) {
  const [open, setOpen] = useState(false);
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">(defaultType);

  const filteredCategories = categories.filter((c) => c.type === txType);
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-h-11 gap-2 font-medium">
          <PlusCircle className="size-4" />
          Tambah Transaksi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Catat Transaksi Kas</DialogTitle>
          <DialogDescription>
            Pemasukan atau pengeluaran akan langsung memperbarui saldo kas bersama.
          </DialogDescription>
        </DialogHeader>

        {/* Type toggle switch */}
        <div className="flex rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setTxType("EXPENSE")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              txType === "EXPENSE"
                ? "bg-card text-rose-600 shadow-xs dark:text-rose-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownRight className="size-4" /> Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setTxType("INCOME")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              txType === "INCOME"
                ? "bg-card text-emerald-600 shadow-xs dark:text-emerald-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowUpRight className="size-4" /> Pemasukan
          </button>
        </div>

        <ActionForm
          action={async (state, formData) => {
            const res = await createTransaction(state, formData);
            if (res.success) {
              setOpen(false);
            }
            return res;
          }}
          submitLabel={txType === "INCOME" ? "Simpan Pemasukan" : "Simpan Pengeluaran"}
        >
          <input type="hidden" name="type" value={txType} />

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Kategori {txType === "INCOME" ? "Pemasukan" : "Pengeluaran"}
              </label>
              <select
                name="categoryId"
                required
                className="w-full rounded-xl border bg-card px-3.5 py-2.5 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="">Pilih Kategori</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Field
              name="amount"
              label="Nominal (Rupiah)"
              type="number"
              min={1000}
              step={1000}
              placeholder="Contoh: 150000"
              required
            />

            <Field
              name="description"
              label="Keterangan / Keperluan"
              placeholder="Contoh: Token listrik 50.000 atau Galon air"
              required
            />

            <Field
              name="transactionDate"
              label="Tanggal Transaksi"
              type="date"
              defaultValue={today}
              required
            />

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Bukti Struk / Nota (Opsional)
              </label>
              <input
                name="receipt"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-xs file:font-medium hover:file:bg-muted/80 cursor-pointer"
              />
            </div>
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
