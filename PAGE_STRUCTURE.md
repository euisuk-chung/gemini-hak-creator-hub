# 페이지 구조 설명

## 📁 전체 프로젝트 구조

```
frontend/src/app/
├── page.tsx                    # 메인 페이지 (홈)
├── layout.tsx                  # 루트 레이아웃
├── globals.css                 # 전역 스타일
│
├── analysis/                   # 특정 영상 분석 페이지
│   └── page.tsx
│
├── summary/                    # 이번 주 요약 페이지
│   └── page.tsx
│
├── result/                     # 분석 결과 페이지
│   └── [id]/
│       └── page.tsx
│
├── whiteboard/                 # 화이트보드 페이지 (기타)
│   └── page.tsx
│
└── api/                        # API 라우트
    ├── analyze/
    │   └── route.ts           # 분석 요청 처리
    ├── result/
    │   └── [id]/
    │       └── route.ts       # 결과 조회
    └── youtube/
        ├── comments/
        │   └── route.ts       # YouTube 댓글 조회
        └── fetch-test/
            └── route.ts       # YouTube 영상 정보 조회
```

---

## 🏠 페이지별 상세 설명

### 1. **홈 페이지** (`/` - `page.tsx`)

**역할**: 사용자가 YouTube 영상 URL을 입력하고 분석을 시작하는 진입점

**주요 기능**:
- ✅ YouTube 영상 URL 입력
- ✅ API 키 설정 (선택사항, 접을 수 있음)
- ✅ 분석 시작 버튼
- ✅ 에러 처리 (할당량 초과, 모델 없음 등)

**사용자 흐름**:
```
사용자 입력 → 분석 시작 → /api/analyze 호출 → /result/[id]로 리다이렉트
```

**특징**:
- UX 개선: API 키는 선택사항으로 처리 (환경변수 자동 사용)
- 점진적 공개: API 키 섹션을 접을 수 있음
- 친화적 에러 메시지 제공

---

### 2. **특정 영상 분석 페이지** (`/analysis` - `analysis/page.tsx`)

**역할**: Figma 디자인 기반의 특정 영상 분석 결과 표시 (현재 더미 데이터)

**주요 섹션**:
1. **영상 정보**
   - 썸네일 (300x160px)
   - 영상 제목
   - 조회수, 댓글수, 날짜

2. **통계 카드**
   - 총 댓글 수
   - 악성 댓글 수
   - 악성 비율
   - 위험도 지수 (반원 게이지)

3. **악성 댓글 목록**
   - 사용자명, 시간, 카테고리
   - 댓글 내용
   - 위험도 진행 바

4. **유형별 분류**
   - 도넛 차트로 카테고리별 분포 표시

**레이아웃**:
- 왼쪽: 사이드바 (320px 고정)
- 오른쪽: 메인 콘텐츠 (ml-[320px])

**상태**: 
- ⚠️ 현재 더미 데이터 사용
- TODO: 실제 API 데이터 연결 필요

---

### 3. **이번 주 요약 페이지** (`/summary` - `summary/page.tsx`)

**역할**: Figma 디자인 기반의 주간 요약 대시보드 (현재 더미 데이터)

**주요 섹션**:
1. **제일 높은 위험 영상**
   - 영상 정보 (썸네일, 제목, 조회수 등)
   - 통계 (총 댓글, 악성 댓글, 악성 비율)
   - 위험도 지수

2. **영상별 위험도 테이블**
   - 영상 제목
   - 위험도 지수 (진행 바 + 숫자)
   - 상태 (CAUTION 등)

**레이아웃**:
- 왼쪽: 사이드바 (320px 고정)
- 오른쪽: 메인 콘텐츠

**상태**: 
- ⚠️ 현재 더미 데이터 사용
- TODO: 실제 API 데이터 연결 필요

---

### 4. **분석 결과 페이지** (`/result/[id]` - `result/[id]/page.tsx`)

**역할**: 실제 분석 결과를 Figma 디자인에 맞춰 표시

**데이터 흐름**:
```
/api/analyze → 결과 저장 → ID 반환 → /result/[id]로 이동
```

**주요 기능**:
1. **결과 조회**
   - `/api/result/[id]`에서 분석 결과 가져오기
   - YouTube API에서 영상 상세 정보 추가 조회

2. **영상 정보 표시**
   - 썸네일 (YouTube API)
   - 제목, 조회수, 댓글수, 날짜
   - 실제 데이터 사용

