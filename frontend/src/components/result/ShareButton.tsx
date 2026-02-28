"use client";

import { useState } from "react";

interface ShareButtonProps {
  resultId: string;
  score: number;
}

export default function ShareButton({ resultId, score }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/result/${resultId}`
    : "";

  const shareText = `이 영상의 댓글 독성 점수는 ${score}점! AI로 YouTube 악성 댓글을 분석해보세요.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = `${shareText}\n${shareUrl}`;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "YouTube Shield 분석 결과",
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleShare}
        className="flex-1 py-3 rounded-2xl bg-[var(--accent)] text-white font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
      >
        결과 공유하기
      </button>
      <button
        onClick={handleCopy}
        className="py-3 px-5 rounded-2xl border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 transition-colors cursor-pointer"
      >
        {copied ? "복사됨!" : "복사"}
      </button>
    </div>
  );
}
