"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ApiKeyForm from "@/components/setup/ApiKeyForm";
import VideoInput from "@/components/setup/VideoInput";
import Loading from "@/components/common/Loading";

// ─── Icons ───────────────────────────────────────────────────
const IconShield = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z"/>
  </svg>
);

const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconKey = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const IconChevron = ({ open }: { open: boolean }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Feature Chips ────────────────────────────────────────────
const features = [
  { label: "혐오·욕설 감지" },
  { label: "위협·괴롭힘 분류" },
  { label: "AI 대응 가이드" },
];

// ─── Main Page ────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [youtubeKey, setYoutubeKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const canSubmit = videoUrl.trim();

  const handleAnalyze = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setNeedsApiKey(false);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoUrl.trim(),
          youtubeApiKey: youtubeKey.trim() || undefined,
          geminiApiKey: geminiKey.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errorType === "MODEL_NOT_FOUND" || res.status === 404) {
          throw new Error(`MODEL_NOT_FOUND: ${data.error || "Gemini 모델을 찾을 수 없습니다."}\n\n${data.details || "모델명을 확인하거나 최신 모델로 업데이트해주세요."}`);
        }
        if (data.errorType === "QUOTA_EXCEEDED" || res.status === 429) {
          throw new Error(`QUOTA_EXCEEDED: ${data.error || "Gemini API 할당량이 초과되었습니다."}\n\n${data.details || "잠시 후 다시 시도하거나 다른 API 키를 사용해주세요."}`);
        }
        if (data.error?.includes("API Key") || data.error?.includes("API 키")) {
          setNeedsApiKey(true);
          setShowApiKeys(true);
        }
        throw new Error(data.error || "분석에 실패했습니다.");
      }

      // 인메모리 스토어 초기화(핫 리로드 등) 대비: 클라이언트에도 캐시
      try {
        sessionStorage.setItem(`result-${data.id}`, JSON.stringify(data));
      } catch {
        // sessionStorage 쓰기 실패는 무시 (private 모드 등)
      }

      router.push(`/result/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  // ─── Error Type Helpers ───────────────────────────────────
  const isQuota = error?.includes("QUOTA_EXCEEDED");
  const isModelNotFound = error?.includes("MODEL_NOT_FOUND");
  const errorBg = isQuota ? "var(--warning-light)" : isModelNotFound ? "var(--info-light)" : "var(--danger-light)";
  const errorBorder = isQuota ? "var(--warning-border)" : isModelNotFound ? "#bfdbfe" : "var(--danger-border)";
  const errorTitle = isQuota ? "API 할당량 초과" : isModelNotFound ? "Gemini 모델 오류" : error?.split("\n")[0] ?? "";
  const errorTextColor = isQuota ? "var(--warning)" : isModelNotFound ? "var(--info)" : "var(--danger)";

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 pt-16 lg:pt-12"
      style={{ background: "var(--background)" }}
    >
      <motion.div
        initial={false}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        style={{ opacity: mounted ? undefined : 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px]"
      >
        {/* ── Brand Header ── */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 shadow-lg"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <IconShield />
          </div>

          <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: "var(--text-primary)" }}>
            YouTube Shield
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            AI가 악성 댓글을 자동 감지하고<br />
            크리에이터를 보호합니다
          </p>

          {/* Feature chips */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {features.map((f) => (
              <span
                key={f.label}
                className="inline-block text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}
              >
                {f.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Input Card ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* URL 입력 섹션 */}
          <div className="p-6 pb-5">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              YouTube 영상 URL
            </label>
            <VideoInput
              videoUrl={videoUrl}
              onVideoUrlChange={setVideoUrl}
              youtubeApiKey={youtubeKey}
            />
          </div>

          {/* 구분선 */}
          <div style={{ borderTop: "1px solid var(--border-color)" }} />

          {/* API 키 아코디언 */}
          <div className="px-6 py-4">
            <button
              type="button"
              onClick={() => setShowApiKeys(!showApiKeys)}
              className="w-full flex items-center justify-between gap-2 text-sm font-medium transition-colors"
              style={{ color: needsApiKey ? "var(--danger)" : "var(--text-muted)" }}
            >
              <span className="flex items-center gap-2">
                <IconKey />
                고급 설정 — API 키
                {needsApiKey && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
                    필수
                  </span>
                )}
              </span>
              <IconChevron open={showApiKeys} />
            </button>

            {mounted && (
              <AnimatePresence>
                {showApiKeys && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4">
                      <ApiKeyForm
                        youtubeKey={youtubeKey}
                        geminiKey={geminiKey}
                        onYoutubeKeyChange={setYoutubeKey}
                        onGeminiKeyChange={setGeminiKey}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {!mounted && showApiKeys && (
              <div className="pt-4">
                <ApiKeyForm
                  youtubeKey={youtubeKey}
                  geminiKey={geminiKey}
                  onYoutubeKeyChange={setYoutubeKey}
                  onGeminiKeyChange={setGeminiKey}
                />
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div style={{ borderTop: "1px solid var(--border-color)" }} />

          {/* 에러 */}
          {mounted && (
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="mx-6 my-4 rounded-xl p-4"
                    style={{ background: errorBg, border: `1px solid ${errorBorder}` }}
                  >
                    <p className="text-sm font-semibold mb-1" style={{ color: errorTextColor }}>{errorTitle}</p>
                    {isQuota && (
                      <div className="text-xs mt-2 space-y-1" style={{ color: "var(--warning)" }}>
                        {error.split("\n").slice(1).map((l, i) => <p key={i}>{l}</p>)}
                        <ul className="list-disc list-inside mt-2 space-y-1 ml-1">
                          <li>잠시 후 다시 시도</li>
                          <li>다른 Gemini API 키 사용</li>
                          <li><a href="https://ai.dev/rate-limit" target="_blank" rel="noopener noreferrer" className="underline">할당량 확인 →</a></li>
                        </ul>
                      </div>
                    )}
                    {isModelNotFound && (
                      <div className="text-xs mt-2 space-y-1" style={{ color: "var(--info)" }}>
                        {error.split("\n").slice(1).map((l, i) => <p key={i}>{l}</p>)}
                        <ul className="list-disc list-inside mt-2 space-y-1 ml-1">
                          <li>.env의 GEMINI_MODEL 값을 확인</li>
                          <li>예: gemini-1.5-flash, gemini-2.5-flash</li>
                          <li><a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="underline">모델 목록 확인 →</a></li>
                        </ul>
                      </div>
                    )}
                    {needsApiKey && !isQuota && (
                      <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
                        고급 설정에서 API 키를 입력해주세요.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* CTA 버튼 */}
          <div className="p-5 pt-4">
            <motion.button
              whileHover={mounted && canSubmit ? { scale: 1.01 } : {}}
              whileTap={mounted && canSubmit ? { scale: 0.98 } : {}}
              onClick={handleAnalyze}
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-base font-semibold transition-all"
              style={{
                background: canSubmit ? "var(--accent)" : "var(--surface-3)",
                color: canSubmit ? "#fff" : "var(--text-muted)",
                cursor: canSubmit ? "pointer" : "not-allowed",
                boxShadow: canSubmit ? "0 4px 14px rgba(109, 40, 217, 0.35)" : "none",
              }}
            >
              분석 시작
              {canSubmit && <IconArrow />}
            </motion.button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
          K-POP × Social Good × AI — Google Hackathon 2025
        </p>
      </motion.div>
    </main>
  );
}
