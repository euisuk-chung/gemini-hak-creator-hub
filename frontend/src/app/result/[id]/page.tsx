"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DonutChart from "@/components/analysis/DonutChart";
import type { AnalysisResult } from "@/lib/toxicity-types";
import { TOXICITY_CATEGORIES } from "@/lib/toxicity-constants";

// ─── Icons ───────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IconShield = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z"/>
  </svg>
);

const IconSparkle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/>
  </svg>
);

const IconLightbulb = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6H8.3C6.3 13.7 5 11.5 5 9a7 7 0 0 1 7-7z"/>
  </svg>
);

const IconThumbUp = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
);

const IconChevronDown = ({ rotated }: { rotated?: boolean }) => (
  <svg
    width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform 0.2s", transform: rotated ? "rotate(180deg)" : "rotate(0deg)" }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconYoutube = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#ff0000">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
  </svg>
);

const IconInfo = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ─── Risk Config ──────────────────────────────────────────────
function getRiskConfig(score: number) {
  if (score >= 70) return {
    label: "위험", emoji: "🔴",
    color: "#dc2626", colorLight: "#ef4444",
    bg: "#fef2f2", border: "#fecaca",
    heroBg: "linear-gradient(160deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)",
    heroText: "#fca5a5",
    heroSubText: "#fecaca",
  };
  if (score >= 50) return {
    label: "주의", emoji: "🟠",
    color: "#d97706", colorLight: "#f59e0b",
    bg: "#fffbeb", border: "#fde68a",
    heroBg: "linear-gradient(160deg, #78350f 0%, #92400e 50%, #b45309 100%)",
    heroText: "#fcd34d",
    heroSubText: "#fde68a",
  };
  if (score >= 30) return {
    label: "보통", emoji: "🔵",
    color: "#2563eb", colorLight: "#3b82f6",
    bg: "#eff6ff", border: "#bfdbfe",
    heroBg: "linear-gradient(160deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)",
    heroText: "#93c5fd",
    heroSubText: "#bfdbfe",
  };
  return {
    label: "안전", emoji: "🟢",
    color: "#059669", colorLight: "#10b981",
    bg: "#ecfdf5", border: "#a7f3d0",
    heroBg: "linear-gradient(160deg, #064e3b 0%, #065f46 50%, #047857 100%)",
    heroText: "#6ee7b7",
    heroSubText: "#a7f3d0",
  };
}

// ─── Date helpers ─────────────────────────────────────────────
const formatDate = (s: string) => {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
  } catch { return "—"; }
};

const getTimeAgo = (s: string) => {
  if (!s) return "—";
  try {
    const diff = Date.now() - new Date(s).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "방금 전";
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
  } catch { return "—"; }
};

