"use client";

import { ActionForm } from "@/components/action-form";
import type { FormAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel } from "@/components/ui/alert-dialog";

export function ConfirmAction({ action, label, triggerLabel, description, children, trigger, open, onOpenChange }: {
  action: FormAction;
  label: string;
  triggerLabel?: string;
  description: string;
  children?: React.ReactNode;
  trigger?: React.ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const runAction: FormAction = async (state, formData) => {
    const result = await action(state, formData);
    if (result.success) onOpenChange?.(false);
    return result;
  };
  const triggerContent = trigger === undefined
    ? <Button variant="outline" className="min-h-11">{triggerLabel ?? label}</Button>
    : trigger;

  return <AlertDialog open={open} onOpenChange={onOpenChange}>{triggerContent && <AlertDialogTrigger asChild>{triggerContent}</AlertDialogTrigger>}<AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{label}?</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader><ActionForm action={runAction} submitLabel={label} variant="destructive">{children}</ActionForm><AlertDialogCancel className="min-h-11">Tutup</AlertDialogCancel></AlertDialogContent></AlertDialog>;
}
