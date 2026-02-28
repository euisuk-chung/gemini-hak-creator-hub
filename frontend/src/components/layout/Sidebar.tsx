"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── SVG Icons ───────────────────────────────────────────────
const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z"/>
  </svg>
);

const IconBarChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

const IconYoutube = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#ff0000">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
  </svg>
);

// ─── Risk Score Badge ─────────────────────────────────────────
function RiskBadge({ score }: { score: number }) {
  const { label, color } =
    score >= 70 ? { label: "위험", color: "#ef4444" } :
    score >= 50 ? { label: "주의", color: "#f59e0b" } :
    score >= 30 ? { label: "보통", color: "#3b82f6" } :
                  { label: "안전", color: "#10b981" };

  return (
    <span
      className="text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0"
      style={{ background: `${color}22`, color }}
    >
      {score} {label}
    </span>
  );
}

// ─── Recent Result (읽기) ─────────────────────────────────────
interface RecentResult {
  id: string;
  videoTitle: string;
  channelTitle: string;
  score: number;
}

function loadRecentResult(currentPathId?: string): RecentResult | null {
  try {
    // 현재 result 페이지 ID → lastResultId 순으로 탐색
    const targetId = currentPathId ?? sessionStorage.getItem("lastResultId");
    if (!targetId) return null;

    const raw = sessionStorage.getItem(`result-${targetId}`);
    if (!raw) return null;

    const data = JSON.parse(raw);
    const result = data?.result ?? data;
    if (!result?.videoTitle) return null;

    return {
      id: targetId,
      videoTitle: result.videoTitle ?? "",
      channelTitle: result.channelTitle ?? "",
      score: result.summary?.overallToxicityScore ?? 0,
    };
  } catch {
    return null;
  }
}

// ─── Menu Items ───────────────────────────────────────────────
const menuItems = [
  {
    href: "/",
    label: "홈",
    icon: IconHome,
    matchFn: (p: string) => p === "/",
  },
];

// ─── Sidebar Content ──────────────────────────────────────────
function SidebarContent({
  isMobile,
  onClose,
  recentResult,
}: {
  isMobile: boolean;
  onClose: () => void;
  recentResult: RecentResult | null;
}) {
  const pathname = usePathname();
  const isOnResult = pathname.startsWith("/result/");

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--sidebar-bg)" }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
        <Link href="/" onClick={isMobile ? onClose : undefined} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <span style={{ color: "#fff" }}>
              <IconShield />
            </span>
          </div>
          <div className="leading-none">
            <p className="text-sm font-bold" style={{ color: "var(--sidebar-logo-text)" }}>YouTube</p>
            <p className="text-xs font-medium" style={{ color: "var(--sidebar-text)" }}>Shield</p>
          </div>
        </Link>
        {isMobile && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: "var(--sidebar-text)" }}
            aria-label="메뉴 닫기"
          >
            <IconX />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-5 flex flex-col gap-6 overflow-y-auto">

        {/* 기본 메뉴 */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: "var(--sidebar-text)", opacity: 0.4 }}>
            메뉴
          </p>
          {menuItems.map((item) => {
            const isActive = item.matchFn(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={{
                  color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                  background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                  borderLeft: isActive ? "3px solid var(--sidebar-active-border)" : "3px solid transparent",
                }}
              >
                <Icon />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                )}
              </Link>
            );
          })}
        </div>

        {/* 최근 분석 결과 */}
        {recentResult && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: "var(--sidebar-text)", opacity: 0.4 }}>
              최근 분석
            </p>
            <Link
              href={`/result/${recentResult.id}`}
              onClick={isMobile ? onClose : undefined}
              className="flex flex-col gap-2 px-3 py-3 rounded-xl transition-all duration-150"
              style={{
                background: isOnResult ? "var(--sidebar-active-bg)" : "rgba(255,255,255,0.04)",
                borderLeft: isOnResult ? "3px solid var(--sidebar-active-border)" : "3px solid transparent",
                border: isOnResult ? undefined : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* 상단: 아이콘 + 배지 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5" style={{ color: "var(--sidebar-text)", opacity: 0.6 }}>
                  <IconBarChart />
                  <span className="text-xs font-semibold" style={{ color: "var(--sidebar-text)" }}>분석 리포트</span>
                </div>
                <RiskBadge score={recentResult.score} />
              </div>

              {/* 영상 제목 */}
              <p
                className="text-xs font-medium leading-snug line-clamp-2"
                style={{ color: isOnResult ? "var(--sidebar-text-active)" : "var(--sidebar-text)", opacity: isOnResult ? 1 : 0.75 }}
              >
                {recentResult.videoTitle}
              </p>

              {/* 채널명 */}
              {recentResult.channelTitle && (
                <div className="flex items-center gap-1">
                  <IconYoutube />
                  <span className="text-[10px] truncate" style={{ color: "var(--sidebar-text)", opacity: 0.45 }}>
                    {recentResult.channelTitle}
                  </span>
                </div>
              )}
            </Link>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-white/[0.06]">
        <p className="text-[10px] leading-relaxed" style={{ color: "var(--sidebar-text)", opacity: 0.4 }}>
          K-POP × Social Good × AI<br />
          Google Hackathon 2025
        </p>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [recentResult, setRecentResult] = useState<RecentResult | null>(null);

  // 윈도우 크기 감지
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false);
    };
    check();
    setMounted(true);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // pathname이 바뀔 때마다 최근 분석 결과 갱신
  useEffect(() => {
    if (!mounted) return;
    const match = pathname.match(/^\/result\/(.+)$/);
    const currentId = match ? match[1] : undefined;

    // 현재 result 페이지 ID가 있으면 lastResultId 업데이트
    if (currentId) {
      try { sessionStorage.setItem("lastResultId", currentId); } catch { /* ignore */ }
    }

    setRecentResult(loadRecentResult(currentId));
  }, [pathname, mounted]);

  return (
    <>
      {/* ── 데스크탑 사이드바 (CSS 기반 표시/숨김 → SSR 안전) ── */}
      <aside
        className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:z-40 lg:block"
        style={{ width: "var(--sidebar-width)" }}
      >
        <SidebarContent isMobile={false} onClose={() => {}} recentResult={recentResult} />
      </aside>

      {/* ── 모바일 요소: mounted 이후에만 렌더 ── */}
      {mounted && (
        <>
          {isMobile && (
            <button
              onClick={() => setIsOpen(true)}
              className="fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-xl shadow-lg lg:hidden"
              style={{ background: "var(--sidebar-bg)", color: "var(--sidebar-text-active)" }}
              aria-label="메뉴 열기"
            >
              <IconMenu />
            </button>
          )}

          <AnimatePresence>
            {isMobile && isOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 z-40 lg:hidden"
                  style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
                />
                <motion.aside
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ type: "spring", damping: 28, stiffness: 220 }}
                  className="fixed left-0 top-0 h-screen z-50 lg:hidden shadow-2xl"
                  style={{ width: "var(--sidebar-width-mobile)" }}
                >
                  <SidebarContent isMobile={true} onClose={() => setIsOpen(false)} recentResult={recentResult} />
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}
