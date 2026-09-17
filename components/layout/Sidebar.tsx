"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NavLinks } from "./NavLinks";

const STORAGE_KEY = "elite-sidebar-collapsed";

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      // Reading localStorage during the initial render would mismatch the server-rendered
      // HTML (which has no access to it), so this intentionally runs post-mount; `ready`
      // hides the sidebar until the real value is applied to avoid a flash of the wrong state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // ignore
    } finally {
      setReady(true);
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <aside
      className={`relative hidden shrink-0 flex-col bg-elite-violet text-white transition-all duration-200 md:flex ${
        collapsed ? "w-16" : "w-60"
      } ${ready ? "" : "invisible"}`}
    >
      <div className={`flex items-center gap-2 px-5 py-6 ${collapsed ? "justify-center px-0" : ""}`}>
        <Image src="/elite-logo-white.png" alt="Elite Resource Services" width={32} height={32} />
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-semibold">EliteReach</p>
            <p className="text-xs text-white/60">for Elite Resource Services</p>
          </div>
        )}
      </div>
      <nav className={`flex-1 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
        <NavLinks isAdmin={isAdmin} collapsed={collapsed} />
      </nav>
      <div className={`py-4 text-xs text-white/40 ${collapsed ? "text-center" : "px-5"}`}>
        {!collapsed && (
          <Link href="/settings" className="hover:text-white/70">
            Powered by Sequenzy
          </Link>
        )}
      </div>
      <button
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full bg-white text-elite-violet shadow-md hover:bg-white/90"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
