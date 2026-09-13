"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Field({ label, name, ...props }: React.ComponentProps<typeof Input> & { label: string; name: string }) {
  return <div className="space-y-2"><Label htmlFor={props.id || name}>{label}</Label><Input id={name} name={name} className="min-h-11" {...props} /></div>;
}
export function SelectField({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: string; options: { value: string; label: string }[] }) {
  return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Select name={name} defaultValue={defaultValue} required><SelectTrigger id={name} className="min-h-11 w-full"><SelectValue placeholder="Pilih…" /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>;
}
