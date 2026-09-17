"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { MobileNav } from "./MobileNav";

export function Header({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  const router = useRouter();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between gap-3 border-b border-black/5 bg-white px-4 py-3 text-sm text-gray-500 md:justify-end md:px-6">
      <MobileNav isAdmin={isAdmin} />
      <span className="truncate">
        {email}
        {isAdmin && <span className="ml-2 rounded-full bg-elite-gold/20 px-2 py-0.5 text-xs font-medium text-elite-navy-dark">Admin</span>}
      </span>
      <button onClick={() => setConfirmingLogout(true)} className="text-elite-violet hover:underline">
        Sign out
      </button>

      {confirmingLogout && (
        <ConfirmModal
          title="Sign out"
          message="Are you sure you want to log out of EliteReach?"
          confirmLabel="Sign out"
          variant="default"
          onConfirm={handleLogout}
          onCancel={() => setConfirmingLogout(false)}
        />
      )}
    </header>
  );
}
