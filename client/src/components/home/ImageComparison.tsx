"use client";

import { useState } from "react";
import Image from "next/image";
import { PLACEHOLDERS } from "@/lib/constants";

interface ImageComparisonProps {
  afterImage?: string;
}

export default function ImageComparison({ afterImage }: ImageComparisonProps) {
  const [opened, setOpened] = useState(false);

  const displayAfter = afterImage || PLACEHOLDERS.AI_RESTORED;
  const previewImage = PLACEHOLDERS.OLD_PHOTO;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-[linear-gradient(180deg,#f7f1e8_0%,#efe6d8_100%)] shadow-[0_28px_80px_rgba(124,101,74,0.14)] transition-all duration-700 dark:border-stone-700 dark:bg-[linear-gradient(180deg,#2d261f_0%,#241e19_100%)]">
      <div className="relative aspect-[4/3] overflow-hidden p-5 sm:p-8">
        <div className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${opened ? "pointer-events-none scale-[1.03] opacity-0" : "scale-100 opacity-100"}`}>
          <div className="absolute inset-5 overflow-hidden rounded-[1.8rem] border border-stone-200/70 bg-[#ede3d3] shadow-[0_20px_50px_rgba(117,93,63,0.08)] dark:border-stone-700 dark:bg-[#2f271f] sm:inset-8">
            <Image
              src={previewImage}
              alt="乡村记忆信封预览"
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
              priority={false}
            />

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,241,232,0.16)_0%,rgba(247,241,232,0.34)_100%)] dark:bg-[linear-gradient(180deg,rgba(36,30,25,0.18)_0%,rgba(36,30,25,0.38)_100%)]" />

            <div className="absolute inset-0 flex items-center justify-center px-6">
              <button
                type="button"
                onClick={() => setOpened(true)}
                className="group relative rounded-full border border-[#d7b788] bg-[linear-gradient(180deg,#f3dbb6_0%,#ddb277_100%)] px-7 py-3 text-base font-semibold tracking-[0.08em] text-[#6e4e2b] shadow-[0_12px_30px_rgba(121,90,51,0.18)] transition-all hover:scale-[1.03] hover:shadow-[0_16px_36px_rgba(121,90,51,0.22)] focus:outline-none focus:ring-2 focus:ring-[#d7b788]/60 dark:border-[#ac834b] dark:bg-[linear-gradient(180deg,#d7b277_0%,#a5743e_100%)] dark:text-[#fff4e0]"
                aria-label="查看回忆图片"
              >
                查看回忆
              </button>
            </div>

            <div className="absolute bottom-8 left-1/2 w-full max-w-sm -translate-x-1/2 px-6 text-center text-sm text-stone-500 dark:text-stone-300">
              点击可以查看回忆图片
            </div>
          </div>
        </div>

        <div className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${opened ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}>
          <div className="relative h-full overflow-hidden rounded-[2rem]">
            <Image
              src={displayAfter}
              alt="乡村记忆修复图"
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              quality={100}
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
