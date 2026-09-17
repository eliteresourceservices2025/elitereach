"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Tag, Send, Workflow, FileEdit, Mail, History, BarChart3, Settings } from "lucide-react";

const BASE_LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/campaigns", label: "Campaigns", icon: Send },
  { href: "/sequences", label: "Sequences", icon: Workflow },
  { href: "/transactional", label: "Transactional", icon: Mail },
  { href: "/forms", label: "Forms", icon: FileEdit },
  { href: "/sent-emails", label: "Sent Emails", icon: History },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const ADMIN_LINKS = [{ href: "/settings", label: "Settings", icon: Settings }];

export function NavLinks({ isAdmin, collapsed }: { isAdmin: boolean; collapsed: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...BASE_LINKS, ...ADMIN_LINKS] : BASE_LINKS;

  return (
    <>
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            title={collapsed ? link.label : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              collapsed ? "justify-center" : ""
            } ${active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{link.label}</span>}
          </Link>
        );
      })}
    </>
  );
}
