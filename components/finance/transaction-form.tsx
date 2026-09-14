"use client";

import { useState } from "react";
import { createTransaction, updateTransaction } from "@/app/actions/transactions";
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
import { PlusCircle, ArrowUpRight, ArrowDownRight, Pencil } from "lucide-react";

export type CategoryOption = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

export type EditableTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  transactionDate: Date;
  receiptPath?: string | null;
  category: {
    id: string;
    name: string;
  };
};

export function TransactionForm({
  categories,
  defaultType = "EXPENSE",
  transaction,
}: {
  categories: CategoryOption[];
  defaultType?: "INCOME" | "EXPENSE";
  transaction?: EditableTransaction;
}) {
  const [open, setOpen] = useState(false);
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">(transaction?.type ?? defaultType);
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");

  const filteredCategories = categories.filter((c) => c.type === txType);
  const dateValue = (transaction?.transactionDate ?? new Date()).toISOString().split("T")[0];
  const isEditing = Boolean(transaction);
  const formattedAmount = amount ? Number(amount).toLocaleString("id-ID") : "";
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setTxType(transaction?.type ?? defaultType);
      setAmount(transaction ? String(transaction.amount) : "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Edit transaksi ${transaction?.description}`}
            title="Edit transaksi"
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button className="min-h-11 w-full gap-2 sm:w-auto">
            <PlusCircle className="size-4" />
            Tambah transaksi
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit transaksi kas" : "Catat transaksi kas"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perubahan transaksi akan langsung memperbarui saldo kas bersama."
              : "Pemasukan atau pengeluaran akan langsung memperbarui saldo kas bersama."}
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
            const res = await (isEditing ? updateTransaction : createTransaction)(state, formData);
            if (res.success) {
              setOpen(false);
            }
            return res;
          }}
          submitLabel={isEditing
            ? "Simpan perubahan"
            : txType === "INCOME" ? "Simpan Pemasukan" : "Simpan Pengeluaran"}
        >
          {transaction && <input type="hidden" name="id" value={transaction.id} />}
          <input type="hidden" name="type" value={txType} />

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Kategori {txType === "INCOME" ? "Pemasukan" : "Pengeluaran"}
              </label>
              <select
                name="categoryId"
                required
                defaultValue={transaction?.category.id ?? ""}
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

            <div>
              <label htmlFor={`transaction-amount-${transaction?.id ?? "new"}`} className="mb-2 block text-sm font-medium">
                Nominal (Rupiah)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                <input
                  id={`transaction-amount-${transaction?.id ?? "new"}`}
                  type="text"
                  inputMode="numeric"
                  value={formattedAmount}
                  onChange={(event) => setAmount(event.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""))}
                  placeholder="45.983"
                  required
                  className="h-11 w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-3.5 text-base tabular-nums shadow-xs outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/50 md:text-sm"
                />
                <input type="hidden" name="amount" value={amount} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Boleh sampai satuan Rupiah, misalnya Rp45.983.</p>
            </div>

            <Field
              name="description"
              label="Keterangan / Keperluan"
              placeholder="Contoh: Token listrik 50.000 atau Galon air"
              defaultValue={transaction?.description}
              required
            />

            <Field
              name="transactionDate"
              label="Tanggal Transaksi"
              type="date"
              defaultValue={dateValue}
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
              {transaction?.receiptPath && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Biarkan kosong untuk mempertahankan bukti yang sudah ada.
                </p>
              )}
            </div>
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
