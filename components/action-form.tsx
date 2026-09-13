"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import type { FormAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SubmitButton({ label, variant }: { label: string; variant?: "default" | "destructive" | "outline" }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant={variant} disabled={pending} className="min-h-11">{pending && <LoaderCircle className="size-4 animate-spin" />}{pending ? "Memproses…" : label}</Button>;
}

export function ActionForm({ action, children, submitLabel = "Simpan", className, variant }: {
  action: FormAction; children?: React.ReactNode; submitLabel?: string; className?: string; variant?: "default" | "destructive" | "outline";
}) {
  const [state, formAction] = useActionState(action, {});
  useEffect(() => {
    if (state.message) (state.success ? toast.success : toast.error)(state.message);
  }, [state]);
  return <form action={formAction} className={cn("space-y-4", className)}>
    {children}
    {state.message && <p role="status" className={cn("text-sm", state.success ? "text-muted-foreground" : "text-destructive")}>{state.message}</p>}
    {state.details && <ul className="space-y-1 text-sm text-muted-foreground">{state.details.map((detail, index) => <li key={index}>{detail}</li>)}</ul>}
    <SubmitButton label={submitLabel} variant={variant} />
  </form>;
}
