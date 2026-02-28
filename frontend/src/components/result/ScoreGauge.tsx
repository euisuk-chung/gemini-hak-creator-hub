"use client";

import { motion } from "framer-motion";

interface ScoreGaugeProps {
  score: number;
  label?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#991B1B";
  if (score >= 60) return "#EF4444";
  if (score >= 40) return "#F59E0B";
  if (score >= 20) return "#3B82F6";
  return "#10B981";
}

export default function ScoreGauge({ score, label = "독성 점수" }: ScoreGaugeProps) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#e7e5e4"
            strokeWidth="10"
          />
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-bold"
            style={{ color }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-stone-400">/ 100</span>
        </div>
      </div>
      <p className="text-sm text-stone-500 mt-2">{label}</p>
    </div>
  );
}
