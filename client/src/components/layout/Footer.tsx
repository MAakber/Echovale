import Link from "next/link";

export default function Footer() {
  return (
    <footer className="pb-8 pt-12 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/88 p-8 shadow-[0_16px_60px_rgba(28,25,23,0.06)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/88">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="mb-4 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-sm font-black text-white dark:bg-stone-50 dark:text-stone-900">
                  乡
                </span>
                <div>
                  <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50">乡村文化记忆库</h3>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">Rural Memory Studio</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                基于 AIGC 技术，通过数字化手段保存、构建和传播中国乡村的文化记忆。让每一份乡愁都有迹可循。
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-stone-900 dark:text-stone-50">核心入口</h4>
              <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                <li><Link href="/memories" className="hover:text-stone-900 dark:hover:text-stone-50">数字长廊</Link></li>
                <li><Link href="/create" className="hover:text-stone-900 dark:hover:text-stone-50">创作中心</Link></li>
                <li><Link href="/map" className="hover:text-stone-900 dark:hover:text-stone-50">时空地图</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-stone-900 dark:text-stone-50">AI 技术</h4>
              <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                <li>阿里通义系列</li>
                <li>DeepSeek</li>
                <li>百度文心系列</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-stone-900 dark:text-stone-50">关于竞赛</h4>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                2026年 (第19届) 全国大学生计算机设计大赛作品
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-stone-200 pt-8 text-center text-xs text-stone-400 dark:border-stone-800 dark:text-stone-500 md:flex-row md:text-left">
            <p>© 2024-2026 乡村文化记忆库 项目组</p>
            <div className="flex flex-wrap justify-center gap-6 md:justify-end">
              <span>隐私政策</span>
              <span>服务协议</span>
              <span>苏ICP备xxxxxxx号</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
