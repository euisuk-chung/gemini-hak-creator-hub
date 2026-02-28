"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const STEPS = [
  { label: "댓글 수집 중", desc: "YouTube Data API로 댓글을 가져오고 있어요" },
  { label: "AI 분석 중", desc: "Gemini가 각 댓글의 독성 수준을 평가합니다" },
  { label: "패턴 감지 중", desc: "혐오·욕설·위협 등 7가지 유형으로 분류합니다" },
  { label: "리포트 생성 중", desc: "인플루언서 맞춤 대응 가이드를 준비합니다" },
];

interface LoadingProps {
  progress?: number;
}

export default function Loading({ progress }: LoadingProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStep((prev) => (prev + 1) % STEPS.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--background)" }}
    >
      {/* Animated Shield */}
      <div className="relative mb-10">
        {/* Pulse rings */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{
              border: `2px solid var(--accent)`,
              opacity: 0,
            }}
            animate={{
              scale: [1, 1.8 + i * 0.4],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeOut",
            }}
          />
        ))}
        <motion.div
          className="relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
          style={{ background: "var(--accent)" }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z"/>
          </svg>
        </motion.div>
      </div>

      {/* Step label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          className="text-center mb-8"
        >
          <p className="text-xl font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>
            {STEPS[step].label}
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {STEPS[step].desc}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-64">
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--border-color)" }}
        >
          {progress !== undefined ? (
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--accent)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--accent)", width: "40%" }}
              animate={{ x: ["-100%", "250%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
        {progress !== undefined && (
          <p className="text-xs text-right mt-1.5 font-medium" style={{ color: "var(--text-muted)" }}>
            {progress}%
          </p>
        )}
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-2 mt-6">
        {STEPS.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: i === step ? 20 : 6,
              height: 6,
              background: i === step ? "var(--accent)" : "var(--border-strong)",
            }}
            animate={{ width: i === step ? 20 : 6, background: i === step ? "var(--accent)" : "var(--border-strong)" }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}
