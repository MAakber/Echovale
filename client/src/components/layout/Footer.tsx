export default function Footer() {
  return (
    <footer className="bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 pt-16 pb-8 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-bold mb-4 text-stone-900 dark:text-stone-50">乡村文化记忆库</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
              基于 AIGC 技术，通过数字化手段保存、构建和传播中国乡村的文化记忆。让每一份乡愁都有迹可循。
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-stone-900 dark:text-stone-50">核心入口</h4>
            <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
              <li><a href="/memories" className="hover:text-stone-900 dark:hover:text-stone-50">数字长廊</a></li>
              <li><a href="/create" className="hover:text-stone-900 dark:hover:text-stone-50">创作中心</a></li>
              <li><a href="/map" className="hover:text-stone-900 dark:hover:text-stone-50">时空地图</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-stone-900 dark:text-stone-50">AI 技术</h4>
            <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
              <li>阿里通义系列</li>
              <li>DeepSeek</li>
              <li>百度文心系列</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-stone-900 dark:text-stone-50">关于竞赛</h4>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              2026年 (第19届) 全国大学生计算机设计大赛作品
            </p>
          </div>
        </div>
        <div className="border-t border-stone-200 dark:border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-stone-400 dark:text-stone-500 text-xs text-center md:text-left">
          <p>© 2024-2026 乡村文化记忆库 项目组</p>
          <div className="flex gap-6">
            <span>隐私政策</span>
            <span>服务协议</span>
            <span>苏ICP备xxxxxxx号</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
