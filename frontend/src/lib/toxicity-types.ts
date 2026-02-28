/** 악성 댓글 10대 카테고리 (한국 인터넷 문화 + K-POP 특화) */
export type ToxicityCategory =
  | 'PROFANITY'          // 욕설/비속어
  | 'BLAME'              // 비난/비방
  | 'MOCKERY'            // 조롱/비꼼
  | 'PERSONAL_ATTACK'    // 인신공격
  | 'HATE_SPEECH'        // 혐오 표현
  | 'THREAT'             // 위협/협박
  | 'SEXUAL'             // 성희롱/성적 대상화
  | 'DISCRIMINATION'     // 차별
  | 'FAN_WAR'            // 팬덤 갈등/안티
  | 'SPAM';              // 스팸/광고

/** 독성 수준 */
export type ToxicityLevel = 'safe' | 'mild' | 'moderate' | 'severe' | 'critical';

/** 개별 댓글 분석 */
export interface CommentAnalysis {
  commentId: string;
  author: string;
  text: string;
  publishedAt: string;
  likeCount: number;
  toxicityScore: number;
  toxicityLevel: ToxicityLevel;
  categories: ToxicityCategory[];
  explanation: string;
  suggestion?: string;
}

/** 전체 분석 결과 */
export interface AnalysisResult {
  videoId: string;
  videoTitle: string;
  channelTitle: string;
  totalComments: number;
  analyzedComments: number;
  /** 독성 댓글 수 (toxicityScore >= 40) */
  toxicComments: number;
  /** 독성 비율 (0–100, 소수점 1자리) */
  toxicPercentage: number;
  /** 정상 댓글 수 */
  cleanComments: number;
  /** 정상 비율 (0–100, 소수점 1자리) */
  cleanPercentage: number;
  summary: {
    overallToxicityScore: number;
    toxicityLevel: ToxicityLevel;
    safeCount: number;
    mildCount: number;
    moderateCount: number;
    severeCount: number;
    criticalCount: number;
    /** CLEAN 카테고리를 제외한 독성 카테고리만 포함 */
    categoryBreakdown: { category: ToxicityCategory; count: number }[];
    insight: string;
  };
  comments: CommentAnalysis[];
  maliciousComments: CommentAnalysis[];
}

/** 저장된 결과 */
export interface StoredResult {
  id: string;
  result: AnalysisResult;
  createdAt: string;
}

/** YouTube 댓글 raw 데이터 */
export interface YouTubeComment {
  commentId: string;
  author: string;
  text: string;
  publishedAt: string;
  likeCount: number;
}
