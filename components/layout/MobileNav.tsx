"use client";

import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLinks } from "./NavLinks";

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-elite-navy-dark hover:bg-black/5"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative flex w-64 flex-col bg-elite-violet text-white">
            <div className="flex items-center justify-between px-5 py-6">
              <div className="flex items-center gap-2">
                <Image src="/elite-logo-white.png" alt="Elite Resource Services" width={32} height={32} />
                <div className="leading-tight">
                  <p className="text-sm font-semibold">EliteReach</p>
                  <p className="text-xs text-white/60">for Elite Resource Services</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close navigation" className="text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-3" onClick={() => setOpen(false)}>
              <NavLinks isAdmin={isAdmin} collapsed={false} />
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
