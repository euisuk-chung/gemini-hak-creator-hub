"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ApiKeyForm from "@/components/setup/ApiKeyForm";
import VideoInput from "@/components/setup/VideoInput";
import Loading from "@/components/common/Loading";

export default function Home() {
  const router = useRouter();
  const [youtubeKey, setYoutubeKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API 키는 .env에 설정되어 있으면 비워둘 수 있음
  const canSubmit = videoUrl.trim();

  const handleAnalyze = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoUrl.trim(),
          youtubeApiKey: youtubeKey.trim(),
          geminiApiKey: geminiKey.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "분석에 실패했습니다.");
      }

      router.push(`/result/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full"
      >
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🛡️</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
            YouTube
            <br />
            <span className="text-[var(--accent)]">악성 댓글 분석기</span>
          </h1>
          <p className="text-stone-500">
            AI가 YouTube 댓글을 분석하여 악성 댓글을 식별합니다
          </p>
        </div>

        <div className="space-y-8">
          {/* Step 1: API 키 */}
          <div>
            <h2 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center">1</span>
              API 키 등록
            </h2>
            <div className="bg-stone-50 rounded-2xl p-5">
              <ApiKeyForm
                youtubeKey={youtubeKey}
                geminiKey={geminiKey}
                onYoutubeKeyChange={setYoutubeKey}
                onGeminiKeyChange={setGeminiKey}
              />
            </div>
          </div>

          {/* Step 2: 영상 선택 */}
          <div>
            <h2 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center">2</span>
              영상 선택
            </h2>
            <div className="bg-stone-50 rounded-2xl p-5">
              <VideoInput
                videoUrl={videoUrl}
                onVideoUrlChange={setVideoUrl}
                youtubeApiKey={youtubeKey}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-100 rounded-2xl p-4"
            >
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {/* Submit */}
          <motion.button
            whileHover={canSubmit ? { scale: 1.02 } : {}}
            whileTap={canSubmit ? { scale: 0.98 } : {}}
            onClick={handleAnalyze}
            disabled={!canSubmit}
            className={`w-full py-4 rounded-2xl text-lg font-semibold transition-all cursor-pointer ${
              canSubmit
                ? "bg-[var(--accent)] text-white shadow-lg shadow-purple-200 hover:shadow-xl"
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            }`}
          >
            분석 시작
          </motion.button>

          <p className="text-center text-xs text-stone-400">
            K-POP x Social Good x AI | Google Hackathon 2025
          </p>
        </div>
      </motion.div>
    </main>
  );
}
