"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import type { AnalysisResult } from "@/lib/toxicity-types";
import { TOXICITY_LEVELS } from "@/lib/toxicity-constants";
import ToxicityBadge from "@/components/result/ToxicityBadge";
import ScoreGauge from "@/components/result/ScoreGauge";
import CategoryChart from "@/components/result/CategoryChart";
import CommentCard from "@/components/result/CommentCard";
import CommentTable from "@/components/result/CommentTable";
import ShareButton from "@/components/result/ShareButton";

export default function ResultPage() {
  const params = useParams();
  const id = params.id as string;
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllMalicious, setShowAllMalicious] = useState(false);

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/result/${id}`);
        if (!res.ok) {
          throw new Error("결과를 찾을 수 없습니다.");
        }
        const data = await res.json();
        setResult(data.result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "결과를 불러올 수 없습니다."
        );
      }
    }
    fetchResult();
  }, [id]);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-4xl mb-4">😢</div>
        <h2 className="text-xl font-semibold mb-2">결과를 찾을 수 없어요</h2>
        <p className="text-sm text-stone-500 mb-6">{error}</p>
        <Link
          href="/"
          className="py-3 px-6 bg-[var(--accent)] text-white rounded-2xl text-sm font-semibold"
        >
          다시 분석하기
        </Link>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-stone-400">결과를 불러오는 중...</div>
      </main>
    );
  }

  const { summary, maliciousComments } = result;
  const displayMalicious = showAllMalicious
    ? maliciousComments
    : maliciousComments.slice(0, 5);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 영상 정보 */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-bold text-stone-800 mb-1">
              {result.videoTitle}
            </h1>
            <p className="text-sm text-stone-400">
              {result.channelTitle} | 댓글 {result.analyzedComments}개 분석
            </p>
          </div>

          {/* 독성 수준 배지 + 점수 */}
          <ToxicityBadge
            level={summary.toxicityLevel}
            score={summary.overallToxicityScore}
          />

          <div className="flex justify-center mb-8">
            <ScoreGauge score={summary.overallToxicityScore} />
          </div>

          {/* 독성 수준별 분포 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
            <h3 className="text-sm font-semibold text-stone-600 mb-4">
              독성 수준별 분포
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {TOXICITY_LEVELS.map((level) => {
                const countKey = `${level.id}Count` as keyof typeof summary;
                const count = (summary[countKey] as number) || 0;
                return (
                  <div key={level.id} className="text-center">
                    <div className="text-2xl mb-1">{level.emoji}</div>
                    <div
                      className="text-lg font-bold"
                      style={{ color: level.color }}
                    >
                      {count}
                    </div>
                    <div className="text-xs text-stone-400">{level.nameKo}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 카테고리 차트 */}
          <CategoryChart breakdown={summary.categoryBreakdown} />

          {/* AI 인사이트 */}
          <div className="bg-[var(--accent-light)] rounded-2xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-[var(--accent)] mb-3">
              AI 종합 인사이트
            </h3>
            <p className="text-sm text-stone-700 leading-relaxed">
              {summary.insight}
            </p>
          </div>

          {/* 악성 댓글 목록 */}
          {maliciousComments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-stone-600 mb-3">
                주의 이상 악성 댓글 ({maliciousComments.length}건)
              </h3>
              <div className="space-y-3">
                {displayMalicious.map((comment) => (
                  <CommentCard key={comment.commentId} comment={comment} />
                ))}
              </div>
              {maliciousComments.length > 5 && !showAllMalicious && (
                <button
                  onClick={() => setShowAllMalicious(true)}
                  className="w-full mt-3 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  + {maliciousComments.length - 5}건 더 보기
                </button>
              )}
            </div>
          )}

          {/* 전체 댓글 테이블 */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-stone-600 mb-3">
              전체 댓글 분석 결과
            </h3>
            <CommentTable comments={result.comments} />
          </div>

          {/* 공유 & 다시하기 */}
          <ShareButton
            resultId={id}
            score={summary.overallToxicityScore}
          />

          <Link href="/">
            <button className="w-full mt-3 py-3 rounded-2xl text-stone-400 text-sm hover:text-stone-600 transition-colors cursor-pointer">
              다시 분석하기
            </button>
          </Link>

          <p className="text-center mt-6 text-xs text-stone-300">
            YouTube Shield | K-POP x Social Good x AI
          </p>
        </motion.div>
      </div>
    </main>
  );
}
