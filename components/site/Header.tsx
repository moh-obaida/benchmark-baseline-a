"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/icons";
import type { Category } from "@/lib/types";

export function Header({
  siteName,
  logoUrl,
  categories,
  accountLabel,
}: {
  siteName: string;
  logoUrl: string;
  categories: Category[];
  accountLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "/", label: "الرئيسية" },
    { href: "/categories", label: "التصنيفات" },
    { href: "/explore", label: "استكشف" },
    { href: "/search", label: "البحث" },
  ];

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="logo" href="/">
          {logoUrl ? <img src={logoUrl} alt="" /> : <LogoMark />}
          {siteName}
        </a>
        <nav className="desktop-nav" aria-label="التنقل الرئيسي">
          {links.map((link) => (
            <a key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="header-tools">
          <a className="tool-link" href="/favorites">
            المفضلة
          </a>
          <a className="tool-link" href="/account">
            {accountLabel}
          </a>
          <button className="menu-btn" type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((value) => !value)}>
            {open ? "إغلاق" : "القائمة"}
          </button>
        </div>
      </div>
      {categories.length > 0 ? (
        <div className="container nav-cats" aria-label="تصنيفات ظاهرة">
          {categories.map((category) => (
            <a key={category.id} href={`/categories/${category.slug}`} aria-current={pathname === `/categories/${category.slug}` ? "page" : undefined}>
              {category.name}
            </a>
          ))}
        </div>
      ) : null}
      <div className={`container mobile-panel${open ? " open" : ""}`} id="mobile-nav">
        {links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
        <a href="/favorites">المفضلة</a>
        <a href="/account">{accountLabel}</a>
        {categories.map((category) => (
          <a key={category.id} href={`/categories/${category.slug}`}>
            {category.name}
          </a>
        ))}
      </div>
    </header>
  );
}
