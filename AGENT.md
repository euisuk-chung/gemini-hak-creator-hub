# Creator Hub — AI 기반 YouTube 악성 댓글 분석 서비스

> **Google Gemini Hackathon** 출품작 | K-POP × Social Good × AI

**DO NOT FIX FRONT-END** (/frontend)

---

## 0. 에이전트 공용 설정

스킬과 프롬프트는 `.agents/` 디렉토리에서 관리합니다.

```text
.agents/
└── skills/           ← 공용 스킬 (Claude Code, Cursor, Windsurf 등)
    ├── dev/          — 개발 워크플로우 (dev, build, lint)
    ├── new-component/— React 컴포넌트 생성 템플릿
    ├── project-conventions/ — 프로젝트 구조/코딩 컨벤션
    └── review-pr/    — PR 리뷰 가이드
```

- 스킬 추가/수정 시 `.agents/skills/` 아래에 `{skill-name}/SKILL.md` 형식으로 작성
- `.claude/`에는 개인 권한(`settings.local.json`) 등만 보관 — git 추적하지 않음

---

## 1. 문제 정의 (Why)

- 한국 크리에이터의 68%가 악성 댓글로 인한 정신적 스트레스를 경험 (한국콘텐츠진흥원)
- K-POP 아이돌/인플루언서 대상 사이버 불링이 사회적 문제로 대두
- 수천~수만 댓글을 수동으로 모니터링하는 것은 비현실적
- 한국어 특유의 초성 욕설(ㅅㅂ), 변형 욕설(시1발), 돌려까기 등은 기존 필터로 탐지 불가

## 2. 솔루션 (What)

**Gemini AI로 YouTube 댓글을 분석하여 악성 댓글을 자동 식별하고, 크리에이터에게 대응 방안을 제안하는 서비스**

- 영상 URL 하나만 입력하면 댓글 수집 → AI 분석 → 리포트 생성까지 자동화
- 10개 악성 카테고리 × 5단계 독성 수준으로 세분화된 분석 결과 제공
- 악성 댓글마다 크리에이터 관점의 대응 제안 포함

## 3. 해커톤 테마 매칭

| 테마 | 연결 |
|------|------|
| **Entertainment × Gemini** | K-POP/엔터테인먼트 크리에이터의 댓글 분석 |
| **Social Good × Gemini** | 건강한 댓글 문화 조성, 크리에이터 멘탈 보호 |

## 4. 핵심 기술 (Google 기술 활용)

| 기술 | 용도 | 활용 방식 |
|------|------|-----------|
| **Gemini 2.0 Flash** | 댓글 독성 분석 | 시스템 프롬프트 + JSON 구조화 출력 (`responseMimeType: 'application/json'`) |
| **YouTube Data API v3** | 댓글/영상 수집 | `commentThreads.list`, `videos.list`, `captions.list` |
| **Next.js 16** | 풀스택 프레임워크 | App Router + API Routes (TypeScript) |

### Gemini 활용 포인트

- 한국어 맥락 이해: 반어법("와 진짜 잘하신다~ㅋㅋ"), 비꼼, K-POP 은어
- 10개 카테고리 동시 분류 (복수 분류 가능)
- 크리에이터 관점 대응 제안 자동 생성
- 배치 처리 (20개/배치) + 병렬 실행으로 100+ 댓글 분석

## 5. 서비스 플로우

```
[크리에이터]
    │
    ├─ Step 1: API 키 등록 (YouTube + Gemini)
    │          ※ 키는 서버에 저장되지 않음 (프라이버시 보호)
    │
    └─ Step 2: YouTube 영상 URL 입력
                    │
                    ▼
              ┌─────────────────────────────────┐
              │  YouTube Data API v3            │
              │  댓글 수집 (최대 100개)           │
              │  영상 메타데이터 조회              │
              └──────────────┬──────────────────┘
                             │
                             ▼
              ┌─────────────────────────────────┐
              │  Gemini 2.0 Flash               │
              │  배치 분석 (20개/배치, 병렬)       │
              │  10개 카테고리 분류                │
              │  독성 점수 산출 (0-100)            │
              │  대응 제안 생성                    │
              └──────────────┬──────────────────┘
                             │
                             ▼
              ┌─────────────────────────────────┐
              │  결과 대시보드                     │
              │  ├─ 전체 독성 점수 (0-100 게이지)  │
              │  ├─ 카테고리별 분포 차트            │
              │  ├─ AI 종합 인사이트               │
              │  ├─ 악성 댓글 목록 + 대응 제안      │
              │  └─ 결과 공유 URL                  │
              └─────────────────────────────────┘
```

