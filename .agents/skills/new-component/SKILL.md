---
name: new-component
description: 프로젝트 컨벤션에 맞는 새 React 컴포넌트 생성
disable-model-invocation: true
argument-hint: "[domain/ComponentName]"
---

# 컴포넌트 생성

`$ARGUMENTS` 형식: `domain/ComponentName` (예: `result/SummaryCard`)

## 생성 위치

`frontend/src/components/{domain}/{ComponentName}.tsx`

## 템플릿

```tsx
"use client";

import { motion } from "framer-motion";

interface {ComponentName}Props {
  // props 정의
}

export default function {ComponentName}({ }: {ComponentName}Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* 구현 */}
    </motion.div>
  );
}
```

## 규칙

1. `"use client"` 명시 (인터랙티브 컴포넌트)
2. Tailwind CSS 유틸리티 사용, CSS 변수 활용 (`var(--accent)`)
3. `framer-motion`으로 진입 애니메이션
4. Props interface 명시
5. `export default function` 사용
