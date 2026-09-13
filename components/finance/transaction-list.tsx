"use client";

import { useState } from "react";
import { deleteTransaction } from "@/app/actions/transactions";
import { ConfirmAction } from "@/components/confirm-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/utils";
import { formatJakartaDate } from "@/lib/dates";
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  Receipt,
  Search,
  ExternalLink,
} from "lucide-react";

export type TransactionRecord = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  transactionDate: Date;
  receiptPath?: string | null;
  relatedPaymentId?: string | null;
  category: {
    name: string;
  };
  createdBy: {
    name: string;
  };
};

export function TransactionList({
  transactions,
  canManage = false,
}: {
  transactions: TransactionRecord[];
  canManage?: boolean;
}) {
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const filtered = transactions.filter((tx) => {
    if (filterType !== "ALL" && tx.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.description.toLowerCase().includes(q) ||
        tx.category.name.toLowerCase().includes(q) ||
        tx.createdBy.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari transaksi atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border bg-card py-2 pl-10 pr-4 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex rounded-xl bg-muted p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              filterType === "ALL" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
            }`}
          >
            Semua ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("INCOME")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              filterType === "INCOME" ? "bg-card text-emerald-600 shadow-xs dark:text-emerald-400" : "text-muted-foreground"
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setFilterType("EXPENSE")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              filterType === "EXPENSE" ? "bg-card text-rose-600 shadow-xs dark:text-rose-400" : "text-muted-foreground"
            }`}
          >
            Pengeluaran
          </button>
        </div>
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
          <Receipt className="mx-auto size-10 opacity-40 mb-3" />
          <p className="font-semibold text-base">Tidak ada transaksi ditemukan</p>
          <p className="text-xs mt-1">Sesuaikan kata kunci pencarian atau filter tipe transaksi.</p>
        </div>
      ) : (
        <div className="divide-y rounded-2xl border bg-card overflow-hidden">
          {filtered.map((tx) => {
            const isIncome = tx.type === "INCOME";
            return (
              <div
                key={tx.id}
                className="flex flex-col gap-3 p-4.5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      isIncome
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="size-5" />
                    ) : (
                      <ArrowDownRight className="size-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-base leading-tight">{tx.description}</p>
                      <Badge variant="outline" className="text-xs">
                        {tx.category.name}
                      </Badge>
                      {tx.relatedPaymentId && (
                        <Badge variant="secondary" className="text-[10px]">
                          Kas Anggota
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatJakartaDate(new Date(tx.transactionDate))} · Dicatat oleh {tx.createdBy.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span
                    className={`text-base font-bold tabular-nums ${
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isIncome ? "+" : "-"} {formatRupiah(tx.amount)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {tx.receiptPath && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        title="Lihat Struk"
                        onClick={() => setReceiptUrl(tx.receiptPath!)}
                      >
                        <Eye className="size-4" />
                      </Button>
                    )}

                    {canManage && !tx.relatedPaymentId && (
                      <ConfirmAction
                        action={deleteTransaction}
                        label="Hapus"
                        description={`Hapus transaksi "${tx.description}" senilai ${formatRupiah(tx.amount)}? Tindakan ini akan memperbarui saldo kas.`}
                      >
                        <input type="hidden" name="id" value={tx.id} />
                      </ConfirmAction>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt Modal */}
      <Dialog open={!!receiptUrl} onOpenChange={(open) => !open && setReceiptUrl(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bukti Transaksi / Nota</DialogTitle>
          </DialogHeader>
          {receiptUrl && (
            <div className="space-y-4">
              <div className="relative mx-auto max-h-[60vh] overflow-hidden rounded-xl border bg-black/5 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={receiptUrl}
                  alt="Bukti Transaksi"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>
              <div className="text-right">
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="size-3.5" /> Buka di tab baru
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
