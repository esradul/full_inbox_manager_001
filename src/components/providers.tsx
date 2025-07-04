"use client";

import type { ReactNode } from "react";
import { SupabaseProvider } from "@/contexts/supabase-context";

export function Providers({ children }: { children: ReactNode }) {
  return <SupabaseProvider>{children}</SupabaseProvider>;
}
