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
      whileHover={{ 
        y: -10,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      viewport={{ once: true }}
      className="bg-white dark:bg-stone-900 rounded-2xl overflow-hidden shadow-sm border border-stone-200 dark:border-stone-800 group hover:shadow-2xl transition-all duration-300"
    >
      <Link href={`/memories/${id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* Background Overlay on Hover */}
          <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 z-10 transition-colors duration-500" />
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            className="w-full h-full"
          >
            <Image 
              src={displayImage} 
              alt={title} 
              fill 
              className="object-cover"
            />
          </motion.div>
          
          <div className="absolute top-4 left-4 z-20">
            <span className="px-3 py-1 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm text-stone-900 dark:text-stone-50 text-[10px] font-bold rounded-full shadow-sm tracking-widest uppercase">
              {category}
            </span>
          </div>
        </div>
        
        <div className="p-6 relative">
          <div className="flex items-center gap-2 text-stone-400 text-[10px] mb-3 font-bold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-900 dark:bg-stone-100" />
            <span>{location}</span>
          </div>
          <h3 className="text-xl font-bold mb-3 text-stone-900 dark:text-stone-50 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors line-clamp-1">{title}</h3>
          <p className="text-stone-500 dark:text-stone-400 text-sm line-clamp-2 leading-relaxed mb-6">
            {excerpt}
          </p>
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 text-xs font-black uppercase tracking-widest">
            <span className="relative overflow-hidden inline-block">
              阅读全文
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-current translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-300" />
            </span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              →
            </motion.span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
