"use client";

import Image from "next/image";
import { PLACEHOLDERS } from "@/lib/constants";

interface ImageComparisonProps {
  afterImage?: string;
}

export default function ImageComparison({ afterImage }: ImageComparisonProps) {
  const displayAfter = afterImage || PLACEHOLDERS.AI_RESTORED;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-[linear-gradient(180deg,#f7f1e8_0%,#efe6d8_100%)] shadow-[0_28px_80px_rgba(124,101,74,0.14)] dark:border-stone-700 dark:bg-[linear-gradient(180deg,#2d261f_0%,#241e19_100%)]">
      <div className="relative aspect-[4/3] overflow-hidden p-5 sm:p-8">
        <div className="relative h-full overflow-hidden rounded-[2rem]">
          <Image
            src={displayAfter}
            alt="rural image renderer"
            fill
            sizes="(max-width: 1024px) 100vw, 66vw"
            quality={100}
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
