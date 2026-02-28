---
name: review-pr
description: PR 변경사항을 리뷰하고 피드백 제공
context: fork
agent: Explore
argument-hint: "[branch or PR number]"
allowed-tools: Bash(git *), Bash(gh *)
---

# PR 리뷰

## 컨텍스트 수집

- 변경된 파일: !`git diff --name-only main...HEAD`
- 변경 통계: !`git diff --stat main...HEAD`

## 리뷰 기준

1. **타입 안전성**: TypeScript 타입이 적절한가
2. **컴포넌트 구조**: 도메인별 폴더 분류, Props interface 존재
3. **스타일링**: Tailwind CSS 사용, CSS 변수 활용
4. **보안**: API 키 노출, XSS, 인젝션 여부
5. **성능**: 불필요한 리렌더링, 큰 번들 임포트

## 출력 형식

변경 파일별로:
- 이슈 (있으면)
- 개선 제안 (있으면)
- 잘한 점 (있으면)

마지막에 전체 요약 1-2줄.
