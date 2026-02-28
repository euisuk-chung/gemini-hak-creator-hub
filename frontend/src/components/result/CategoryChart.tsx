"use client";

import { motion } from "framer-motion";
import { TOXICITY_CATEGORIES } from "@/lib/toxicity-constants";
import type { ToxicityCategory } from "@/lib/toxicity-types";

interface CategoryChartProps {
  breakdown: { category: ToxicityCategory; count: number }[];
}

export default function CategoryChart({ breakdown }: CategoryChartProps) {
  const data = TOXICITY_CATEGORIES.map((cat) => {
    const match = breakdown.find((b) => b.category === cat.id);
    return { ...cat, count: match?.count ?? 0 };
  }).filter((d) => d.count > 0);

  if (data.length === 0) {
    return (
      <div className="bg-green-50 rounded-2xl p-6 mb-6 text-center">
        <p className="text-green-700 font-medium">
          악성 댓글 유형이 감지되지 않았습니다!
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
      <h3 className="text-sm font-semibold text-stone-600 mb-4">
        악성 댓글 유형 분포
      </h3>
      <div className="space-y-3">
        {data.map((item, index) => {
          const widthPercent = (item.count / maxCount) * 100;
          return (
            <div key={item.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-stone-600">
                  {item.emoji} {item.nameKo}
                </span>
                <span className="text-xs text-stone-400">{item.count}건</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
