"use client";

import { saveCategory } from "@/app/actions/settings";
import { ActionForm } from "@/components/action-form";
import { Field, SelectField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function CategoryEditor({ category }: { category?: { id: string; name: string; type: string; isActive: boolean } }) {
  return <Dialog><DialogTrigger asChild><Button variant={category ? "outline" : "default"} className="min-h-11">{category ? "Edit" : "Tambah kategori"}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{category ? "Edit kategori" : "Kategori baru"}</DialogTitle><DialogDescription>Kelompokkan pemasukan dan pengeluaran rumah.</DialogDescription></DialogHeader><ActionForm action={saveCategory}><input type="hidden" name="id" value={category?.id || ""} /><Field name="name" label="Nama kategori" defaultValue={category?.name} required /><SelectField label="Jenis" name="type" defaultValue={category?.type || "EXPENSE"} options={[{ value: "INCOME", label: "Pemasukan" }, { value: "EXPENSE", label: "Pengeluaran" }]} />{category && <SelectField label="Status" name="isActive" defaultValue={String(category.isActive)} options={[{ value: "true", label: "Aktif" }, { value: "false", label: "Nonaktif" }]} />}</ActionForm></DialogContent></Dialog>;
}
