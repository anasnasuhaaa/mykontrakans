"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { submitPaymentEvidence } from "@/app/actions/payments";
import { initialActionState, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, UploadCloud, CheckCircle2, Image as ImageIcon, X, Download } from "lucide-react";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_UPLOAD_LABEL, MAX_IMAGE_UPLOAD_SIZE } from "@/lib/upload-constraints";
import { formatRupiah } from "@/lib/utils";

interface PaymentSubmissionFormProps {
  billId: string;
  amount: number;
  periodLabel: string;
  dueDateLabel: string;
  status: "UNPAID" | "PENDING_REVIEW" | "PAID" | "REJECTED";
  rejectionReason?: string | null;
  lastEvidenceUrl?: string | null;
}

export function PaymentSubmissionForm({
  billId,
  amount,
  periodLabel,
  dueDateLabel,
  status,
  rejectionReason,
  lastEvidenceUrl,
}: PaymentSubmissionFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (previousState, form) => {
      const nextState = await submitPaymentEvidence(previousState, form);
      if (nextState.success) {
        setPreviewUrl(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      return nextState;
    },
    initialActionState,
  );

  useEffect(() => {
    if (state.message) {
      (state.success ? toast.success : toast.error)(state.message);
    }
  }, [state]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
      toast.error(`Ukuran file tidak boleh melebihi ${MAX_IMAGE_UPLOAD_LABEL}.`);
      e.currentTarget.value = "";
      return;
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase() as typeof ALLOWED_IMAGE_MIME_TYPES[number])) {
      toast.error("Format file harus JPG, PNG, atau WEBP.");
      e.currentTarget.value = "";
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setPreviewUrl(null);
  };

  if (status === "PAID") {
    return (
      <Card className="rounded-2xl border-emerald-500/20 bg-emerald-50/50 p-8 text-center dark:bg-emerald-950/20">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600 dark:text-emerald-400" />
        <h3 className="mt-4 text-xl font-semibold text-emerald-900 dark:text-emerald-100">Tagihan Sudah Lunas</h3>
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
          Pembayaran kas Anda untuk {periodLabel} telah disetujui. Terima kasih telah membayar tepat waktu!
        </p>
      </Card>
    );
  }

  if (status === "PENDING_REVIEW") {
    return (
      <Card className="rounded-2xl border-amber-500/20 bg-amber-50/50 p-8 text-center dark:bg-amber-950/20">
        <AlertCircle className="mx-auto size-12 text-amber-600 dark:text-amber-400" />
        <h3 className="mt-4 text-xl font-semibold text-amber-900 dark:text-amber-100">Menunggu Verifikasi</h3>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          Bukti pembayaran Anda sedang dalam antrean review oleh Bendahara atau Admin. Notifikasi akan dikirim setelah verifikasi selesai.
        </p>
        {lastEvidenceUrl && (
          <div className="mt-6 flex flex-col items-center">
            <p className="text-xs font-medium text-muted-foreground mb-2">Bukti yang telah diunggah:</p>
            <div className="relative h-48 w-48 overflow-hidden rounded-xl border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lastEvidenceUrl} alt="Bukti Transfer" className="h-full w-full object-cover" />
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* QRIS Card */}
      <Card className="rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/40 border-b">
          <CardTitle>Scan QRIS Pembayaran</CardTitle>
          <CardDescription>
            Gunakan aplikasi BCA, Mandiri, Gopay, OVO, ShopeePay, atau m-banking lainnya.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
          <div className="relative flex aspect-square w-64 items-center justify-center rounded-2xl border-2 border-dashed bg-card p-4 shadow-sm">
            {/* Fallback to image or QR placeholder */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/qris.jpeg"
              alt="QRIS MyKontrakans"
              className="h-full w-full object-contain"
              onError={(e) => {
                // If the QRIS asset cannot be loaded, display a styled fallback card.
                const target = e.currentTarget;
                target.style.display = "none";
                const fallback = document.getElementById("qris-fallback");
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <div
              id="qris-fallback"
              className="hidden flex-col items-center justify-center text-center p-4"
            >
              <div className="size-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                <ImageIcon className="size-8" />
              </div>
              <p className="font-semibold text-sm">QRIS MyKontrakans</p>
              <p className="text-xs text-muted-foreground mt-1">
                Scan via m-Banking atau e-Wallet apapun
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="min-h-11 w-full max-w-64">
            <a href="/qris.jpeg" download="QRIS-MyKontrakans.jpeg">
              <Download className="size-4" /> Unduh QRIS
            </a>
          </Button>
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">Total Pembayaran</p>
            <p className="text-xl font-bold">{formatRupiah(amount)}</p>
            <p className="text-xs text-muted-foreground">Periode Tagihan</p>
            <p className="font-medium">{periodLabel}</p>
            <p className="text-xs text-muted-foreground">Jatuh Tempo: {dueDateLabel}</p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Form */}
      <Card className="rounded-2xl">
        <CardHeader className="border-b bg-muted/40">
          <CardTitle>Upload Bukti Transfer</CardTitle>
          <CardDescription>
            Unggah tangkapan layar (screenshot) bukti pembayaran berhasil.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {status === "REJECTED" && (
            <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Pembayaran sebelumnya ditolak</p>
                  <p className="mt-1">{rejectionReason || "Bukti tidak valid atau nominal tidak sesuai."}</p>
                  <p className="mt-2 text-xs font-medium">Silakan unggah ulang bukti transfer yang benar di bawah.</p>
                </div>
              </div>
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <input type="hidden" name="billId" value={billId} />
            <input
              ref={fileInputRef}
              id="evidence-upload"
              name="evidence"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleFileChange}
              disabled={isPending}
              required
            />

            {/* File Upload Area */}
            {!previewUrl ? (
              <label
                htmlFor="evidence-upload"
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors hover:bg-muted/50 focus-within:ring-2 focus-within:ring-primary"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="size-7" />
                </div>
                <p className="mt-4 font-medium text-sm">Klik untuk memilih screenshot bukti</p>
                <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, atau WEBP (Maks. {MAX_IMAGE_UPLOAD_LABEL})</p>
              </label>
            ) : (
              <div className="relative rounded-2xl border overflow-hidden bg-muted/20 p-4">
                <div className="flex items-center justify-between pb-3 border-b mb-3">
                  <span className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">
                    {selectedFile?.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      clearFile();
                      window.setTimeout(() => fileInputRef.current?.click(), 0);
                    }}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                    disabled={isPending}
                  >
                    <X className="size-3.5" /> Ganti file
                  </button>
                </div>
                <div className="relative mx-auto aspect-3/4 max-h-72 w-full overflow-hidden rounded-xl border bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview Bukti" className="h-full w-full object-contain" />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full min-h-11 font-medium text-base"
              disabled={isPending || !selectedFile}
            >
              {isPending ? "Mengunggah bukti..." : "Kirim Bukti Pembayaran"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
