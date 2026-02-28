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

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z"/>
  </svg>
);

const IconComment = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconWarning = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconPercent = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

// ─── Risk Helpers ─────────────────────────────────────────────
function getRiskConfig(score: number) {
  if (score >= 70) return { label: "위험", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", track: "#fca5a5" };
  if (score >= 50) return { label: "주의", color: "#d97706", bg: "#fffbeb", border: "#fde68a", track: "#fcd34d" };
  if (score >= 30) return { label: "보통", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", track: "#93c5fd" };
  return { label: "안전", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", track: "#6ee7b7" };
}

// ─── Date helpers ─────────────────────────────────────────────
const formatDate = (s: string) => {
  if (!s) return "—";
  try { return new Date(s).toISOString().split("T")[0]; } catch { return "—"; }
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

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  valueColor,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: accent ? "var(--accent)" : "var(--surface)",
        border: accent ? "none" : "1px solid var(--border-color)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: accent ? "rgba(255,255,255,0.15)" : "var(--surface-3)" }}
      >
        <span style={{ color: accent ? "#fff" : "var(--text-secondary)" }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-medium mb-0.5" style={{ color: accent ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>
          {label}
        </p>
        <p className="text-2xl font-bold" style={{ color: accent ? "#fff" : (valueColor || "var(--text-primary)") }}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Risk Score Ring ──────────────────────────────────────────
function RiskRing({ score }: { score: number }) {
  const config = getRiskConfig(score);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score, 100) / 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--border-color)" strokeWidth="12" />
          <circle
            cx="64" cy="64" r={radius} fill="none"
            stroke={config.color} strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${pct * circumference} ${circumference}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color: config.color }}>{score}</span>
          <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>/ 100</span>
        </div>
      </div>
      <span
        className="mt-3 px-4 py-1 rounded-full text-sm font-semibold"
        style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
      >
        {config.label}
      </span>
    </div>
  );
}