3. **통계 표시**
   - 총 댓글 수, 악성 댓글 수, 악성 비율
   - 위험도 지수 (실제 점수 기반)

4. **악성 댓글 목록**
   - 실제 분석된 악성 댓글 표시
   - 위험도 진행 바
   - 시간 경과 계산 ("2시간 전" 등)

5. **유형별 분류**
   - 실제 카테고리 데이터 기반 도넛 차트

**레이아웃**:
- Figma 디자인과 동일한 구조
- 사이드바 + 메인 콘텐츠

**특징**:
- ✅ 실제 데이터 연결 완료
- ✅ Figma 디자인 반영
- ✅ YouTube API 통합

---

## 🔄 페이지 간 흐름

```
┌─────────────────┐
│   홈 페이지 (/) │
│  - URL 입력     │
│  - 분석 시작    │
└────────┬────────┘
         │
         │ POST /api/analyze
         ▼
┌─────────────────┐
│  API: analyze   │
│  - 댓글 수집    │
│  - Gemini 분석  │
│  - 결과 저장    │
└────────┬────────┘
         │
         │ ID 반환
         ▼
┌─────────────────┐
│ /result/[id]    │
│  - 결과 표시    │
│  - Figma 디자인 │
└─────────────────┘

┌─────────────────┐
│ /analysis       │
│  - 특정 영상    │
│  - 더미 데이터  │
└─────────────────┘

┌─────────────────┐
│ /summary        │
│  - 주간 요약    │
│  - 더미 데이터  │
└─────────────────┘
```

---

## 🧩 공통 컴포넌트

### **Sidebar** (`components/layout/Sidebar.tsx`)
- 모든 분석 관련 페이지에 공통으로 사용
- 현재 경로에 따라 활성화 표시
- 링크: `/analysis`, `/summary`

### **RiskGauge** (`components/analysis/RiskGauge.tsx`)
- 반원 형태의 위험도 지수 게이지
- SVG 기반 애니메이션

### **DonutChart** (`components/analysis/DonutChart.tsx`)
- 유형별 분류 도넛 차트
- 카테고리별 색상 구분

---

## 📡 API 라우트 구조

### **POST /api/analyze**
- YouTube URL 받아서 분석 수행
- 댓글 수집 → Gemini 분석 → 결과 저장
- 반환: `{ id, result }`

### **GET /api/result/[id]**
- 저장된 분석 결과 조회
- 반환: `{ result: AnalysisResult }`

### **POST /api/youtube/fetch-test**
- YouTube 영상 상세 정보 조회
- 썸네일, 조회수, 게시일 등

### **POST /api/youtube/comments**
- YouTube 댓글 목록 조회

---

## 🎨 디자인 시스템

### **레이아웃**
- 사이드바: 320px 고정 너비, 회색 배경 (#d9d9d9)
- 메인 콘텐츠: ml-[320px], 왼쪽 패딩 46px, 상단 패딩 61px

### **폰트**
- Pretendard 폰트 사용
- 제목: 40px (Bold)
- 본문: 20px, 16px, 12px 등

### **색상**
- 배경: 흰색 (#ffffff)
- 사이드바: 회색 (#d9d9d9)
- 텍스트: 검정색 (#000000)
- 강조: 보라색 (--accent)

### **간격**
- Figma 디자인 기반 픽셀 단위 사용
- mb-[60px], gap-[60px] 등 정확한 간격 적용

---

## 🔧 현재 상태 및 TODO

### ✅ 완료
- [x] 홈 페이지 UX 개선
- [x] 결과 페이지 Figma 디자인 반영
- [x] 실제 데이터 연결 (결과 페이지)
- [x] 에러 처리 개선
- [x] Gemini 2.5 모델 업데이트

### ⚠️ 진행 중 / TODO
- [ ] `/analysis` 페이지 실제 데이터 연결
- [ ] `/summary` 페이지 실제 데이터 연결
- [ ] 주간 요약 데이터 API 구현
- [ ] 영상 목록 API 구현

---

## 📝 주요 기술 스택

- **프레임워크**: Next.js 16 (App Router)
- **스타일링**: Tailwind CSS 4
- **애니메이션**: Framer Motion
- **타입**: TypeScript
- **폰트**: Pretendard

---

## 🚀 실행 방법

```bash
cd frontend
npm install
npm run dev
```

접속:
- 홈: http://localhost:3000
- 분석: http://localhost:3000/analysis
- 요약: http://localhost:3000/summary
- 결과: http://localhost:3000/result/[id]
