import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { saveSettings } from "@/app/actions/settings";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/form-fields";
import { Card, CardContent } from "@/components/ui/card";

export default async function SettingsPage() {
  await requireUser(["ADMIN"]);
  const settings = await getDb().appSetting.findUnique({ where: { id: "default" } });
  return (
    <div className="page-stack max-w-2xl">
      <header>
        <p className="page-eyebrow">Konfigurasi utama</p>
        <h1 className="page-title">Pengaturan rumah</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pengaturan ini berlaku untuk periode tagihan yang dibuat setelah perubahan disimpan.</p>
      </header>
      <Card>
        <CardContent>
          <ActionForm action={saveSettings}>
            <Field name="houseName" label="Nama kontrakan" defaultValue={settings?.houseName || "MyKontrakans"} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="monthlyDuesAmount" label="Kas per anggota (Rp)" type="number" min={1} max={100000000} defaultValue={settings?.monthlyDuesAmount || 100000} required />
              <Field name="monthlyDueDay" label="Tanggal jatuh tempo" type="number" min={1} max={31} defaultValue={settings?.monthlyDueDay || 10} required />
            </div>
            <p className="rounded-xl bg-muted/70 p-3 text-sm text-muted-foreground">Tanggal 29–31 disesuaikan ke hari terakhir jika bulan lebih pendek. Tagihan lama tidak berubah.</p>
          </ActionForm>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Zona waktu Asia/Jakarta · Mata uang IDR</p>
    </div>
  );
}