// ─── Comment Card ────────────────────────────────────────────
function CommentCard({ comment, index }: { comment: AnalysisResult["maliciousComments"][0]; index: number }) {
  const categoryObj = TOXICITY_CATEGORIES.find((c) => c.id === comment.categories[0]);
  const categoryName = categoryObj?.nameKo || comment.categories[0] || "기타";
  const color = categoryObj?.color || "#6b7280";

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border-color)" }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: `${color}cc` }}
        >
          {comment.author.charAt(0).toUpperCase()}
        </div>
        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          {comment.author}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {getTimeAgo(comment.publishedAt)}
        </span>
        <span
          className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: `${color}18`, color: color }}
        >
          {categoryName}
        </span>
      </div>

      {/* Comment text */}
      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
        {comment.text}
      </p>

      {/* Toxicity bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>독성 점수</span>
          <span className="text-xs font-bold" style={{ color: color }}>{comment.toxicityScore}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-color)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(comment.toxicityScore, 100)}%`,
              background: color,
            }}
          />
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
        const res = await fetch(`/api/result/${id}`);
        if (!res.ok) throw new Error("결과를 찾을 수 없습니다.");
        const data = await res.json();
        setResult(data.result);

        try {
          const videoRes = await fetch("/api/youtube/fetch-test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoUrl: `https://youtube.com/watch?v=${data.result.videoId}`,
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
        } catch {
          // 영상 상세는 non-critical
        }
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "var(--danger-light)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>결과를 찾을 수 없어요</h2>
            <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>{error}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all"
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
            <div className="w-12 h-12 rounded-full border-4 border-t-transparent mx-auto mb-4 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--accent)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>결과를 불러오는 중...</p>
          </div>
      </div>
    );
  }

  const { summary, maliciousComments } = result;
  const maliciousRatio = result.totalComments > 0
    ? Math.round((maliciousComments.length / result.totalComments) * 100)
    : 0;
  const riskConfig = getRiskConfig(summary.overallToxicityScore);

  const categoryData = summary.categoryBreakdown
    .map((cb) => {
      const cat = TOXICITY_CATEGORIES.find((c) => c.id === cb.category);
      return { id: cb.category, label: cat?.nameKo || cb.category, value: cb.count, color: cat?.color || "#6b7280" };
    })
    .filter((d) => d.value > 0);

  // 카테고리 필터 적용
  const filteredComments = selectedCategory
    ? maliciousComments.filter((c) => c.categories.includes(selectedCategory as AnalysisResult["maliciousComments"][0]["categories"][0]))
    : maliciousComments;

  const handleCategorySelect = (id: string | null) => {
    setSelectedCategory(id);
    setShowAll(false);
    if (id) {
      // 댓글 목록으로 스크롤
      setTimeout(() => {
        document.getElementById("comment-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const displayedComments = showAll ? filteredComments : filteredComments.slice(0, 5);

  // 선택된 카테고리 메타
  const selectedCategoryMeta = selectedCategory
    ? categoryData.find((c) => c.id === selectedCategory)
    : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-10 pb-16 space-y-6">

          {/* ── Page Header ── */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                분석 리포트
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                댓글 독성 분석
              </h1>
            </div>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-all"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <IconArrowLeft />
              새로 분석
            </Link>
          </div>

          {/* ── Hero: Risk Score + Video Info ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}
          >
            {/* Risk Banner */}
            <div className="px-6 py-4 flex items-center gap-3" style={{ background: riskConfig.bg, borderBottom: `1px solid ${riskConfig.border}` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: riskConfig.color }}>
                <IconShield />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: riskConfig.color, opacity: 0.7 }}>위험도 평가</p>
                <p className="text-base font-bold" style={{ color: riskConfig.color }}>
                  이 영상의 댓글 환경은 &quot;{riskConfig.label}&quot; 수준입니다
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Risk Ring */}
                <div className="flex-shrink-0 flex justify-center w-full lg:w-auto">
                  <RiskRing score={summary.overallToxicityScore} />
                </div>

                {/* Divider */}
                <div className="hidden lg:block w-px self-stretch" style={{ background: "var(--border-color)" }} />

                {/* Video + Stats */}
                <div className="flex-1 min-w-0 space-y-5">
                  {/* Video info */}
                  <div className="flex gap-4 items-start">
                    {videoDetail?.thumbnailUrl && (
                      <img
                        src={videoDetail.thumbnailUrl}
                        alt="thumbnail"
                        className="w-24 h-16 object-cover rounded-lg flex-shrink-0 shadow-sm"
                      />
                    )}
                    <div className="min-w-0">
                      <h2 className="text-base font-bold leading-snug break-words" style={{ color: "var(--text-primary)" }}>
                        {result.videoTitle}
                      </h2>
                      {videoDetail?.publishedAt && (
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                          게시일: {formatDate(videoDetail.publishedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stat row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "총 댓글", value: result.totalComments.toLocaleString() },
                      { label: "악성 댓글", value: maliciousComments.length.toLocaleString(), danger: true },
                      { label: "악성 비율", value: `${maliciousRatio}%`, danger: maliciousRatio > 20 },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl p-3 text-center"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border-color)" }}
                      >
                        <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                        <p className="text-xl font-bold" style={{ color: s.danger ? "var(--danger)" : "var(--text-primary)" }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Analyzed count note */}
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    AI가 분석한 댓글: <strong>{result.analyzedComments}개</strong>
                    {videoDetail?.viewCount ? ` · 조회수: ${videoDetail.viewCount.toLocaleString()}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Category Donut ── */}
          {categoryData.length > 0 && (
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{ background: "var(--surface)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}
            >
              <div className="mb-5">
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>유형별 분류</h3>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  악성 댓글 {maliciousComments.length}개를 {categoryData.length}개 카테고리로 분류
                </p>
              </div>
              <div className="flex flex-col lg:flex-row gap-6 items-center">
                <div className="w-full lg:w-[340px] flex-shrink-0">
                  <DonutChart
                    data={categoryData}
                    selectedId={selectedCategory}
                    onSelect={handleCategorySelect}
                  />
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                  {[...categoryData].sort((a, b) => b.value - a.value).map((item) => {
                    const pct = Math.round((item.value / maliciousComments.length) * 100);
                    const isSelected = selectedCategory === item.id;
                    const isDimmed   = selectedCategory !== null && !isSelected;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleCategorySelect(isSelected ? null : item.id)}
                        className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                        style={{
                          background: isSelected ? `${item.color}15` : "var(--surface-2)",
                          border: isSelected
                            ? `1.5px solid ${item.color}`
                            : "1px solid var(--border-color)",
                          opacity: isDimmed ? 0.4 : 1,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: item.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {item.label}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--border-color)" }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }} />
                            </div>
                            <span className="text-xs font-semibold flex-shrink-0" style={{ color: item.color }}>
                              {item.value}건
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* 필터 초기화 힌트 */}
              {selectedCategory && (
                <div className="mt-4 flex items-center justify-center">
                  <button
                    onClick={() => handleCategorySelect(null)}
                    className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all"
                    style={{ background: "var(--surface-3)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    필터 초기화
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Malicious Comments ── */}
          {maliciousComments.length > 0 && (
            <div
              id="comment-section"
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}
            >
              {/* Section header */}
              <div
                className="px-6 sm:px-8 py-5"
                style={{ borderBottom: "1px solid var(--border-color)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>악성 댓글 목록</h3>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {showAll ? `전체 ${filteredComments.length}개` : `상위 ${Math.min(5, filteredComments.length)}개`} 표시 중
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* 활성 카테고리 필터 뱃지 */}
                    {selectedCategoryMeta && (
                      <button
                        onClick={() => handleCategorySelect(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: `${selectedCategoryMeta.color}18`,
                          color: selectedCategoryMeta.color,
                          border: `1px solid ${selectedCategoryMeta.color}40`,
                        }}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ background: selectedCategoryMeta.color }} />
                        {selectedCategoryMeta.label}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                    <span
                      className="px-3 py-1.5 rounded-full text-sm font-bold"
                      style={{ background: "var(--danger-light)", color: "var(--danger)" }}
                    >
                      {filteredComments.length}개
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                {filteredComments.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      해당 카테고리의 악성 댓글이 없습니다
                    </p>
                  </div>
                ) : (
                  <>
                    {displayedComments.map((comment, index) => (
                      <CommentCard key={comment.commentId} comment={comment} index={index} />
                    ))}
                    {/* Show more / less */}
                    {filteredComments.length > 5 && (
                      <button
                        onClick={() => setShowAll(!showAll)}
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--border-color)",
                          color: "var(--accent)",
                        }}
                      >
                        {showAll
                          ? "접기"
                          : `나머지 ${filteredComments.length - 5}개 더 보기`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Bottom CTA ── */}
          <div className="flex justify-center pt-2">
            <Link
              href="/"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all"
              style={{ background: "var(--accent)", boxShadow: "0 4px 14px rgba(109,40,217,0.3)" }}
            >
              <IconRefresh />
              새로 분석하기
            </Link>
          </div>

      </div>
    </div>
  );
}
