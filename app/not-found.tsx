import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="max-w-md rounded-2xl p-8 text-center">
        <CardContent className="space-y-4 p-0">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileQuestion className="size-7" />
          </div>
          <h1 className="text-2xl font-bold">Halaman Tidak Ditemukan</h1>
          <p className="text-sm text-muted-foreground">
            Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
          </p>
          <Button asChild className="min-h-11 w-full gap-2">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" /> Kembali ke Beranda
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
