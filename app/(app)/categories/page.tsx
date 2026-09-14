import { getDb } from "@/lib/db";
import { requireUser, financeRoles } from "@/lib/auth/session";
import { CategoryEditor } from "@/components/finance/category-editor";
import { ConfirmAction } from "@/components/confirm-action";
import { deleteCategory } from "@/app/actions/settings";
import { Badge } from "@/components/ui/badge";

export default async function CategoriesPage() {
  await requireUser(financeRoles);
  const categories = await getDb().financialCategory.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Struktur keuangan</p>
          <h1 className="page-title">Kategori keuangan</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">Atur kelompok pemasukan dan pengeluaran agar laporan tetap rapi.</p>
        </div>
        <CategoryEditor />
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {["INCOME", "EXPENSE"].map((type) => {
          const filtered = categories.filter((category) => category.type === type);
          return (
            <section key={type} className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{type === "INCOME" ? "Pemasukan" : "Pengeluaran"}</h2>
                <Badge variant="secondary">{filtered.length} kategori</Badge>
              </div>
              <div className="divide-y">
                {filtered.map((category) => (
                  <article key={category.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {!category.isActive && <Badge variant="secondary" className="mt-1">Nonaktif</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <CategoryEditor category={category} />
                      {!category.systemKey && (
                        <ConfirmAction action={deleteCategory} label="Hapus" description="Kategori yang sudah dipakai tidak dapat dihapus.">
                          <input name="id" type="hidden" value={category.id} />
                        </ConfirmAction>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              {filtered.length === 0 && <p className="py-8 text-sm text-muted-foreground">Belum ada kategori.</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
