---
name: dev
description: 개발 서버 실행, 빌드, 린트 등 개발 워크플로우
disable-model-invocation: true
argument-hint: "[start|build|lint]"
allowed-tools: Bash(cd d:/repo/NVC-chat-talk/frontend && npm *)
---

# 개발 워크플로우

`cd d:/repo/NVC-chat-talk/frontend` 에서 실행.

## 명령어

| 인자 | 실행 |
|------|------|
| `start` (기본) | `npm run dev` |
| `build` | `npm run build` |
| `lint` | `npm run lint` |

`$ARGUMENTS`가 비어있으면 `start`로 간주.

## 환경 변수

`.env.local`에 `GOOGLE_API_KEY` 필요 (Gemini API).
