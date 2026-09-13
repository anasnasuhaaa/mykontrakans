"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="max-w-md rounded-2xl p-8 text-center">
        <CardContent className="space-y-4 p-0">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <h2 className="text-xl font-bold">Terjadi Kendala Teknis</h2>
          <p className="text-sm text-muted-foreground">
            Sistem gagal memuat data halaman ini. Silakan coba muat ulang atau periksa koneksi internet Anda.
          </p>
          <Button onClick={() => reset()} className="min-h-11 w-full gap-2">
            <RefreshCw className="size-4" /> Coba Lagi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
