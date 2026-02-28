---
name: project-conventions
description: NVC-chat-talk 프로젝트 구조와 코딩 컨벤션. 코드를 작성하거나 수정할 때 참고.
user-invocable: false
---

# Project: NVC Chat Talk

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Framer Motion

## 디렉토리 구조

```
frontend/src/
├── app/              # 라우트 (App Router)
│   ├── api/          # API 라우트 (route.ts)
│   ├── diagnose/     # 진단 페이지
│   ├── result/[id]/  # 결과 페이지
│   └── whiteboard/   # Excalidraw 화이트보드
├── components/       # 도메인별 컴포넌트 폴더
│   ├── common/       # 공통 (Loading 등)
│   ├── diagnose/     # 진단 관련
│   ├── result/       # 결과 관련
│   └── whiteboard/   # Excalidraw 에디터/뷰어
└── lib/              # 유틸, 타입, 상수, 프롬프트
```

## 컨벤션

- 컴포넌트: PascalCase (`ScoreGauge.tsx`), 도메인 폴더별 분류
- 페이지: `page.tsx` (App Router)
- API: `route.ts`
- 타입: `lib/` 아래 `*-types.ts`
- 상수: `lib/` 아래 `*-constants.ts`
- 클라이언트 컴포넌트: `"use client"` 명시
- 스타일: Tailwind CSS 유틸리티 클래스, CSS 변수(`--accent`, `--accent-light`)
- 애니메이션: Framer Motion (`motion.div`, `whileHover`, `whileTap`)
- AI: Google Gemini (`@google/generative-ai`, `gemini-2.5-flash`)
- 경로 alias: `@/*` → `./src/*`
- 언어: 한국어 UI
