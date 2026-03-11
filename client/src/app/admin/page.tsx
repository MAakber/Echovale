"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/toast-provider";
import { API_BASE_URL, PLACEHOLDERS, resolveAssetUrl } from "@/lib/constants";
import {
  ImagePlus,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
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

interface MemoryFormState {
  title: string;
  category: string;
  description: string;
  ai_polished_story: string;
  location: string;
  latitude: string;
  longitude: string;
  year: string;
  original_image_path: string;
  restored_image_path: string;
  author: string;
  tags: string;
}

const CATEGORY_OPTIONS = ["建筑", "非遗", "民俗", "自然", "人物", "其他"];

const EMPTY_FORM: MemoryFormState = {
  title: "",
  category: "建筑",
  description: "",
  ai_polished_story: "",
  location: "",
  latitude: "",
  longitude: "",
  year: String(new Date().getFullYear()),
  original_image_path: "",
  restored_image_path: "",
  author: "",
  tags: "",
};

function toFormState(memory: MemoryItem): MemoryFormState {
  return {
    title: memory.title,
    category: memory.category || "建筑",
    description: memory.description || "",
    ai_polished_story: memory.ai_polished_story || "",
    location: memory.location || "",
    latitude: Number.isFinite(memory.latitude) ? String(memory.latitude) : "",
    longitude: Number.isFinite(memory.longitude) ? String(memory.longitude) : "",
    year: memory.year ? String(memory.year) : String(new Date().getFullYear()),
    original_image_path: memory.original_image_path || "",
    restored_image_path: memory.restored_image_path || "",
    author: memory.author || "",
    tags: memory.tags || "",
  };
}

function toPayload(form: MemoryFormState) {
  return {
    title: form.title.trim() || "未命名记忆",
    category: form.category,
    description: form.description.trim(),
    ai_polished_story: form.ai_polished_story.trim(),
    location: form.location.trim() || "未指定",
    latitude: form.latitude.trim() ? Number(form.latitude) : 0,
    longitude: form.longitude.trim() ? Number(form.longitude) : 0,
    year: form.year.trim() ? Number(form.year) : new Date().getFullYear(),
    original_image_path: form.original_image_path.trim(),
    restored_image_path: form.restored_image_path.trim(),
    author: form.author.trim() || "匿名贡献者",
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .join(","),
  };
}

export default function AdminPage() {
  const toast = useToast();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingField, setUploadingField] = useState<"original_image_path" | "restored_image_path" | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<MemoryFormState>(EMPTY_FORM);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");

  const loadMemories = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/memories`);
      if (!response.ok) {
        throw new Error("failed to fetch memories");
      }

      const data: MemoryItem[] = await response.json();
      setMemories(data);

      if (selectedId !== null) {
        const current = data.find((item) => item.id === selectedId);
        if (current) {
          setForm(toFormState(current));
        } else {
          setSelectedId(null);
          setForm(EMPTY_FORM);
        }
      }
    } catch {
      toast.error({ title: "读取管理数据失败", description: "请确认后端服务已经启动。" });
    } finally {
      setLoading(false);
    }
  }, [selectedId, toast]);

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

  const selectMemory = (memory: MemoryItem) => {
    setSelectedId(memory.id);
    setForm(toFormState(memory));
    toast.info({ title: "已进入编辑模式", description: `正在编辑「${memory.title}」。` });
  };

  const resetForm = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    toast.info({ title: "已切换模式", description: "当前表单已重置为新建记忆。" });
  };

  const updateField = <K extends keyof MemoryFormState>(key: K, value: MemoryFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const uploadImage = async (field: "original_image_path" | "restored_image_path", file: File | null) => {
    if (!file) {
      return;
    }

    setUploadingField(field);

    const data = new FormData();
    data.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/upload`, {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        throw new Error("upload failed");
      }

      const result = await response.json();
      updateField(field, result.url || "");
      toast.info({
        title: field === "original_image_path" ? "原始图片上传成功" : "修复图片上传成功",
        description: "图片地址已经自动写入表单。",
      });
    } catch {
      toast.error({ title: "图片上传失败", description: "请稍后重试。" });
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const payload = toPayload(form);
      const response = await fetch(
        selectedId === null ? `${API_BASE_URL}/api/v1/memories` : `${API_BASE_URL}/api/v1/memories/${selectedId}`,
        {
          method: selectedId === null ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("save failed");
      }

      const saved: MemoryItem = await response.json();
      await loadMemories();
      setSelectedId(saved.id);
      setForm(toFormState(saved));
      toast.info({ title: selectedId === null ? "新记忆已创建" : "记忆已更新", description: "管理台内容已同步到后端数据库。" });
    } catch {
      toast.error({ title: "保存失败", description: "请检查表单内容或后端状态。" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedId === null) {
      return;
    }

    const confirmed = window.confirm("确定删除这条记忆吗？删除后将无法恢复。");
    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/memories/${selectedId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `delete failed: ${response.status}`);
      }

      await loadMemories();
      setSelectedId(null);
      setForm(EMPTY_FORM);
      toast.info({ title: "记忆已删除", description: "该条内容已从后端数据库移除。" });
    } catch (err) {
      toast.error({ title: "删除失败", description: err instanceof Error ? err.message : "请稍后重试。" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900 transition-colors duration-300 dark:bg-stone-950 dark:text-stone-50">
      <Header />

      <main className="flex-grow pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-stone-400">Memory Console</p>
              <h1 className="mb-4 text-4xl font-bold md:text-5xl font-serif">记忆管理台</h1>
              <p className="text-lg leading-relaxed text-stone-500 dark:text-stone-400">
                这里直接维护后端数据库中的乡村记忆内容。当前版本不做密码验证，适合本地演示和内部录入。
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
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50 dark:hover:bg-stone-800"
              >
                <Plus className="h-4 w-4" />
                新建记忆
              </button>
              <button
                onClick={loadMemories}
                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
              >
                <RefreshCw className="h-4 w-4" />
                刷新数据
              </button>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.1fr_1.4fr]">
            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
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

              <div className="space-y-4 max-h-[920px] overflow-y-auto pr-1">
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
                    const isActive = memory.id === selectedId;

                    return (
                      <button
                        key={memory.id}
                        type="button"
                        onClick={() => selectMemory(memory)}
                        className={`grid w-full grid-cols-[112px_1fr] gap-4 rounded-3xl border p-3 text-left transition ${
                          isActive
                            ? "border-stone-900 bg-stone-100 shadow-lg dark:border-stone-100 dark:bg-stone-800"
                            : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-stone-700 dark:hover:bg-stone-900"
                        }`}
                      >
                        <div className="relative h-28 overflow-hidden rounded-2xl">
                          <Image src={preview} alt={memory.title} fill className="object-cover" sizes="112px" />
                        </div>
                        <div className="min-w-0 py-1">
                          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                            <span>{memory.category}</span>
                            <span>•</span>
                            <span>ID {memory.id}</span>
                          </div>
                          <h2 className="mb-2 line-clamp-1 text-lg font-bold">{memory.title}</h2>
                          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                            {memory.ai_polished_story || memory.description || "暂无摘要"}
                          </p>
                          <div className="flex items-center justify-between text-xs text-stone-400">
                            <span>{memory.location || "未指定地点"}</span>
                            <span>{memory.author || "匿名贡献者"}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
              <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-stone-400">
                    {selectedId === null ? "Create" : `Editing #${selectedId}`}
                  </p>
                  <h2 className="text-2xl font-bold">{selectedId === null ? "新建一条记忆" : "编辑记忆内容"}</h2>
                </div>
                <div className="flex gap-3">
                  {selectedId !== null && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting || saving}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      删除
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || deleting}
                    className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {selectedId === null ? "创建" : "保存修改"}
                  </button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-300">标题</span>
                  <input
                    value={form.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950"
                    placeholder="输入记忆标题"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-300">分类</span>
                  <select
                    value={form.category}
                    onChange={(event) => updateField("category", event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950"
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-300">地点</span>
                  <input
                    value={form.location}
                    onChange={(event) => updateField("location", event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950"
                    placeholder="如：安徽 宏村"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-300">作者</span>
                  <input
                    value={form.author}
                    onChange={(event) => updateField("author", event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950"
                    placeholder="录入者或贡献者"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-300">年份</span>
                  <input
                    value={form.year}
                    onChange={(event) => updateField("year", event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950"
                    placeholder="2024"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-300">标签</span>
                  <input
                    value={form.tags}
                    onChange={(event) => updateField("tags", event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950"
                    placeholder="用逗号分隔多个标签"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-300">纬度</span>
                  <input
                    value={form.latitude}
                    onChange={(event) => updateField("latitude", event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950"
                    placeholder="30.2722"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-300">经度</span>
                  <input
                    value={form.longitude}
                    onChange={(event) => updateField("longitude", event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950"
                    placeholder="117.9922"
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">原始图片</span>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800">
                      {uploadingField === "original_image_path" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                      上传
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => uploadImage("original_image_path", event.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  <input
                    value={form.original_image_path}
                    onChange={(event) => updateField("original_image_path", event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950"
                    placeholder="/uploads/example.jpg"
                  />
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-950">
                    <Image
                      src={resolveAssetUrl(form.original_image_path) || PLACEHOLDERS.OLD_PHOTO}
                      alt="原始图片预览"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">修复图片</span>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800">
                      {uploadingField === "restored_image_path" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                      上传
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => uploadImage("restored_image_path", event.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  <input
                    value={form.restored_image_path}
                    onChange={(event) => updateField("restored_image_path", event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950"
                    placeholder="/gallery/hongcun.jpg"
                  />
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-950">
                    <Image
                      src={resolveAssetUrl(form.restored_image_path) || PLACEHOLDERS.AI_RESTORED}
                      alt="修复图片预览"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-300">摘要描述</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    className="min-h-32 w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-relaxed outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950"
                    placeholder="用于列表页摘要展示"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-300">AI 润色正文</span>
                  <textarea
                    value={form.ai_polished_story}
                    onChange={(event) => updateField("ai_polished_story", event.target.value)}
                    className="min-h-56 w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-relaxed outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950"
                    placeholder="用于详情页正文展示"
                  />
                </label>
              </div>

              <div className="mt-8 rounded-3xl border border-dashed border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <PencilLine className="h-4 w-4" />
                  当前发布预览
                </div>
                <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
                    <Image
                      src={resolveAssetUrl(form.restored_image_path) || PLACEHOLDERS.RURAL}
                      alt="发布预览"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      <span>{form.category || "未分类"}</span>
                      <span>•</span>
                      <span>{form.location || "未指定地点"}</span>
                    </div>
                    <h3 className="mb-3 text-2xl font-bold">{form.title || "未命名记忆"}</h3>
                    <p className="line-clamp-4 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                      {form.ai_polished_story || form.description || "录入正文后，这里会显示你的发布内容预览。"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
