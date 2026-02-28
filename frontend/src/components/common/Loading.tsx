"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const TIPS = [
  "YouTube Data API로 댓글을 수집하고 있어요.",
  "Gemini AI가 각 댓글의 독성을 분석 중입니다.",
  "한국어 초성 욕설, 변형 표현도 정확히 감지합니다.",
  "혐오, 괴롭힘, 위협 등 7가지 카테고리로 분류합니다.",
  "인플루언서를 위한 대응 제안도 함께 제공됩니다.",
  "댓글이 많을수록 분석에 시간이 조금 더 걸려요.",
];

interface LoadingProps {
  progress?: number;
}

export default function Loading({ progress }: LoadingProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-5xl mb-8"
      >
        🛡️
      </motion.div>

      <h2 className="text-xl font-semibold mb-3">
        AI가 댓글을 분석하고 있어요...
      </h2>

      {progress !== undefined && (
        <div className="w-64 h-2 bg-stone-100 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-[var(--accent)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <motion.p
        key={tipIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-sm text-stone-500 text-center max-w-sm"
      >
        {TIPS[tipIndex]}
      </motion.p>
    </div>
  );
}
