"use client";

import { motion } from "framer-motion";
import { getLevelMeta, getCategoryMeta } from "@/lib/toxicity-constants";
import type { CommentAnalysis } from "@/lib/toxicity-types";

interface CommentCardProps {
  comment: CommentAnalysis;
}

export default function CommentCard({ comment }: CommentCardProps) {
  const levelMeta = getLevelMeta(comment.toxicityLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-500">
            {comment.author}
          </span>
          <span className="text-xs text-stone-300">
            {new Date(comment.publishedAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${levelMeta.color}15`,
              color: levelMeta.color,
            }}
          >
            {levelMeta.emoji} {comment.toxicityScore}점
          </span>
        </div>
      </div>

      <p className="text-sm text-stone-700 mb-3 leading-relaxed">
        {comment.text}
      </p>

      <p className="text-xs text-stone-500 mb-2">{comment.explanation}</p>

      {comment.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {comment.categories.map((cat) => {
            const catMeta = getCategoryMeta(cat);
            return (
              <span
                key={cat}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${catMeta.color}15`,
                  color: catMeta.color,
                }}
              >
                {catMeta.emoji} {catMeta.nameKo}
              </span>
            );
          })}
        </div>
      )}

      {comment.suggestion && (
        <div className="mt-3 pt-3 border-t border-stone-50">
          <p className="text-xs text-blue-600">
            <span className="font-medium">대응 제안:</span> {comment.suggestion}
          </p>
        </div>
      )}
    </motion.div>
  );
}
