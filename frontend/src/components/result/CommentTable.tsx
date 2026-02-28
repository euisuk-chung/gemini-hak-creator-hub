"use client";

import { useState } from "react";
import { getLevelMeta } from "@/lib/toxicity-constants";
import type { CommentAnalysis, ToxicityLevel } from "@/lib/toxicity-types";

interface CommentTableProps {
  comments: CommentAnalysis[];
}

const LEVEL_FILTERS: { id: ToxicityLevel | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'critical', label: '매우 심각' },
  { id: 'severe', label: '심각' },
  { id: 'moderate', label: '주의' },
  { id: 'mild', label: '경미' },
  { id: 'safe', label: '안전' },
];

export default function CommentTable({ comments }: CommentTableProps) {
  const [filter, setFilter] = useState<ToxicityLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');

  const filtered = comments
    .filter((c) => filter === 'all' || c.toxicityLevel === filter)
    .sort((a, b) => {
      if (sortBy === 'score') return b.toxicityScore - a.toxicityScore;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
      <div className="p-4 border-b border-stone-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {LEVEL_FILTERS.map((lf) => (
              <button
                key={lf.id}
                onClick={() => setFilter(lf.id)}
                className={`text-xs px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  filter === lf.id
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {lf.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setSortBy('score')}
              className={`text-xs px-3 py-1 rounded-full transition-colors cursor-pointer ${
                sortBy === 'score'
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              독성순
            </button>
            <button
              onClick={() => setSortBy('date')}
              className={`text-xs px-3 py-1 rounded-full transition-colors cursor-pointer ${
                sortBy === 'date'
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              최신순
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-stone-50 max-h-96 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-stone-400">
            해당 조건의 댓글이 없습니다.
          </div>
        ) : (
          filtered.map((comment) => {
            const level = getLevelMeta(comment.toxicityLevel);
            return (
              <div
                key={comment.commentId}
                className="px-4 py-3 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-stone-500 truncate">
                        {comment.author}
                      </span>
                      <span className="text-xs text-stone-300">
                        {new Date(comment.publishedAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <p className="text-sm text-stone-700 line-clamp-2">
                      {comment.text}
                    </p>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: `${level.color}15`,
                      color: level.color,
                    }}
                  >
                    {level.emoji} {comment.toxicityScore}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-stone-100 text-center">
        <span className="text-xs text-stone-400">
          {filtered.length}개 / 전체 {comments.length}개 댓글
        </span>
      </div>
    </div>
  );
}
