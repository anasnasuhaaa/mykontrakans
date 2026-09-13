"use client";

import { useState } from "react";
import { approvePaymentSubmission, rejectPaymentSubmission } from "@/app/actions/payments";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/utils";
import { formatJakartaDate } from "@/lib/dates";
import { Check, X, Eye, ExternalLink } from "lucide-react";

export type PendingPaymentItem = {
  id: string;
  evidencePath: string;
  createdAt: Date;
  bill: {
    id: string;
    amount: number;
    billingPeriod: {
      month: number;
      year: number;
    };
    member: {
      id: string;
      name: string;
      email: string;
    };
  };
};

export function PaymentReviewer({ items }: { items: PendingPaymentItem[] }) {
  const [activePreview, setActivePreview] = useState<PendingPaymentItem | null>(null);
  const [rejectingItem, setRejectingItem] = useState<PendingPaymentItem | null>(null);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div className="divide-y rounded-2xl border bg-card overflow-hidden">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-4">
              {/* Evidence thumbnail preview button */}
              <button
                type="button"
                onClick={() => setActivePreview(item)}
                className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-muted focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.evidencePath}
                  alt="Bukti Transfer"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 text-white">
                  <Eye className="size-5" />
                </div>
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-base">{item.bill.member.name}</p>
                  <Badge variant="secondary">
                    Periode {item.bill.billingPeriod.month}/{item.bill.billingPeriod.year}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.bill.member.email}</p>
                <p className="text-xs text-muted-foreground">
                  Dikirim pada: {formatJakartaDate(new Date(item.createdAt))}
                </p>
                <p className="text-base font-bold text-primary">
                  {formatRupiah(item.bill.amount)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActivePreview(item)}
              >
                <Eye className="size-4 mr-1.5" /> Lihat Bukti
              </Button>

              <ActionForm
                action={approvePaymentSubmission}
                submitLabel="Setujui"
                className="inline"
              >
                <input type="hidden" name="submissionId" value={item.id} />
              </ActionForm>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setRejectingItem(item)}
              >
                <X className="size-4 mr-1.5" /> Tolak
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      <Dialog open={!!activePreview} onOpenChange={(open) => !open && setActivePreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Bukti Transfer — {activePreview?.bill.member.name}
            </DialogTitle>
            <DialogDescription>
              Periode {activePreview?.bill.billingPeriod.month}/{activePreview?.bill.billingPeriod.year} · Nominal {activePreview ? formatRupiah(activePreview.bill.amount) : ""}
            </DialogDescription>
          </DialogHeader>

          {activePreview && (
            <div className="space-y-4">
              <div className="relative mx-auto max-h-[60vh] overflow-hidden rounded-xl border bg-black/5 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePreview.evidencePath}
                  alt="Bukti Transfer Penuh"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <a
                  href={activePreview.evidencePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="size-3.5" /> Buka gambar di tab baru
                </a>

                <div className="flex items-center gap-2">
                  <ActionForm
                    action={approvePaymentSubmission}
                    submitLabel="Setujui Pembayaran"
                  >
                    <input type="hidden" name="submissionId" value={activePreview.id} />
                  </ActionForm>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Modal with Required Reason */}
      <Dialog open={!!rejectingItem} onOpenChange={(open) => !open && setRejectingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Bukti Pembayaran</DialogTitle>
            <DialogDescription>
              Tuliskan alasan penolakan agar anggota dapat memperbaikinya.
            </DialogDescription>
          </DialogHeader>

          {rejectingItem && (
            <ActionForm
              action={async (state, formData) => {
                const res = await rejectPaymentSubmission(state, formData);
                if (res.success) {
                  setRejectingItem(null);
                }
                return res;
              }}
              submitLabel="Konfirmasi Tolak"
            >
              <input type="hidden" name="submissionId" value={rejectingItem.id} />
              <div className="mb-2 rounded-lg bg-muted p-3 text-xs">
                <p className="font-semibold">{rejectingItem.bill.member.name}</p>
                <p className="text-muted-foreground">{formatRupiah(rejectingItem.bill.amount)}</p>
              </div>
              <Field
                name="reason"
                label="Alasan Penolakan"
                placeholder="Contoh: Nominal pada mutasi tidak sesuai atau gambar buram."
                required
              />
            </ActionForm>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
