"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { href: "/", label: "首页" },
  { href: "/memories", label: "数字长廊" },
  { href: "/create", label: "AI 创作" },
  { href: "/map", label: "时空地图" },
  { href: "/admin", label: "管理台" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 px-4 transition-all duration-300 sm:px-6 ${
        isScrolled ? "py-3" : "py-5"
      }`}
    >
      <div
        className={`container mx-auto flex items-center justify-between rounded-full border px-5 transition-all duration-300 sm:px-6 ${
          isScrolled
            ? "border-stone-200/90 bg-white/88 py-3 shadow-[0_12px_40px_rgba(28,25,23,0.08)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/88"
            : "border-stone-200/60 bg-white/62 py-3.5 backdrop-blur dark:border-stone-800/80 dark:bg-stone-900/62"
        }`}
      >
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-sm font-black text-white shadow-sm dark:bg-stone-50 dark:text-stone-900">
            乡
          </span>
          <div>
            <span className="block text-lg font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-xl">
              乡村文化记忆库
            </span>
            <span className="hidden text-[11px] uppercase tracking-[0.24em] text-stone-400 sm:block">
              Rural Memory Studio
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/create"
            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:bg-stone-800 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            立即贡献
          </Link>
        </div>
      </div>
    </header>
  );
}
