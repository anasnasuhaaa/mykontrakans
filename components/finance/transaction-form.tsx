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
        <Button className="min-h-11 w-full gap-2 sm:w-auto">
          <PlusCircle className="size-4" />
          Tambah transaksi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Catat transaksi kas</DialogTitle>
          <DialogDescription>
            Pemasukan atau pengeluaran akan langsung memperbarui saldo kas bersama.
          </DialogDescription>
        </DialogHeader>

        {/* Type toggle switch */}
        <div className="flex rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setTxType("EXPENSE")}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold transition-all ${
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
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold transition-all ${
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
              <label className="mb-2 block text-sm font-medium">
                Kategori {txType === "INCOME" ? "Pemasukan" : "Pengeluaran"}
              </label>
              <select
                name="categoryId"
                required
                className="h-11 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-base shadow-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50 md:text-sm"
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
              <label className="mb-2 block text-sm font-medium">
                Bukti Struk / Nota (Opsional)
              </label>
              <input
                name="receipt"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="min-h-11 w-full cursor-pointer rounded-xl border border-input bg-card p-1.5 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-xs file:font-medium hover:file:bg-muted/80"
              />
            </div>
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