## 6. 차별점

| 기존 서비스 | Creator Hub |
|------------|-------------|
| 단순 긍정/부정 분류 | **10개 세분화 카테고리** (욕설, 비난, 조롱, 인신공격, 혐오, 위협, 성희롱, 차별, 팬덤갈등, 스팸) |
| 영어 중심 필터 | **한국어 특화 분석** (초성 욕설, 변형 욕설, 돌려까기, K-POP 팬덤 용어) |
| 분석 결과만 제공 | **크리에이터 관점 대응 제안**까지 제시 |
| API 키 서버 저장 | **프라이버시 우선** — API 키 서버 미저장, 사용자가 직접 관리 |
| 일반 감성 분석 | **K-POP 맥락 이해** — 팬덤 갈등, 안티 활동, 비교 공격 탐지 |

## 7. 악성 댓글 10대 카테고리

| # | ID | 한국어명 | 설명 | 예시 |
|---|------|---------|------|------|
| 1 | PROFANITY | 욕설/비속어 | 직접 욕설, 초성 욕설, 변형 욕설 | ㅅㅂ, 시1발, 개새끼 |
| 2 | BLAME | 비난/비방 | 근거 없는 비판, 악의적 비방 | "이래서 망한 거야" |
| 3 | MOCKERY | 조롱/비꼼 | 반어법, 돌려까기, 냉소 | "와 진짜 잘하신다~ㅋㅋ" |
| 4 | PERSONAL_ATTACK | 인신공격 | 외모/능력/인격 공격 | "못생겼다", "재능 없다" |
| 5 | HATE_SPEECH | 혐오 표현 | 성별/인종/종교 기반 증오 | "한남충", "김치녀" |
| 6 | THREAT | 위협/협박 | 폭력/신상 위협 | "찾아간다", "신상 턴다" |
| 7 | SEXUAL | 성희롱 | 성적 대상화, 부적절 성적 발언 | 아이돌 성적 대상화 |
| 8 | DISCRIMINATION | 차별 | 지역/나이/학력 차별 | "촌놈", "~학교 나온 게 티난다" |
| 9 | FAN_WAR | 팬덤 갈등 | 팬 간 갈등, 조직적 안티 | "XX팬들은 다 이래" |
| 10 | SPAM | 스팸/광고 | 홍보, 반복 댓글, 낚시 | 링크 포함 반복 홍보 |

## 8. 독성 5단계

| 수준 | 점수 | 의미 | 대응 |
|------|------|------|------|
| safe | 0-19 | 건전한 댓글 | 대응 불필요 |
| mild | 20-39 | 경미한 부정적 표현 | 모니터링 |
| moderate | 40-59 | 주의 필요 | 대응 제안 제공 |
| severe | 60-79 | 심각한 악성 | 숨기기/신고 권장 |
| critical | 80-100 | 매우 심각 | 법적 조치 고려 |

## 9. 분석 로직 아키텍처

```
frontend/src/logics/     ← 분석 로직 (협업 폴더)
├── ontology.ts          — 악성 댓글 온톨로지
│                          5 Domain → 10 Category → 39 SubType
│                          체계적 분류 체계 정의
│
├── rules.ts             — 규칙 기반 탐지 엔진
│                          한국어 정규식 패턴 매칭
│                          초성/변형/직접 욕설, 위협, 조롱 등 탐지
│                          pre-screen → AI → validation 파이프라인
│
└── prompt.ts            — Gemini 시스템 프롬프트 (한국어)
                           174줄의 상세 분석 지침
                           10개 카테고리 정의 + 구분 규칙
                           JSON 구조화 출력 스키마
```

## 10. 프로젝트 구조

