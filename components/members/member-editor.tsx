"use client";

import { saveMember } from "@/app/actions/members";
import { ActionForm } from "@/components/action-form";
import { Field, SelectField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogHeader, AlertDialogCancel } from "@/components/ui/alert-dialog";

export function MemberEditor({ member }: { member?: { id: string; name: string; email: string; role: string } }) {
  const fields = <><input type="hidden" name="id" value={member?.id || ""} /><Field label="Nama" name="name" defaultValue={member?.name} required maxLength={100} /><Field label="Email" name="email" type="email" defaultValue={member?.email} required /><SelectField name="role" label="Role" defaultValue={member?.role || "MEMBER"} options={[{ value: "ADMIN", label: "Admin" }, { value: "TREASURER", label: "Bendahara" }, { value: "MEMBER", label: "Anggota" }]} /></>;
  if (member) return <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="min-h-11">Edit</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Edit anggota</AlertDialogTitle><AlertDialogDescription>Perubahan role mengubah akses anggota. Mengubah email atau role akan mengakhiri sesi aktif mereka.</AlertDialogDescription></AlertDialogHeader><ActionForm action={saveMember} submitLabel="Konfirmasi perubahan">{fields}</ActionForm><AlertDialogCancel>Tutup</AlertDialogCancel></AlertDialogContent></AlertDialog>;
  return <Dialog><DialogTrigger asChild><Button className="min-h-11 w-full sm:w-auto">Tambah anggota</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Anggota baru</DialogTitle><DialogDescription>Undangan aktivasi akan dikirim melalui email.</DialogDescription></DialogHeader><ActionForm action={saveMember} submitLabel="Tambah & undang">{fields}</ActionForm></DialogContent></Dialog>;
}
