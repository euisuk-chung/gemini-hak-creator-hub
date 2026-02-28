import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YouTube Shield — AI 악성 댓글 분석기",
  description:
    "YouTube 영상의 댓글을 AI가 분석하여 악성 댓글을 식별합니다. 인플루언서를 위한 댓글 관리 도구.",
  openGraph: {
    title: "YouTube Shield — AI 악성 댓글 분석기",
    description: "AI가 YouTube 댓글을 분석하여 혐오·욕설·위협 댓글을 자동 식별",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className={`${geistSans.variable} antialiased`} style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Sidebar />
        <div className="lg:pl-[260px]">
          {children}
        </div>
      </body>
    </html>
  );
}
