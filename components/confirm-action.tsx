"use client";

import { ActionForm } from "@/components/action-form";
import type { FormAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel } from "@/components/ui/alert-dialog";

export function ConfirmAction({ action, label, triggerLabel, description, children }: { action: FormAction; label: string; triggerLabel?: string; description: string; children?: React.ReactNode }) {
  return <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="min-h-11">{triggerLabel ?? label}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{label}?</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader><ActionForm action={action} submitLabel={label} variant="destructive">{children}</ActionForm><AlertDialogCancel className="min-h-11">Tutup</AlertDialogCancel></AlertDialogContent></AlertDialog>;
}
