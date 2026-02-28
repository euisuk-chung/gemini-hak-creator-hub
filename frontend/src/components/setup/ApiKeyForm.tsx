"use client";

import { useState } from "react";

interface ApiKeyFormProps {
  youtubeKey: string;
  geminiKey: string;
  onYoutubeKeyChange: (key: string) => void;
  onGeminiKeyChange: (key: string) => void;
}

export default function ApiKeyForm({
  youtubeKey,
  geminiKey,
  onYoutubeKeyChange,
  onGeminiKeyChange,
}: ApiKeyFormProps) {
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <label className="block text-xs sm:text-sm font-medium text-stone-600 mb-1 sm:mb-1.5">
          YouTube Data API Key
        </label>
        <div className="relative">
          <input
            type={showYoutubeKey ? "text" : "password"}
            value={youtubeKey}
            onChange={(e) => onYoutubeKeyChange(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 sm:pr-16 rounded-lg sm:rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white"
          />
          <button
            type="button"
            onClick={() => setShowYoutubeKey(!showYoutubeKey)}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            {showYoutubeKey ? "숨기기" : "보기"}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-stone-600 mb-1 sm:mb-1.5">
          Gemini API Key
        </label>
        <div className="relative">
          <input
            type={showGeminiKey ? "text" : "password"}
            value={geminiKey}
            onChange={(e) => onGeminiKeyChange(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 sm:pr-16 rounded-lg sm:rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white"
          />
          <button
            type="button"
            onClick={() => setShowGeminiKey(!showGeminiKey)}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            {showGeminiKey ? "숨기기" : "보기"}
          </button>
        </div>
      </div>

      <p className="text-[10px] sm:text-xs text-stone-400 flex items-start gap-1">
        <span className="mt-0.5">🔒</span> 
        <span>.env에 설정된 경우 비워둘 수 있습니다. 입력 시 .env보다 우선 적용됩니다.</span>
      </p>
    </div>
  );
}
