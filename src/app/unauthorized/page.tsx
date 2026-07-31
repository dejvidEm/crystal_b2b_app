"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function UnauthorizedPage() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Logo className="mb-8" />
      <div className="w-full max-w-md rounded-[12px] border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] border border-border bg-surface-elevated text-rose-300">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold text-text">Prístup zamietnutý</h1>
        <p className="mt-2 text-sm text-muted">
          Váš účet nie je aktívny, nemá priradený profil, alebo nemáte oprávnenie
          na túto stránku. Kontaktujte tím Crystal Detailing.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Späť na prehľad
          </Button>
          <Button onClick={() => void signOut()}>Odhlásiť sa</Button>
        </div>
      </div>
    </div>
  );
}
