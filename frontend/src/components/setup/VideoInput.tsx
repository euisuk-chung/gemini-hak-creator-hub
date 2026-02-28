"use client";

import { useState, useEffect } from "react";
import { extractVideoId } from "@/lib/youtube";

interface VideoPreview {
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

interface VideoInputProps {
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
  youtubeApiKey: string;
}

export default function VideoInput({
  videoUrl,
  onVideoUrlChange,
  youtubeApiKey,
}: VideoInputProps) {
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError(null);

      try {
        // 서버 API를 통해 영상 정보 조회 (API 키는 서버 .env fallback)
        const res = await fetch("/api/youtube/fetch-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl,
            targets: ["detail"],
            ...(youtubeApiKey ? { youtubeApiKey } : {}),
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          setPreviewError(data.error || "영상 정보를 가져올 수 없습니다.");
          setPreview(null);
          return;
        }

        const detail = data.results?.detail;
        if (!detail) {
          setPreviewError(data.errors?.detail || "영상을 찾을 수 없습니다.");
          setPreview(null);
          return;
        }

        setPreview({
          title: detail.title,
          channelTitle: detail.channelTitle,
          thumbnailUrl: detail.thumbnailUrl || "",
        });
      } catch {
        setPreviewError("영상 정보를 가져올 수 없습니다.");
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [videoUrl, youtubeApiKey]);

  return (
    <div className="space-y-2 sm:space-y-3">
      <label className="block text-xs sm:text-sm font-medium text-stone-600 mb-1 sm:mb-1.5">
        YouTube 영상 URL
      </label>
      <input
        type="text"
        value={videoUrl}
        onChange={(e) => onVideoUrlChange(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=..."
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white"
      />

      {previewLoading && (
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-stone-400">
          <span className="animate-spin">⏳</span> 영상 정보 확인 중...
        </div>
      )}

      {previewError && (
        <p className="text-[10px] sm:text-xs text-red-500">{previewError}</p>
      )}

      {preview && (
        <div className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 bg-stone-50 rounded-lg sm:rounded-xl">
          {preview.thumbnailUrl && (
            <img
              src={preview.thumbnailUrl}
              alt={preview.title}
              className="w-20 h-14 sm:w-24 sm:h-16 object-cover rounded-lg shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-stone-700 line-clamp-2">
              {preview.title}
            </p>
            <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5 sm:mt-1">
              {preview.channelTitle}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
