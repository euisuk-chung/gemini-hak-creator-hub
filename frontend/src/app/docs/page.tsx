"use client";

import { motion } from "framer-motion";
import { TOXICITY_CATEGORIES, TOXICITY_LEVELS } from "@/lib/toxicity-constants";

// ─── Section Header ──────────────────────────────────────────
function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>
        {eyebrow}
      </p>
      <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h2>
      {sub && (
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Pipeline Step Card ──────────────────────────────────────
function PipelineStep({
  step,
  title,
  description,
  details,
  accentColor,
}: {
  step: number;
  title: string;
  description: string;
  details: string[];
  accentColor: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 sm:p-6 relative overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="absolute top-0 left-0 w-1 h-full" style={{ background: accentColor }} />
      <div className="flex items-start gap-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          {step}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            {title}
          </h3>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
          <ul className="space-y-1.5">
            {details.map((d, i) => (
              <li key={i} className="text-xs leading-relaxed flex items-start gap-2" style={{ color: "var(--text-muted)" }}>
                <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0" style={{ background: accentColor }} />
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Arrow connector ─────────────────────────────────────────
function ArrowDown() {
  return (
    <div className="flex justify-center py-1">
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
        <path d="M10 0v20M4 16l6 6 6-6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────
export default function DocsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, var(--accent), #4c1d95)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 lg:pt-12 pb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Documentation</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              분석 시스템 문서
            </h1>
            <p className="text-sm text-white/70 mt-2 max-w-lg">
              YouTube Shield가 댓글을 분석하는 방법과 독성 분류 체계를 설명합니다.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 -mt-4">
        <div className="space-y-6">

          {/* ── 섹션 1: 분류 카테고리 ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <SectionHeader
              eyebrow="Categories"
              title="독성 댓글 분류 카테고리"
              sub="한국 인터넷 문화 및 K-POP 엔터테인먼트 맥락에 특화된 10가지 분류 체계"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TOXICITY_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-xl p-4 relative overflow-hidden"
                  style={{
                    background: `${cat.color}08`,
                    border: `1px solid ${cat.color}20`,
                  }}
                >
                  <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: cat.color }} />
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-sm font-bold" style={{ color: cat.color }}>
                      {cat.nameKo}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {cat.description}
                  </p>
                  <p
                    className="text-[10px] font-mono mt-2 px-1.5 py-0.5 rounded inline-block"
                    style={{ background: `${cat.color}12`, color: cat.color }}
                  >
                    {cat.id}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── 섹션 2: 평가 파이프라인 ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <SectionHeader
              eyebrow="Pipeline"
              title="2단계 분석 파이프라인"
              sub="효율성과 정확도를 모두 확보하는 하이브리드 분석 구조"
            />

            <PipelineStep
              step={1}
              title="Rule-based Pre-screen"
              description="한국어 비속어 사전과 정규식 패턴을 활용한 사전 필터링 단계입니다."
              details={[
                "15개 이상의 정규식 규칙으로 한국어 비속어, 초성 축약, 변형 표현 탐지",
                "각 규칙이 카테고리(PROFANITY, THREAT 등)와 기본 점수를 부여",
                "점수가 임계값(20점) 이하이고 카테고리가 없으면 → AI 분석 건너뛰기 (비용 절감)",
                "명확한 독성 표현은 빠르게 사전 분류하여 처리 속도 향상",
              ]}
              accentColor="#3B82F6"
            />

            <ArrowDown />

            <PipelineStep
              step={2}
              title="Gemini LLM 정밀 분석"
              description="Google Gemini 2.5 Flash 모델을 활용한 AI 기반 정밀 독성 분석 단계입니다."
              details={[
                "영상 트랜스크립트(맥락)와 댓글을 함께 분석하여 문맥 기반 판단",
                "0~100 독성 점수, 카테고리, 설명, 순화 제안을 JSON으로 반환",
                "반어법·은유·초성 등 한국어 특수 표현도 정확히 분석",
                "Rule 단계에서 걸러지지 않은 미묘한 독성 표현까지 탐지",
              ]}
              accentColor="var(--accent)"
            />
          </motion.div>

          {/* ── 섹션 3: 독성 레벨 ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <SectionHeader
              eyebrow="Scoring"
              title="독성 점수 및 레벨 체계"
              sub="0~100 점수를 5단계 레벨로 분류합니다"
            />

            <div className="space-y-2.5">
              {TOXICITY_LEVELS.map((level) => (
                <div
                  key={level.id}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: `${level.color}08`,
                    border: `1px solid ${level.color}18`,
                  }}
                >
                  <span className="text-lg">{level.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold" style={{ color: level.color }}>
                        {level.nameKo}
                      </span>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: `${level.color}12`, color: level.color }}
                      >
                        {level.scoreRange[0]}–{level.scoreRange[1]}점
                      </span>
                    </div>
                    {/* Score bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: `${level.color}15` }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${level.scoreRange[1]}%`,
                          background: level.color,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── 섹션 4: 출력 형식 ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <SectionHeader
              eyebrow="Output"
              title="분석 결과 구조"
              sub="각 댓글에 대해 아래 정보가 생성됩니다"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "독성 점수", desc: "0~100 사이의 정수. 높을수록 위험", icon: "📊" },
                { label: "독성 레벨", desc: "점수에 따른 5단계 등급 (safe ~ critical)", icon: "🏷️" },
                { label: "카테고리", desc: "해당하는 독성 유형 (복수 가능)", icon: "📂" },
                { label: "설명", desc: "왜 독성으로 판단했는지 한국어 근거", icon: "💡" },
                { label: "순화 제안", desc: "독성 표현을 건전하게 바꾼 대안 문장", icon: "✏️" },
                { label: "분석 소스", desc: "Rule 기반인지 LLM 분석인지 출처 표시", icon: "🔍" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <span className="text-base mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {item.label}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
