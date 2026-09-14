"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { updateProfileAvatar } from "@/app/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initialActionState, type ActionState } from "@/lib/actions";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_UPLOAD_LABEL, MAX_IMAGE_UPLOAD_SIZE } from "@/lib/upload-constraints";

export function AvatarUploadForm({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (previousState, form) => {
      const nextState = await updateProfileAvatar(previousState, form);
      if (nextState.success) {
        setPreviewUrl(null);
        setSelected(false);
        if (inputRef.current) inputRef.current.value = "";
      }
      return nextState;
    },
    initialActionState,
  );

  useEffect(() => {
    if (!state.message) return;
    (state.success ? toast.success : toast.error)(state.message);
  }, [state]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
      toast.error(`Ukuran foto profil tidak boleh melebihi ${MAX_IMAGE_UPLOAD_LABEL}.`);
      event.currentTarget.value = "";
      setPreviewUrl(null);
      setSelected(false);
      return;
    }
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase() as typeof ALLOWED_IMAGE_MIME_TYPES[number])) {
      toast.error("Format foto profil harus JPG, PNG, atau WEBP.");
      event.currentTarget.value = "";
      setPreviewUrl(null);
      setSelected(false);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setSelected(true);
  };

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Avatar className="size-28 border-4 border-background shadow-md">
          <AvatarImage src={previewUrl || avatarUrl || undefined} alt={`Foto profil ${name}`} className="object-cover" />
          <AvatarFallback className="text-3xl font-semibold">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div>
            <p className="font-medium">Foto profil</p>
            <p className="mt-1 text-sm text-muted-foreground">JPG, PNG, atau WEBP. Maksimal {MAX_IMAGE_UPLOAD_LABEL}.</p>
          </div>
          <input
            ref={inputRef}
            id="avatar-upload"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
            disabled={pending}
          />
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={pending}>
              <Camera className="size-4" /> Pilih foto
            </Button>
            <Button type="submit" disabled={pending || !selected}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {pending ? "Mengunggah..." : "Simpan foto"}
            </Button>
          </div>
        </div>
      </div>
      {state.message && <p role="status" className={state.success ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>{state.message}</p>}
    </form>
  );
}
