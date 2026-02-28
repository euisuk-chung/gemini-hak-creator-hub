"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false }
);

interface ExcalidrawEditorProps {
  initialData?: string;
  height?: string;
}

export default function ExcalidrawEditor({
  initialData,
  height = "100vh",
}: ExcalidrawEditorProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(async () => {
    if (!excalidrawAPI) return;

    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles();

    const data = JSON.stringify(
      {
        type: "excalidraw",
        version: 2,
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
        },
        files,
      },
      null,
      2
    );

    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.excalidraw";
    a.click();
    URL.revokeObjectURL(url);
  }, [excalidrawAPI]);

  const handleExportPNG = useCallback(async () => {
    if (!excalidrawAPI) return;

    try {
      const { exportToBlob } = await import("@excalidraw/utils");
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      const blob = await exportToBlob({
        elements,
        appState: { ...appState, exportWithDarkMode: false },
        files,
        getDimensions: () => ({ width: 1920, height: 1080, scale: 2 }),
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "diagram.png";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PNG 내보내기 실패:", err);
    }
  }, [excalidrawAPI]);

  const handleLoad = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !excalidrawAPI) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        excalidrawAPI.updateScene({
          elements: data.elements || [],
        });
      } catch (err) {
        console.error("파일 로드 실패:", err);
      }
    },
    [excalidrawAPI]
  );

  const parsedInitialData = initialData ? JSON.parse(initialData) : undefined;

  return (
    <div style={{ height }} className="relative">
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={handleLoad}
          className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-50 shadow-sm cursor-pointer"
        >
          불러오기
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-50 shadow-sm cursor-pointer"
        >
          .excalidraw 저장
        </button>
        <button
          onClick={handleExportPNG}
          className="px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs font-medium hover:opacity-90 shadow-sm cursor-pointer"
        >
          PNG 내보내기
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".excalidraw,.json"
        onChange={handleFileChange}
        className="hidden"
      />

      <Excalidraw
        excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
        initialData={parsedInitialData}
        theme="light"
      />
    </div>
  );
}
