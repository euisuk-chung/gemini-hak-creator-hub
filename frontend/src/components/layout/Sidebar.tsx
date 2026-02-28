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

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
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

// ─── Menu Config ─────────────────────────────────────────────
const menuItems = [
  { href: "/", label: "홈", icon: IconHome, matchFn: (p: string) => p === "/" || p.startsWith("/result") },
  { href: "/analysis", label: "영상 분석", icon: IconSearch, matchFn: (p: string) => p === "/analysis" },
  { href: "/summary", label: "주간 요약", icon: IconChart, matchFn: (p: string) => p === "/summary" },
];

// ─── Sidebar Content ──────────────────────────────────────────
function SidebarContent({ isMobile, onClose }: { isMobile: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--sidebar-bg)" }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
        <Link href="/" onClick={isMobile ? onClose : undefined} className="flex items-center gap-2.5 group">
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
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--sidebar-text)" }}
            aria-label="메뉴 닫기"
          >
            <IconX />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: "var(--sidebar-text)", opacity: 0.5 }}>
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
                borderLeft: isActive ? `3px solid var(--sidebar-active-border)` : "3px solid transparent",
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
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <>
      {/* Mobile Hamburger */}
      {isMobile === true && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-xl shadow-lg transition-all lg:hidden"
          style={{ background: "var(--sidebar-bg)", color: "var(--sidebar-text-active)" }}
          aria-label="메뉴 열기"
        >
          <IconMenu />
        </button>
      )}

      {/* Desktop Sidebar */}
      {isMobile !== true && (
        <aside
          className="fixed left-0 top-0 h-screen z-40"
          style={{ width: "var(--sidebar-width)" }}
        >
          <SidebarContent isMobile={false} onClose={() => {}} />
        </aside>
      )}

      {/* Mobile Overlay + Drawer */}
      <AnimatePresence>
        {isMobile === true && isOpen && (
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
              <SidebarContent isMobile={true} onClose={() => setIsOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
