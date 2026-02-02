export interface MemoryCardProps {
  id: string;
  title: string;
  category: string;
  location: string;
  imageUrl: string;
  excerpt: string;
}

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PLACEHOLDERS } from "@/lib/constants";

export default function MemoryCard({ id, title, category, location, imageUrl, excerpt }: MemoryCardProps) {
  const displayImage = imageUrl || PLACEHOLDERS.RURAL;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-stone-900 rounded-2xl overflow-hidden shadow-sm border border-stone-200 dark:border-stone-800 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <Link href={`/memories/${id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image 
            src={displayImage} 
            alt={title} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm text-stone-900 dark:text-stone-50 text-xs font-bold rounded-full shadow-sm">
              {category}
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-stone-400 text-xs mb-3">
            <span>📍 {location}</span>
          </div>
          <h3 className="text-xl font-bold mb-3 text-stone-900 dark:text-stone-50 line-clamp-1">{title}</h3>
          <p className="text-stone-500 dark:text-stone-400 text-sm line-clamp-2 leading-relaxed mb-4">
            {excerpt}
          </p>
          <div className="flex items-center text-stone-900 dark:text-stone-100 text-sm font-semibold group-hover:translate-x-1 transition-transform">
            阅读全文 <span>→</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
