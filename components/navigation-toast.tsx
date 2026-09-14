"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const successMessages: Record<string, string> = {
  login: "Berhasil masuk. Selamat datang kembali!",
  logout: "Anda berhasil keluar dari akun.",
  activated: "Akun berhasil diaktifkan. Silakan masuk.",
};

export function NavigationToast() {
  const searchParams = useSearchParams();
  const code = searchParams.get("toast");
  const shownCode = useRef<string | null>(null);

  useEffect(() => {
    if (code && successMessages[code] && shownCode.current !== code) {
      shownCode.current = code;
      toast.success(successMessages[code]);
    }
  }, [code]);

  return null;
}
