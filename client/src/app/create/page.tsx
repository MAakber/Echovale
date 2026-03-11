"use client";

import { useState, useRef } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { API_BASE_URL, PLACEHOLDERS, resolveAssetUrl } from "@/lib/constants";
import Image from "next/image";
import { Upload, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState("tongyi");
  
  // 状态管理
  const [formData, setFormData] = useState({
    title: "",
    category: "建筑",
    description: "",
    originalImage: "",
    restoredImage: "",
    aiPolishedStory: "",
    location: "未指定",
    year: new Date().getFullYear(),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextStep = () => {
    if (step === 1 && !formData.description) {
      setError("请至少输入一段文字描述");
      return;
    }
    setError(null);
    setStep(prev => Math.min(prev + 1, 3));
  };
  
  const prevStep = () => {
    setError(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  // 处理图片上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const data = new FormData();
    data.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/upload`, {
        method: "POST",
        body: data,
      });
      
      const result = await response.json();
      if (result.url) {
        setFormData(prev => ({ ...prev, originalImage: result.url }));
      }
    } catch {
      setError("上传失败，请检查后端服务是否启动");
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理 AI 生成
  const handleAIProcess = async (mode: string) => {
    setIsProcessing(true);
    setError(null);
    setSelectedTool(mode);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/process-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: formData.originalImage,
          prompt: formData.description,
          mode,
        }),
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "AI 处理失败，请重试");
      }

      if (!result.polished_story) {
        throw new Error("AI 未返回可用的创作内容");
      }

      setFormData(prev => ({
        ...prev,
        restoredImage: result.restored_url || prev.originalImage,
        aiPolishedStory: result.polished_story,
      }));
      setStep(3);
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI 处理失败，请重试";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 最终提交
  const handleSubmit = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title || "未命名记忆",
          category: formData.category,
          description: formData.description,
          ai_polished_story: formData.aiPolishedStory,
          location: formData.location,
          latitude: 25 + Math.random() * 15, // 随机生成中国范围内的坐标
          longitude: 100 + Math.random() * 20,
          year: parseInt(formData.year.toString()),
          original_image_path: formData.originalImage,
          restored_image_path: formData.restoredImage,
          author: "匿名贡献者"
        }),
      });
      
      if (response.ok) {
        router.push("/memories");
      }
    } catch {
      setError("发布失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-50 transition-colors duration-300">
      <Header />
      
      <main className="flex-grow pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Stepper Header */}
          <div className="flex items-center justify-between mb-16 relative px-4">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-stone-200 dark:bg-stone-800 -translate-y-1/2 z-0 mx-10"></div>
            {[1, 2, 3].map((s) => (
              <div key={s} className="relative z-10 flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${
                    step >= s ? "bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 scale-110" : "bg-stone-200 dark:bg-stone-800 text-stone-500"
                  }`}
                >
                  {s}
                </div>
                <span className={`text-xs mt-3 font-medium ${step >= s ? "text-stone-900 dark:text-stone-50" : "text-stone-400 dark:text-stone-600"}`}>
                  {s === 1 ? "提交素材" : s === 2 ? "AI 创作" : "发布记忆"}
                </span>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 md:p-12 rounded-3xl shadow-xl min-h-[550px] flex flex-col">
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold mb-4 font-serif">上传你的乡村片段</h2>
                  <p className="text-stone-500 dark:text-stone-400">无论是文字记录、老照片还是语音对话，AI 都将以此为根基进行重构。</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center text-center group bg-stone-50 dark:bg-stone-950/50 ${
                      formData.originalImage 
                        ? "border-green-500/50 bg-green-50/10 dark:bg-green-900/5" 
                        : "border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600"
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    
                    {isProcessing ? (
                      <Loader2 className="w-10 h-10 mb-4 animate-spin text-stone-400" />
                    ) : formData.originalImage ? (
                      <div className="relative w-full aspect-square max-h-32 mb-4">
                        <Image src={resolveAssetUrl(formData.originalImage)} alt="Uploaded" fill className="object-cover rounded-lg" />
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-lg">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <Upload className="w-10 h-10 mb-4 text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-50 transition-colors" />
                    )}
                    
                    <div className="font-bold mb-2">图片资料</div>
                    <div className="text-xs text-stone-500">
                      {formData.originalImage ? "已上传老照片" : "支持老照片修复、上色"}
                    </div>
                  </div>

                  <div className="p-8 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl opacity-50 cursor-not-allowed flex flex-col items-center justify-center text-center bg-stone-50 dark:bg-stone-950/50">
                    <div className="text-4xl mb-4 grayscale">🎤</div>
                    <div className="font-bold mb-2 text-stone-400">语音口述</div>
                    <div className="text-[10px] bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-500 uppercase font-black tracking-widest">即将上线</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">记忆描述 (文字记录或故事概要)</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4 h-32 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500/20 transition-all placeholder:text-stone-400 text-sm leading-relaxed"
                    placeholder="例如：还记得小时候村口的那棵老槐树，夏天全村人都在树下纳凉..."
                  ></textarea>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold mb-4 font-serif">选择 AI 实验工具</h2>
                  <p className="text-stone-500 dark:text-stone-400">选择大赛指定的国产 AI 模型，为您的素材注入灵魂。</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: "deepseek", name: "纪实叙事模式", desc: "更偏向真实乡村记忆的文学化整理，并生成纪实风画面", icon: "💎" },
                    { id: "tongyi", name: "视觉重构模式", desc: "根据你的描述重新生成一张氛围完整的乡村视觉画面", icon: "🎨" },
                    { id: "spark", name: "乡音讲述模式", desc: "保留口述感与传说气质，生成更具故事性的画面和文本", icon: "🗣️" }
                  ].map((tool) => (
                    <div 
                      key={tool.id} 
                      onClick={() => {
                        void handleAIProcess(tool.id);
                      }}
                      className={`p-6 bg-stone-50 dark:bg-stone-950 border rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-all flex items-center gap-6 group relative overflow-hidden ${
                        selectedTool === tool.id
                          ? "border-stone-900 dark:border-stone-100"
                          : "border-stone-200 dark:border-stone-800"
                      }`}
                    >
                      <div className="text-3xl">{tool.icon}</div>
                      <div className="flex-grow">
                        <div className="font-bold">{tool.name}</div>
                        <div className="text-sm text-stone-500 dark:text-stone-500">{tool.desc}</div>
                      </div>
                      <div className="w-6 h-6 border-2 border-stone-300 dark:border-stone-700 rounded-full group-hover:border-stone-900 dark:group-hover:border-stone-100 transition-colors flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-stone-900 dark:bg-stone-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      
                       {isProcessing && selectedTool === tool.id && (
                        <div className="absolute inset-0 bg-stone-900/5 backdrop-blur-[1px] flex items-center justify-center">
                           <Loader2 className="w-6 h-6 animate-spin text-stone-900" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-center">
                <div className="text-center mb-6">
                  <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold mb-4 font-serif">创作已就绪</h2>
                  <p className="text-stone-500 dark:text-stone-400">AI 已经完成了内容的初稿。您可以立即预览效果并发布。</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mb-8">
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      {formData.restoredImage && formData.restoredImage !== formData.originalImage ? "AI 生成画面" : "图片预览"}
                    </span>
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800 shadow-lg">
                      <Image 
                        src={formData.restoredImage ? resolveAssetUrl(formData.restoredImage) : PLACEHOLDERS.AI_RESTORED} 
                        alt="AI Generation Preview" 
                        fill 
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">AI 润色文本</span>
                    <div className="h-full p-6 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-2xl text-left border-l-4 border-l-stone-900 dark:border-l-stone-100 italic text-stone-700 dark:text-stone-300 leading-relaxed text-sm">
                      {formData.aiPolishedStory || "AI 正在生成更完整的乡村叙事文本..."}
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-3xl space-y-4">
                   <input 
                      type="text" 
                      placeholder="给这段记忆起个标题..."
                      value={formData.title}
                      onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                      className="w-full bg-transparent border-b-2 border-stone-200 dark:border-stone-800 py-2 font-bold text-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 transition-colors"
                   />
                </div>
              </div>
            )}

            <div className="mt-auto pt-12 flex justify-between items-center border-t border-stone-100 dark:border-stone-800">
              <button 
                onClick={prevStep}
                disabled={isProcessing}
                className={`px-8 py-3 rounded-full font-medium transition-all ${
                  step === 1 ? "invisible" : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                }`}
              >
                ← 上一步
              </button>
              
              <div className="flex items-center gap-4">
                {isProcessing && (
                  <div className="flex items-center gap-2 text-stone-400 text-xs font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>AI 正在全力计算中...</span>
                  </div>
                )}
                <button 
                  onClick={step === 3 ? handleSubmit : nextStep}
                  disabled={isProcessing}
                  className="px-12 py-3 bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 rounded-full font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-stone-900/10 dark:shadow-none"
                >
                  {step === 3 ? "发布到长廊" : "下一步 →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
