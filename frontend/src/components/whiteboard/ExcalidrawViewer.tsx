"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false }
);

interface ExcalidrawViewerProps {
  src: string;
  height?: string;
}

export default function ExcalidrawViewer({
  src,
  height = "500px",
}: ExcalidrawViewerProps) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDiagram() {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error("다이어그램을 불러올 수 없습니다.");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "로드 실패");
      }
    }
    loadDiagram();
  }, [src]);

  if (error) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-stone-50 rounded-xl border border-stone-200"
      >
        <p className="text-sm text-stone-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-stone-50 rounded-xl"
      >
        <div className="animate-pulse text-sm text-stone-400">
          다이어그램 로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-stone-200">
      <Excalidraw
        initialData={{
          elements: data.elements || [],
          appState: {
            viewBackgroundColor: data.appState?.viewBackgroundColor || "#ffffff",
            gridSize: data.appState?.gridSize,
          },
          files: data.files,
        }}
        viewModeEnabled={true}
        theme="light"
      />
    </div>
  );
}
