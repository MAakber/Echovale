"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 dark:bg-stone-900/80 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tighter text-stone-900 dark:text-stone-50">
            乡村文化记忆库
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors">首页</Link>
          <Link href="/memories" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors">数字长廊</Link>
          <Link href="/create" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors">AI 创作</Link>
          <Link href="/map" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors">时空地图</Link>
          <Link href="/admin" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors">管理台</Link>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/create"
            className="px-5 py-2 bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 rounded-full text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-all"
          >
            立即贡献
          </Link>
        </div>
      </div>
    </header>
  );
}
