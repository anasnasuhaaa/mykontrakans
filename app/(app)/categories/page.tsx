import { getDb } from "@/lib/db";
import { requireUser, financeRoles } from "@/lib/auth/session";
import { CategoryEditor } from "@/components/finance/category-editor";
import { ConfirmAction } from "@/components/confirm-action";
import { deleteCategory } from "@/app/actions/settings";
import { Badge } from "@/components/ui/badge";

export default async function CategoriesPage() {
  await requireUser(financeRoles);
  const categories = await getDb().financialCategory.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });
  return <div className="space-y-8"><header className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-semibold">Kategori keuangan</h1><CategoryEditor /></header><div className="grid gap-6 md:grid-cols-2">{["INCOME", "EXPENSE"].map((type) => <section key={type} className="rounded-2xl bg-card p-5"><h2 className="mb-4 text-lg font-semibold">{type === "INCOME" ? "Pemasukan" : "Pengeluaran"}</h2><div className="divide-y">{categories.filter((category) => category.type === type).map((category) => <article key={category.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{category.name}</p>{!category.isActive && <Badge variant="secondary">Nonaktif</Badge>}</div><div className="flex gap-2"><CategoryEditor category={category} />{!category.systemKey && <ConfirmAction action={deleteCategory} label="Hapus" description="Kategori yang sudah dipakai tidak dapat dihapus."><input name="id" type="hidden" value={category.id} /></ConfirmAction>}</div></article>)}</div>{!categories.some((category) => category.type === type) && <p className="py-8 text-muted-foreground">Belum ada kategori.</p>}</section>)}</div></div>;
}
