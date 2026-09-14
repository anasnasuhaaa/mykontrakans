"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import type { ActionState, FormAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SubmitButton({ label, variant }: { label: string; variant?: "default" | "destructive" | "outline" }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant={variant} disabled={pending} className="min-h-11 w-full sm:w-auto">{pending && <LoaderCircle className="size-4 animate-spin" />}{pending ? "Memproses…" : label}</Button>;
}

export function ActionForm({ action, children, submitLabel = "Simpan", className, variant, noValidate }: {
  action: FormAction; children?: React.ReactNode; submitLabel?: string; className?: string; variant?: "default" | "destructive" | "outline"; noValidate?: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(async (previousState, formData) => {
    const nextState = await action(previousState, formData);
    if (nextState.message) (nextState.success ? toast.success : toast.error)(nextState.message);
    return nextState;
  }, {});
  return <form action={formAction} className={cn("space-y-4", className)} noValidate={noValidate}>
    {children}
    {state.message && <p role="status" className={cn("text-sm", state.success ? "text-muted-foreground" : "text-destructive")}>{state.message}</p>}
    {state.details && <ul className="space-y-1 text-sm text-muted-foreground">{state.details.map((detail, index) => <li key={index}>{detail}</li>)}</ul>}
    <SubmitButton label={submitLabel} variant={variant} />
  </form>;
}
