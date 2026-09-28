"use client";

import { usePathname } from "next/navigation";
import { adminLogoutAction } from "@/lib/actions";

const links = [
  { href: "/admin", label: "لوحة التحكم" },
  { href: "/admin/stories", label: "القصص" },
  { href: "/admin/categories", label: "التصنيفات" },
  { href: "/admin/authors", label: "المؤلفون" },
  { href: "/admin/homepage", label: "الصفحة الرئيسية" },
  { href: "/admin/media", label: "الوسائط" },
  { href: "/admin/settings", label: "الإعدادات" },
];

export function AdminShell({ children, name }: { children: React.ReactNode; name: string }) {
  const pathname = usePathname();
  return (
    <div className="admin-shell">
      <aside className="side-nav">
        <a className="logo" href="/admin">
          <span className="logo-mark" aria-hidden="true" />
          يراع
        </a>
        <p className="help">{name}</p>
        <nav aria-label="إدارة المحتوى">
          {links.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <a key={link.href} href={link.href} aria-current={active ? "page" : undefined}>
                {link.label}
              </a>
            );
          })}
          <a href="/" target="_blank" rel="noopener noreferrer">
            عرض الموقع
          </a>
        </nav>
        <form action={adminLogoutAction}>
          <button className="btn btn-secondary" type="submit">
            تسجيل الخروج
          </button>
        </form>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