// ─── Section Header ───────────────────────────────────────────
function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent)", opacity: 0.8 }}>
        {eyebrow}
      </p>
      <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
      {sub && <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

// ─── Risk Score Ring ──────────────────────────────────────────
function RiskRing({ score, heroText }: { score: number; heroText: string }) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score, 100) / 100;

  return (
    <div className="relative w-44 h-44">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        {/* track */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" />
        {/* progress */}
        <circle
          cx="80" cy="80" r={radius} fill="none"
          stroke="rgba(255,255,255,0.9)" strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${pct * circumference} ${circumference}`}
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black leading-none text-white" style={{ letterSpacing: "-0.03em" }}>{score}</span>
        <span className="text-xs font-semibold mt-1" style={{ color: heroText }}>/ 100</span>
      </div>
    </div>
  );
}

// ─── Severity Distribution ────────────────────────────────────
const SEVERITY_LEVELS = [
  { key: "criticalCount" as const, label: "매우 심각", color: "#dc2626" },
  { key: "severeCount"   as const, label: "심각",     color: "#ea580c" },
  { key: "moderateCount" as const, label: "보통",     color: "#d97706" },
  { key: "mildCount"     as const, label: "경미",     color: "#16a34a" },
  { key: "safeCount"     as const, label: "안전",     color: "#059669" },
];

function SeverityDistribution({ summary, total }: { summary: AnalysisResult["summary"]; total: number }) {
  const levels = SEVERITY_LEVELS.map((lv) => ({
    ...lv,
    count: summary[lv.key] ?? 0,
  })).filter((lv) => lv.count > 0);

  if (levels.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-6 sm:p-8"
      style={{ background: "var(--surface)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}
    >
      <SectionHeader
        eyebrow="심각도 분석"
        title="댓글 심각도 분포"
        sub={`분석된 ${total.toLocaleString()}개 댓글의 독성 수준별 분류`}
      />

      {/* Stacked bar */}
      <div className="flex h-5 rounded-xl overflow-hidden mb-6" style={{ gap: "2px" }}>
        {levels.map((lv) => (
          <div
            key={lv.key}
            title={`${lv.label}: ${lv.count}개 (${Math.round((lv.count / total) * 100)}%)`}
            style={{
              width: `${(lv.count / total) * 100}%`,
              background: lv.color,
              transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
              minWidth: lv.count > 0 ? 4 : 0,
            }}
          />
        ))}
      </div>

      {/* Legend cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {levels.map((lv) => {
          const pct = total > 0 ? Math.round((lv.count / total) * 100) : 0;
          return (
            <div
              key={lv.key}
              className="rounded-xl p-3.5 flex flex-col gap-2"
              style={{ background: `${lv.color}08`, border: `1px solid ${lv.color}20` }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: lv.color }} />
                <span className="text-xs font-semibold" style={{ color: lv.color }}>{lv.label}</span>
              </div>
              <p className="text-2xl font-black leading-none" style={{ color: lv.color, letterSpacing: "-0.02em" }}>
                {lv.count.toLocaleString()}
              </p>
              <p className="text-xs font-medium" style={{ color: lv.color, opacity: 0.65 }}>{pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI Insight Card ──────────────────────────────────────────
function InsightCard({ insight }: { insight: string }) {
  if (!insight) return null;
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid #c4b5fd", boxShadow: "0 0 0 4px rgba(109,40,217,0.06), var(--shadow-sm)" }}
    >
      {/* Header strip */}
      <div
        className="px-6 py-3 flex items-center gap-2.5"
        style={{ background: "linear-gradient(90deg, #6d28d9, #7c3aed)", borderBottom: "1px solid #c4b5fd" }}
      >
        <div className="w-6 h-6 flex items-center justify-center" style={{ color: "#e9d5ff" }}>
          <IconSparkle />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-white">Gemini AI 분석 인사이트</span>
      </div>

      {/* Body */}
      <div className="p-6 sm:p-8" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)" }}>
        <p className="text-base leading-relaxed" style={{ color: "#3b0764", lineHeight: "1.75" }}>
          {insight}
        </p>
      </div>
    </div>
  );
}

// ─── Comment Card ─────────────────────────────────────────────
function CommentCard({ comment }: { comment: AnalysisResult["maliciousComments"][0] }) {
  const [expanded, setExpanded] = useState(false);
  const categoryObj = TOXICITY_CATEGORIES.find((c) => c.id === comment.categories[0]);
  const categoryName = categoryObj?.nameKo || comment.categories[0] || "기타";
  const color = categoryObj?.color || "#6b7280";
  const hasDetail = !!(comment.explanation || comment.suggestion);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-shadow"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border-color)" }}
    >
      <div className="flex">
        {/* Left color bar */}
        <div className="w-1 flex-shrink-0" style={{ background: color }} />

        <div className="flex-1 p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: color }}
              >
                {comment.author.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                  {comment.author}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {getTimeAgo(comment.publishedAt)}
                  </span>
                  {comment.likeCount > 0 && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      <IconThumbUp />
                      {comment.likeCount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Category badge + Score */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
              >
                {categoryName}
              </span>
              <span
                className="text-xs font-black tabular-nums w-9 h-7 flex items-center justify-center rounded-lg"
                style={{ background: `${color}15`, color }}
              >
                {comment.toxicityScore}
              </span>
            </div>
          </div>

          {/* Comment text */}
          <p
            className="text-sm leading-relaxed px-1"
            style={{
              color: "var(--text-secondary)",
              borderLeft: `2px solid ${color}40`,
              paddingLeft: "10px",
            }}
          >
            {comment.text}
          </p>

          {/* Toxicity progress */}
          <div className="mt-3 flex items-center gap-2.5">
            <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)", minWidth: "40px" }}>독성</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-color)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(comment.toxicityScore, 100)}%`, background: color }}
              />
            </div>
            <span className="text-xs font-bold flex-shrink-0" style={{ color }}>{comment.toxicityScore}%</span>
          </div>

          {/* Expand button */}
          {hasDetail && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3.5 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: expanded ? `${color}12` : "var(--surface-3)",
                color: expanded ? color : "var(--text-muted)",
                border: `1px solid ${expanded ? color + "30" : "var(--border-color)"}`,
              }}
            >
              <IconChevronDown rotated={expanded} />
              {expanded ? "분석 내용 접기" : "AI 분석 상세 보기"}
            </button>
          )}

          {/* Expanded panel */}
          {expanded && hasDetail && (
            <div className="mt-3 space-y-2.5">
              {comment.explanation && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-color)" }}
                >
                  <p className="text-xs font-bold mb-2 flex items-center gap-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    <IconInfo />
                    분석 이유
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {comment.explanation}
                  </p>
                </div>
              )}
              {comment.suggestion && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0" }}
                >
                  <p className="text-xs font-bold mb-2 flex items-center gap-1.5 uppercase tracking-wide" style={{ color: "#15803d" }}>
                    <IconLightbulb />
                    대안 표현 제안
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#14532d" }}>
                    {comment.suggestion}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function ResultPage() {
  const params = useParams();
  const id = params.id as string;
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [videoDetail, setVideoDetail] = useState<{
    thumbnailUrl: string;
    viewCount: number;
    publishedAt: string;
  } | null>(null);

  useEffect(() => {
    async function fetchResult() {
      try {
        let data: { result: AnalysisResult } | null = null;
        try {
          const cached = sessionStorage.getItem(`result-${id}`);
          if (cached) data = JSON.parse(cached);
        } catch { /* ignore */ }

        if (!data) {
          const res = await fetch(`/api/result/${id}`);
          if (!res.ok) throw new Error("결과를 찾을 수 없습니다. 새로 분석해 주세요.");
          data = await res.json();
        }

        setResult(data!.result);

        try {
          const videoRes = await fetch("/api/youtube/fetch-test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoUrl: `https://youtube.com/watch?v=${data!.result.videoId}`,
              targets: ["detail"],
            }),
          });
          const videoData = await videoRes.json();
          if (videoData.results?.detail) {
            setVideoDetail({
              thumbnailUrl: videoData.results.detail.thumbnailUrl || "",
              viewCount: videoData.results.detail.viewCount || 0,
              publishedAt: videoData.results.detail.publishedAt || "",
            });
          }
        } catch { /* non-critical */ }
      } catch (err) {
        setError(err instanceof Error ? err.message : "결과를 불러올 수 없습니다.");
      }
    }
    fetchResult();
  }, [id]);

  // ── Error State ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--background)" }}>
        <div
          className="max-w-md w-full rounded-2xl p-10 text-center"
          style={{ background: "var(--surface)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-lg)" }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "#fef2f2" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>결과를 찾을 수 없어요</h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
            style={{ background: "var(--accent)", boxShadow: "0 4px 12px rgba(109,40,217,0.3)" }}
          >
            <IconRefresh /> 다시 분석하기
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading State ──
  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent mx-auto mb-4 animate-spin"
            style={{ borderColor: "var(--border-color)", borderTopColor: "var(--accent)" }}
          />
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const { summary, maliciousComments } = result;
  const toxicCount = result.toxicComments   ?? maliciousComments.length;
  const cleanCount = result.cleanComments   ?? (result.totalComments - maliciousComments.length);
  const toxicPct   = result.toxicPercentage ?? (
    result.totalComments > 0 ? Math.round((maliciousComments.length / result.totalComments) * 100) : 0
  );
  const cleanPct   = result.cleanPercentage ?? (result.totalComments > 0 ? Math.round(100 - toxicPct) : 0);
  const riskConfig = getRiskConfig(summary.overallToxicityScore);

  const categoryData = summary.categoryBreakdown
    .map((cb) => {
      const cat = TOXICITY_CATEGORIES.find((c) => c.id === cb.category);
      return { id: cb.category, label: cat?.nameKo || cb.category, value: cb.count, color: cat?.color || "#6b7280" };
    })
    .filter((d) => d.value > 0);

  const filteredComments = selectedCategory
    ? maliciousComments.filter((c) => c.categories.includes(selectedCategory as AnalysisResult["maliciousComments"][0]["categories"][0]))
    : maliciousComments;

  const handleCategorySelect = (id: string | null) => {
    setSelectedCategory(id);
    setShowAll(false);
    if (id) {
      setTimeout(() => {
        document.getElementById("comment-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const displayedComments = showAll ? filteredComments : filteredComments.slice(0, 5);
  const selectedCategoryMeta = selectedCategory ? categoryData.find((c) => c.id === selectedCategory) : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Hero (Dark, full-bleed) ── */}
      <div style={{ background: riskConfig.heroBg }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Nav */}
          <div className="flex items-center justify-between py-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: riskConfig.heroSubText }}
            >
              <IconArrowLeft />
              홈으로
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-opacity hover:opacity-90"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
              }}
            >
              <IconRefresh />
              새로 분석
            </Link>
          </div>

          {/* Score section */}
          <div className="pt-4 pb-10 flex flex-col sm:flex-row items-center gap-8">
            {/* Ring */}
            <div className="flex-shrink-0">
              <RiskRing score={summary.overallToxicityScore} heroText={riskConfig.heroSubText} />
            </div>

            {/* Text */}
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: riskConfig.heroSubText, opacity: 0.7 }}>
                댓글 독성 분석 리포트
              </p>
              <h1 className="text-3xl sm:text-4xl font-black leading-tight text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
                댓글 환경이<br />
                <span style={{ color: riskConfig.heroText }}>&quot;{riskConfig.label}&quot; 수준</span>입니다
              </h1>
              <p className="text-sm" style={{ color: riskConfig.heroSubText }}>
                {riskConfig.emoji} {result.totalComments.toLocaleString()}개 댓글 중 AI가 {result.analyzedComments.toLocaleString()}개 분석 완료
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">

        {/* Video + Stats card — overlaps hero */}
        <div
          className="rounded-2xl overflow-hidden -mt-5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* Video info */}
          <div className="p-5 sm:p-6">
            <div className="flex gap-4 items-start">
              {videoDetail?.thumbnailUrl ? (
                <img
                  src={videoDetail.thumbnailUrl}
                  alt="thumbnail"
                  className="w-24 h-16 sm:w-28 sm:h-18 object-cover rounded-xl flex-shrink-0"
                  style={{ boxShadow: "var(--shadow-md)" }}
                />
              ) : (
                <div
                  className="w-24 h-16 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: "var(--surface-3)" }}
                >
                  <IconYoutube />
                </div>
              )}
              <div className="min-w-0 flex-1 py-0.5">
                <h2
                  className="font-bold leading-snug break-words"
                  style={{ color: "var(--text-primary)", fontSize: "0.9375rem" }}
                >
                  {result.videoTitle}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  {result.channelTitle && (
                    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      <IconYoutube />
                      {result.channelTitle}
                    </span>
                  )}
                  {videoDetail?.publishedAt && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatDate(videoDetail.publishedAt)} 게시
                    </span>
                  )}
                  {videoDetail?.viewCount ? (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      조회 {videoDetail.viewCount.toLocaleString()}회
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 border-t" style={{ borderColor: "var(--border-color)" }}>
            {[
              { label: "총 댓글", value: result.totalComments.toLocaleString(), sub: null, color: "var(--text-primary)", highlight: false },
              { label: "정상 댓글", value: cleanCount.toLocaleString(), sub: `${cleanPct}%`, color: "var(--success)", highlight: false },
              { label: "악성 댓글", value: toxicCount.toLocaleString(), sub: `${toxicPct}%`, color: "var(--danger)", highlight: true },
              { label: "분석 댓글", value: result.analyzedComments.toLocaleString(), sub: null, color: "var(--text-secondary)", highlight: false },
            ].map((s, i) => (
              <div
                key={s.label}
                className="py-4 px-3 sm:px-5 text-center flex flex-col gap-1"
                style={{
                  borderLeft: i > 0 ? "1px solid var(--border-color)" : undefined,
                  background: s.highlight ? "var(--danger-light)" : undefined,
                }}
              >
                <p className="text-xs" style={{ color: s.highlight ? "var(--danger)" : "var(--text-muted)" }}>{s.label}</p>
                <p className="text-xl font-black leading-none" style={{ color: s.color, letterSpacing: "-0.02em" }}>
                  {s.value}
                </p>
                {s.sub && (
                  <p className="text-xs font-bold" style={{ color: s.color, opacity: 0.7 }}>{s.sub}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Body sections ── */}
        <div className="mt-5 space-y-5">

          {/* AI Insight */}
          {summary.insight && <InsightCard insight={summary.insight} />}

          {/* Severity Distribution */}
          <SeverityDistribution summary={summary} total={result.analyzedComments} />

          {/* Category Donut */}
          {categoryData.length > 0 && (
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{ background: "var(--surface)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}
            >
              <SectionHeader
                eyebrow="유형 분류"
                title="악성 댓글 카테고리"
                sub={`${toxicCount}개 악성 댓글 · ${categoryData.length}개 유형으로 분류`}
              />
              {/* 도넛 + 레전드 레이아웃 */}
              {(() => {
                // map 밖에서 한 번만 계산
                const totalCategorySum = categoryData.reduce((s, d) => s + d.value, 0);
                return (
                  <div className="flex flex-col lg:flex-row gap-6 lg:items-start">

                    {/* 도넛 차트 */}
                    <div className="w-full max-w-[260px] mx-auto lg:mx-0 lg:w-[260px] lg:flex-shrink-0">
                      <DonutChart
                        data={categoryData}
                        selectedId={selectedCategory}
                        onSelect={handleCategorySelect}
                      />
                    </div>

                    {/* 카테고리 레전드
                        - flex-1 min-w-0: flex-row에서 남은 공간 차지, 오버플로 방지
                        - w-full 제거: flex-1과 충돌하던 원인 */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[...categoryData].sort((a, b) => b.value - a.value).map((item) => {
                        const pct = totalCategorySum > 0
                          ? Math.min(Math.round((item.value / totalCategorySum) * 100), 100)
                          : 0;
                        const isSelected = selectedCategory === item.id;
                        const isDimmed   = selectedCategory !== null && !isSelected;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleCategorySelect(isSelected ? null : item.id)}
                            className="w-full flex items-start gap-3 px-3.5 py-3 rounded-xl text-left"
                            style={{
                              background: isSelected ? `${item.color}10` : "var(--surface-2)",
                              border: isSelected ? `1.5px solid ${item.color}60` : "1px solid var(--border-color)",
                              opacity: isDimmed ? 0.35 : 1,
                              cursor: "pointer",
                              transition: "opacity 0.15s ease, border-color 0.15s ease, background 0.15s ease",
                            }}
                          >
                            {/* 색상 도트 — items-start이므로 mt-[3px]으로 텍스트 baseline 맞춤 */}
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-[3px]"
                              style={{ background: item.color }}
                            />
                            {/* 콘텐츠 — min-w-0 필수 (truncate가 flex child에서 작동하려면) */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                                  {item.label}
                                </p>
                                <span
                                  className="text-xs font-bold flex-shrink-0 tabular-nums"
                                  style={{ color: item.color }}
                                >
                                  {item.value}건
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                                  style={{ background: "var(--border-color)" }}
                                >
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${pct}%`,
                                      background: item.color,
                                      transition: "width 0.5s ease",
                                    }}
                                  />
                                </div>
                                <span
                                  className="text-xs tabular-nums flex-shrink-0 w-8 text-right"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {pct}%
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              {selectedCategory && (
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={() => handleCategorySelect(null)}
                    className="text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all hover:opacity-80"
                    style={{ background: "var(--surface-3)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    필터 초기화
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Malicious Comments */}
          {maliciousComments.length > 0 && (
            <div
              id="comment-section"
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}
            >
              {/* Section header */}
              <div className="px-6 sm:px-8 pt-6 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <SectionHeader
                    eyebrow="댓글 목록"
                    title="악성 댓글 상세"
                    sub={
                      showAll
                        ? `전체 ${filteredComments.length}개 표시 중`
                        : `상위 ${Math.min(5, filteredComments.length)}개 표시 · 카드를 눌러 AI 분석 확인`
                    }
                  />
                  <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                    {selectedCategoryMeta && (
                      <button
                        onClick={() => handleCategorySelect(null)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all"
                        style={{
                          background: `${selectedCategoryMeta.color}12`,
                          color: selectedCategoryMeta.color,
                          border: `1px solid ${selectedCategoryMeta.color}30`,
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: selectedCategoryMeta.color }} />
                        {selectedCategoryMeta.label}
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                    <span
                      className="px-2.5 py-1.5 rounded-full text-xs font-black"
                      style={{ background: "var(--danger-light)", color: "var(--danger)" }}
                    >
                      {filteredComments.length}개
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="px-4 sm:px-6 pb-6 space-y-3"
                style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}
              >
                {filteredComments.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>해당 카테고리의 악성 댓글이 없습니다</p>
                  </div>
                ) : (
                  <>
                    {displayedComments.map((comment) => (
                      <CommentCard key={comment.commentId} comment={comment} />
                    ))}
                    {filteredComments.length > 5 && (
                      <button
                        onClick={() => setShowAll(!showAll)}
                        className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--border-color)",
                          color: "var(--accent)",
                        }}
                      >
                        {showAll
                          ? "△ 접기"
                          : `나머지 ${filteredComments.length - 5}개 더 보기 ↓`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div
            className="rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border-color)" }}
          >
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>다른 영상도 분석해 보세요</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>YouTube URL을 입력하면 AI가 댓글을 자동으로 분석합니다</p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white flex-shrink-0 transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)", boxShadow: "0 4px 14px rgba(109,40,217,0.3)" }}
            >
              <IconRefresh />
              새로 분석하기
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
