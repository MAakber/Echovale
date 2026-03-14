"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/toast-provider";
import { API_BASE_URL, PLACEHOLDERS, resolveAssetUrl } from "@/lib/constants";
import {
  Loader2,
  PencilLine,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

interface MemoryItem {
  id: number;
  title: string;
  category: string;
  description: string;
  ai_polished_story: string;
  location: string;
  latitude: number;
  longitude: number;
  year: number;
  original_image_path: string;
  restored_image_path: string;
  author: string;
  tags: string;
  created_at: string;
}

const CATEGORY_OPTIONS = ["建筑", "非遗", "民俗", "自然", "人物", "其他"];

export default function AdminPage() {
  const toast = useToast();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");

  const loadMemories = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/memories`);
      if (!response.ok) {
        throw new Error("failed to fetch memories");
      }

      const data: MemoryItem[] = await response.json();
      setMemories(data);
    } catch {
      toast.error({ title: "读取管理数据失败", description: "请确认后端服务已经启动。" });
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    void loadMemories();
  }, [loadMemories]);

  const filteredMemories = memories.filter((memory) => {
    const matchesCategory = categoryFilter === "全部" || memory.category === categoryFilter;
    const matchesKeyword =
      !keyword.trim() ||
      memory.title.toLowerCase().includes(keyword.toLowerCase()) ||
      memory.location.toLowerCase().includes(keyword.toLowerCase()) ||
      memory.author.toLowerCase().includes(keyword.toLowerCase());

    return matchesCategory && matchesKeyword;
  });

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("确定删除这条记忆吗？删除后将无法恢复。");
    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/memories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `delete failed: ${response.status}`);
      }

      setMemories((prev) => prev.filter((memory) => memory.id !== id));
      void loadMemories(false);
      toast.info({ title: "记忆已删除", description: "该条内容已从后端数据库移除。" });
    } catch (err) {
      toast.error({ title: "删除失败", description: err instanceof Error ? err.message : "请稍后重试。" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-stone-50 text-stone-900 transition-colors duration-300 dark:bg-stone-950 dark:text-stone-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.2),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.12),_transparent_24%),radial-gradient(circle_at_50%_18%,_rgba(34,197,94,0.1),_transparent_26%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.1),_transparent_24%),radial-gradient(circle_at_50%_18%,_rgba(34,197,94,0.08),_transparent_24%)]" />
      <Header />

      <main className="relative flex-grow pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="mb-10 overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/88 p-7 shadow-[0_20px_80px_rgba(28,25,23,0.08)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/88">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-stone-400">Memory Console</p>
                <h1 className="mb-4 text-4xl font-bold md:text-5xl font-serif">记忆管理台</h1>
                <p className="text-lg leading-relaxed text-stone-500 dark:text-stone-400">
                  统一管理和清理乡村记忆。若需创建新记忆，请前往 AI 创作台。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin/ai-providers"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50 dark:hover:bg-stone-800"
                >
                  <PencilLine className="h-4 w-4" />
                  AI 配置台
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    void loadMemories();
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
                >
                  <RefreshCw className="h-4 w-4" />
                  刷新数据
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                { label: "当前记录", value: `${memories.length} 条` },
                { label: "筛选结果", value: `${filteredMemories.length} 条` },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 px-5 py-4 dark:border-stone-800 dark:bg-stone-950/60">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900 dark:text-stone-50">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto xl:max-w-4xl">
            <section className="rounded-[2rem] border border-stone-200 bg-white/92 p-6 shadow-[0_20px_60px_rgba(28,25,23,0.06)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/92">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row">
                <label className="flex flex-1 items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-800 dark:bg-stone-950">
                  <Search className="h-4 w-4 text-stone-400" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索标题、地点、作者"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
                  />
                </label>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none dark:border-stone-800 dark:bg-stone-950"
                >
                  <option value="全部">全部分类</option>
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
                <span>共 {filteredMemories.length} 条数据</span>
                <span>数据源：后端 SQLite</span>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-20 text-stone-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredMemories.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-stone-200 px-6 py-14 text-center text-stone-400 dark:border-stone-800">
                    当前没有匹配的数据
                  </div>
                ) : (
                  filteredMemories.map((memory) => {
                    const preview = resolveAssetUrl(memory.restored_image_path) || PLACEHOLDERS.RURAL;

                    return (
                      <div
                        key={memory.id}
                        className="group flex w-full flex-col gap-4 rounded-3xl border border-stone-200 bg-stone-50 p-3 sm:flex-row transition-all hover:border-stone-300 hover:bg-white hover:shadow-md dark:border-stone-800 dark:bg-stone-950/50 dark:hover:border-stone-700 dark:hover:bg-stone-900/50"
                      >
                        <Link href={`/memories/${memory.id}`} className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl sm:w-48" aria-label={`View ${memory.title}`}>
                          <Image src={preview} alt={memory.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 192px" />
                        </Link>
                        <div className="flex flex-1 flex-col justify-between py-1">
                          <div>
                            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                              <span>{memory.category}</span>
                              <span></span>
                              <span>ID {memory.id}</span>
                            </div>
                            <h2 className="mb-2 line-clamp-1 text-lg font-bold transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-500">
                              <Link href={`/memories/${memory.id}`} className="hover:underline">
                                {memory.title}
                              </Link>
                            </h2>
                            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                              {memory.ai_polished_story || memory.description || "暂无摘要"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-stone-400">
                              {memory.location || "未指定地点"}  {memory.author || "匿名贡献者"}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                handleDelete(memory.id);
                              }}
                              disabled={deletingId === memory.id}
                              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/50"
                            >
                              {deletingId === memory.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
