"use client";

import { useEffect } from "react";
import { Toaster as Sonner, toast } from "sonner";
import { takeFlash } from "@/lib/flash";

/**
 * App-wide toast host using Sonner's default look. `richColors` gives
 * green success, orange warning and red error toasts. Trigger them with
 * `toast.success/warning/error` from "sonner", or `navigateWithFlash` when
 * the toast must survive a full page load.
 */
export function Toaster() {
  useEffect(() => {
    const flash = takeFlash();
    if (flash) toast[flash.type](flash.message);
  }, []);

  return <Sonner position="bottom-center" theme="system" richColors closeButton />;
}
