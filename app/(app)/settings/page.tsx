import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { saveSettings } from "@/app/actions/settings";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/form-fields";

export default async function SettingsPage() {
  await requireUser(["ADMIN"]);
  const settings = await getDb().appSetting.findUnique({ where: { id: "default" } });
  return <div className="max-w-xl space-y-8"><h1 className="text-3xl font-semibold">Pengaturan rumah</h1><section className="rounded-2xl bg-card p-6"><ActionForm action={saveSettings}><Field name="houseName" label="Nama kontrakan" defaultValue={settings?.houseName || "MyKontrakans"} required /><Field name="monthlyDuesAmount" label="Kas per anggota (Rp)" type="number" min={1} max={100000000} defaultValue={settings?.monthlyDuesAmount || 100000} required /><Field name="monthlyDueDay" label="Tanggal jatuh tempo" type="number" min={1} max={31} defaultValue={settings?.monthlyDueDay || 10} required /><p className="text-sm text-muted-foreground">Tagihan dibuat secara eksplisit dari halaman Kas. Tanggal 29–31 disesuaikan ke hari terakhir jika bulan lebih pendek. Tagihan lama tidak berubah.</p></ActionForm></section><p className="text-sm text-muted-foreground">Zona waktu Asia/Jakarta · Mata uang IDR</p></div>;
}
