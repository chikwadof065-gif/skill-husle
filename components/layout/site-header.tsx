"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FiMenu, FiMoon, FiSun, FiX } from "react-icons/fi";
import AuthNavActions from "@/components/auth-nav-actions";

const navigationLinks = [
  { href: "/find-freelancers", label: "Find talent" },
  { href: "/find-jobs", label: "Find work" },
  { href: "/messages", label: "Messages" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [hasResolvedTheme, setHasResolvedTheme] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setIsDark(savedTheme ? savedTheme === "dark" : prefersDark);
    setHasResolvedTheme(true);
  }, []);

  useEffect(() => {
    if (!hasResolvedTheme) {
      return;
    }

    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [hasResolvedTheme, isDark]);

  return (
    <header className="relative z-20 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight sm:text-xl"
        >
          <span className="relative h-9 w-9 overflow-hidden rounded-lg bg-white">
            <Image
              src="/logo.png"
              alt=""
              fill
              sizes="36px"
              className="scale-[1.45] object-cover"
            />
          </span>
          <span>Skill Hustle</span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDark((current) => !current)}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-lg transition hover:bg-background"
          >
            {isDark ? (
              <FiSun aria-hidden="true" />
            ) : (
              <FiMoon aria-hidden="true" />
            )}
          </button>
          <div className="hidden items-center gap-2 lg:flex">
            <AuthNavActions />
          </div>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-lg lg:hidden"
          >
            {isMenuOpen ? (
              <FiX aria-hidden="true" />
            ) : (
              <FiMenu aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="absolute inset-x-0 top-full border-b border-border bg-surface px-5 py-4 shadow-lg lg:hidden"
        >
          <div className="flex flex-col gap-1">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                aria-current={pathname === link.href ? "page" : undefined}
                className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent-soft"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <AuthNavActions />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
