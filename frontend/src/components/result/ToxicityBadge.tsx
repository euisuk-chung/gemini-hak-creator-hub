"use client";

import { motion } from "framer-motion";
import { getLevelMeta } from "@/lib/toxicity-constants";
import type { ToxicityLevel } from "@/lib/toxicity-types";

interface ToxicityBadgeProps {
  level: ToxicityLevel;
  score: number;
}

export default function ToxicityBadge({ level, score }: ToxicityBadgeProps) {
  const meta = getLevelMeta(level);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="text-center mb-6"
    >
      <div className="text-6xl mb-3">{meta.emoji}</div>
      <h2
        className="text-2xl font-bold mb-1"
        style={{ color: meta.color }}
      >
        {meta.nameKo}
      </h2>
      <p className="text-sm text-stone-500">
        전체 독성 점수: <span className="font-semibold" style={{ color: meta.color }}>{score}점</span>
      </p>
    </motion.div>
  );
}
