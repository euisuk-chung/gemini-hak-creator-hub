import type { ToxicityCategory, ToxicityLevel } from './toxicity-types';

export interface CategoryMeta {
  id: ToxicityCategory;
  nameKo: string;
  description: string;
  color: string;
  emoji: string;
}

export interface LevelMeta {
  id: ToxicityLevel;
  nameKo: string;
  scoreRange: [number, number];
  color: string;
  emoji: string;
}

/**
 * 악성 댓글 10대 카테고리
 * 한국 인터넷 문화 + K-POP 엔터테인먼트 맥락에 특화
 */
export const TOXICITY_CATEGORIES: CategoryMeta[] = [
  {
    id: 'PROFANITY',
    nameKo: '욕설/비속어',
    description: '욕설, 비속어, 저속한 표현 (초성·변형 포함)',
    color: '#D97706',
    emoji: '🤬',
  },
  {
    id: 'BLAME',
    nameKo: '비난/비방',
    description: '근거 없는 일방적 비판, 악의적 비방, 명예훼손성 발언',
    color: '#EA580C',
    emoji: '👎',
  },
  {
    id: 'MOCKERY',
    nameKo: '조롱/비꼼',
    description: '비꼬기, 돌려까기, 냉소적 조롱, 놀리기',
    color: '#CA8A04',
    emoji: '🃏',
  },
  {
    id: 'PERSONAL_ATTACK',
    nameKo: '인신공격',
    description: '외모·능력·인격 등 개인 특성을 직접 공격',
    color: '#DC2626',
    emoji: '🎯',
  },
  {
    id: 'HATE_SPEECH',
    nameKo: '혐오 표현',
    description: '인종·젠더·성소수자 등 특정 집단 대상 증오 표현',
    color: '#991B1B',
    emoji: '🚫',
  },
  {
    id: 'THREAT',
    nameKo: '위협/협박',
    description: '폭력·해를 가하겠다는 위협, 자해 유도',
    color: '#B91C1C',
    emoji: '⚠️',
  },
  {
    id: 'SEXUAL',
    nameKo: '성희롱/성적 대상화',
    description: '성적 발언, 성희롱, 성적 대상화',
    color: '#9333EA',
    emoji: '🔞',
  },
  {
    id: 'DISCRIMINATION',
    nameKo: '차별',
    description: '외모·나이·학력·지역·직업 등에 기반한 차별적 표현',
    color: '#C2410C',
    emoji: '🚷',
  },
  {
    id: 'FAN_WAR',
    nameKo: '팬덤 갈등/안티',
    description: '팬덤 간 갈등, 안티 활동, 타 아티스트 비하',
    color: '#7C3AED',
    emoji: '⚔️',
  },
  {
    id: 'SPAM',
    nameKo: '스팸/광고',
    description: '무관한 광고, 반복 스팸, 낚시성 댓글',
    color: '#6B7280',
    emoji: '📢',
  },
];

export const TOXICITY_LEVELS: LevelMeta[] = [
  { id: 'safe', nameKo: '안전', scoreRange: [0, 20], color: '#10B981', emoji: '✅' },
  { id: 'mild', nameKo: '경미', scoreRange: [20, 40], color: '#3B82F6', emoji: '💬' },
  { id: 'moderate', nameKo: '주의', scoreRange: [40, 60], color: '#F59E0B', emoji: '⚠️' },
  { id: 'severe', nameKo: '심각', scoreRange: [60, 80], color: '#EF4444', emoji: '🔴' },
  { id: 'critical', nameKo: '매우 심각', scoreRange: [80, 100], color: '#991B1B', emoji: '🚨' },
];

export function getLevelMeta(level: ToxicityLevel): LevelMeta {
  return TOXICITY_LEVELS.find((l) => l.id === level) ?? TOXICITY_LEVELS[0];
}

export function getCategoryMeta(category: ToxicityCategory): CategoryMeta {
  return TOXICITY_CATEGORIES.find((c) => c.id === category) ?? TOXICITY_CATEGORIES[0];
}

export function getLevelFromScore(score: number): ToxicityLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'severe';
  if (score >= 40) return 'moderate';
  if (score >= 20) return 'mild';
  return 'safe';
}