```
frontend/src/
├── logics/              ← 분석 로직 (협업 폴더)
│   ├── ontology.ts      — 온톨로지 (5 Domain → 10 Category → 39 SubType)
│   ├── rules.ts         — 규칙 기반 탐지 엔진 (한국어 정규식)
│   └── prompt.ts        — Gemini 시스템 프롬프트 (한국어, 174줄)
│
├── lib/                 ← 서비스 라이브러리
│   ├── gemini.ts        — Gemini API 클라이언트 (배치 처리, 병렬 실행)
│   ├── youtube.ts       — YouTube Data API v3 (댓글/영상/자막 수집)
│   ├── toxicity-types.ts    — 타입 정의
│   ├── toxicity-constants.ts — 카테고리/수준 메타데이터
│   └── result-store.ts  — 결과 저장소
│
├── app/
│   ├── page.tsx         — 랜딩 (API 키 등록 + 영상 URL 입력)
│   ├── result/[id]/     — 분석 결과 대시보드
│   └── api/
│       ├── analyze/     — 메인 분석 API (댓글 수집 → Gemini 분석)
│       └── result/[id]/ — 결과 조회 API
│
└── components/
    ├── setup/           — ApiKeyForm, VideoInput
    ├── result/          — ScoreGauge, ToxicityBadge, CategoryChart,
    │                      CommentCard, CommentTable, ShareButton
    └── common/          — Loading
```

## 11. 데모 시나리오

1. K-POP 뮤직비디오 URL 입력 (예: 인기 아이돌 MV)
2. "분석 시작" 클릭 → 로딩 화면 (분석 팁 순환 표시)
3. 결과 대시보드:
   - 전체 독성 점수: **35/100 (mild)**
   - 카테고리 분포: FAN_WAR 8건, MOCKERY 5건, PERSONAL_ATTACK 3건
   - AI 인사이트: *"팬덤 갈등 댓글이 주를 이루며, 특정 멤버에 대한 인신공격이 발견됩니다"*
4. 악성 댓글별 대응 제안: *"해당 댓글은 신고 후 숨기기를 권장합니다"*
5. 결과 URL 공유로 팀/소속사와 리포트 공유

## 12. 기대 효과

- **크리에이터**: 악성 댓글 모니터링 시간 90% 절감, 멘탈 보호
- **커뮤니티**: 건강한 댓글 문화 조성에 기여
- **K-POP 산업**: 아이돌/소속사의 온라인 평판 관리 도구
- **사회적 가치**: 사이버 불링 조기 탐지 및 대응 체계 마련

## 13. 팀 구성

| 역할 | 담당 |
|------|------|
| 백엔드 로직/알고리즘 | 분석 파이프라인, Gemini 프롬프트, 온톨로지 설계 |
| 프론트엔드 | Figma 디자인 → 구현 |
| 백엔드 로직 리뷰 | logics/ 폴더 공동 리뷰 |
| 프론트엔드 머징 | 프론트 + 백엔드 통합 |

## 14. 실행 방법

```bash
# 의존성 설치
cd frontend && npm install

# 개발 서버 시작
npm run dev

# 브라우저에서 http://localhost:3000 접속
# YouTube API Key + Gemini API Key 입력 후 영상 URL로 분석 시작
```

## 15. 환경변수

모든 환경변수는 **프로젝트 루트 `.env`** 파일 하나로 통합 관리됩니다.

| 변수 | 설명 | 예시 |
|------|------|------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 키 | `AIzaSy...` |
| `GOOGLE_API_KEY` | Gemini API 키 | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini 모델명 | `gemini-2.0-flash` |

```bash
# .env (프로젝트 루트)
YOUTUBE_API_KEY=your_youtube_api_key
GOOGLE_API_KEY=your_google_api_key
GEMINI_MODEL=gemini-2.0-flash
```

> - `.env`에 키가 설정되어 있으면 UI에서 비워둘 수 있습니다.
> - UI에서 입력한 키는 `.env` 키보다 우선 적용됩니다.
> - API 키는 서버에 영구 저장되지 않습니다.

## 16. 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript (Strict) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| AI | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| API | YouTube Data API v3 (REST) |
| Runtime | Node.js |

## 17. 향후 로드맵

- [ ] 룰엔진 파이프라인 연동 (pre-screen → AI → validation)
- [ ] 영구 저장소 전환 (Vercel KV / Firebase)
- [ ] 채널 단위 분석 (전체 영상 댓글 일괄 분석)
- [ ] 실시간 모니터링 (신규 댓글 자동 감지)
- [ ] 다국어 확장 (일본어, 영어)
- [ ] 대시보드 PDF/CSV 내보내기
- [ ] 크리에이터 자동 알림 시스템
