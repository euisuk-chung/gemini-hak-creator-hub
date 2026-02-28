import { NextResponse } from 'next/server';
import { saveResult } from '@/lib/result-store';
import { getLevelFromScore, TOXICITY_CATEGORIES } from '@/lib/toxicity-constants';
import type { CommentAnalysis, AnalysisResult, ToxicityCategory } from '@/lib/toxicity-types';

/** 유효한 독성 카테고리 ID 집합 (CLEAN 등 비정의 값 필터용) */
const VALID_CATEGORY_IDS = new Set<string>(TOXICITY_CATEGORIES.map((c) => c.id));

/** 백엔드 API URL (환경변수로 설정 가능, 기본값 localhost:8000) */
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// ─── 백엔드 응답 타입 ────────────────────────────────────────────
interface BackendTaggedComment {
  comment_id: string;
  author: string;
  text: string;
  published_at: string;
  like_count: number;
  toxicity_score: number;
  toxicity_level: string;
  categories: string[];
  explanation: string;
  suggestion: string | null;
  analysis_source: string;
}

interface BackendSummary {
  total_comments: number;
  clean_comments: number;
  clean_percentage: number;
  toxic_comments: number;
  toxic_percentage: number;
  average_toxicity_score: number;
  category_distribution: Record<string, number>;
  level_distribution: Record<string, number>;
  pipeline_stats: {
    rule_skipped: number;
    llm_analyzed: number;
    skip_ratio: number;
  };
}

interface BackendAnalyzeResponse {
  video_id: string;
  video_title: string;
  channel_title: string;
  transcript_length: number;
  total_comments: number;
  tagged_comments: BackendTaggedComment[];
  summary: BackendSummary;
}

// ─── insight 자동 생성 ───────────────────────────────────────────
function generateInsight(summary: BackendSummary): string {
  const { toxic_percentage, average_toxicity_score, category_distribution, level_distribution } = summary;

  const topCategory = Object.entries(category_distribution).sort((a, b) => b[1] - a[1])[0];
  const criticalCount = level_distribution['critical'] ?? 0;
  const severeCount = level_distribution['severe'] ?? 0;

  if (toxic_percentage === 0) {
    return '분석된 댓글에서 독성 표현이 발견되지 않았습니다. 건강한 커뮤니티를 유지하고 있습니다.';
  }

  let insight = `전체 댓글의 ${toxic_percentage}%에서 독성 표현이 감지되었으며, 평균 독성 점수는 ${average_toxicity_score}점입니다. `;

  if (topCategory) {
    const categoryLabel: Record<string, string> = {
      PROFANITY: '욕설/비속어',
      BLAME: '비난/비방',
      MOCKERY: '조롱/비꼼',
      PERSONAL_ATTACK: '인신공격',
      HATE_SPEECH: '혐오 표현',
      THREAT: '위협/협박',
      SEXUAL: '성희롱',
      DISCRIMINATION: '차별',
      FAN_WAR: '팬덤 갈등',
      SPAM: '스팸/광고',
    };
    insight += `가장 많이 감지된 유형은 "${categoryLabel[topCategory[0]] ?? topCategory[0]}" (${topCategory[1]}건)입니다. `;
  }

  if (criticalCount + severeCount > 0) {
    insight += `특히 심각한 수준(critical/severe)의 댓글이 ${criticalCount + severeCount}건 포함되어 있어 주의가 필요합니다.`;
  }

  return insight.trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoUrl } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'YouTube URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // ─── 백엔드 호출 ────────────────────────────────────────────
    let backendRes: Response;
    try {
      backendRes = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: videoUrl }),
      });
    } catch (networkError) {
      console.error('백엔드 연결 오류:', networkError);
      return NextResponse.json(
        { error: `백엔드 서버에 연결할 수 없습니다. (${BACKEND_URL}) 서버가 실행 중인지 확인해주세요.` },
        { status: 503 }
      );
    }

    if (!backendRes.ok) {
      const errBody = await backendRes.json().catch(() => ({}));
      const detail = (errBody as any).detail || '백엔드 분석 중 오류가 발생했습니다.';

      // 할당량 초과
      if (backendRes.status === 429 || String(detail).includes('quota') || String(detail).includes('QUOTA')) {
        return NextResponse.json(
          {
            error: 'Gemini API 할당량이 초과되었습니다.',
            errorType: 'QUOTA_EXCEEDED',
            details: '무료 티어의 일일/분당 할당량이 소진되었습니다. 잠시 후 다시 시도하거나 다른 API 키를 사용해주세요.',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: detail },
        { status: backendRes.status }
      );
    }

    const backend: BackendAnalyzeResponse = await backendRes.json();

    // ─── 백엔드 응답 → 프론트엔드 형식 변환 ─────────────────────
    const comments: CommentAnalysis[] = backend.tagged_comments.map((t) => ({
      commentId: t.comment_id,
      author: t.author,
      text: t.text,
      publishedAt: t.published_at,
      likeCount: t.like_count,
      toxicityScore: t.toxicity_score,
      toxicityLevel: t.toxicity_level as CommentAnalysis['toxicityLevel'],
      categories: t.categories.filter((c) => VALID_CATEGORY_IDS.has(c)) as ToxicityCategory[],
      explanation: t.explanation,
      suggestion: t.suggestion ?? undefined,
    }));

    const maliciousComments = comments.filter((c) => c.toxicityScore >= 30);

    const { summary: bs } = backend;

    const levelDist = bs.level_distribution ?? {};
    const safeCount     = levelDist['safe']     ?? 0;
    const mildCount     = levelDist['mild']      ?? 0;
    const moderateCount = levelDist['moderate']  ?? 0;
    const severeCount   = levelDist['severe']    ?? 0;
    const criticalCount = levelDist['critical']  ?? 0;

    const categoryBreakdown = Object.entries(bs.category_distribution ?? {})
      .filter(([cat]) => VALID_CATEGORY_IDS.has(cat))
      .map(([category, count]) => ({
        category: category as ToxicityCategory,
        count,
      }));

    const total = backend.total_comments;
    const toxicCount = bs.toxic_comments;
    const cleanCount = bs.clean_comments;
    const round1 = (n: number) => Math.round(n * 10) / 10;

    const result: AnalysisResult = {
      videoId: backend.video_id,
      videoTitle: backend.video_title || `YouTube 영상 (${backend.video_id})`,
      channelTitle: backend.channel_title || '알 수 없는 채널',
      totalComments: total,
      analyzedComments: comments.length,
      toxicComments: toxicCount,
      toxicPercentage: round1(bs.toxic_percentage),
      cleanComments: cleanCount,
      cleanPercentage: round1(bs.clean_percentage),
      summary: {
        overallToxicityScore: bs.average_toxicity_score,
        toxicityLevel: getLevelFromScore(bs.average_toxicity_score),
        safeCount,
        mildCount,
        moderateCount,
        severeCount,
        criticalCount,
        categoryBreakdown,
        insight: generateInsight(bs),
      },
      comments,
      maliciousComments,
    };

    const id = saveResult(result);

    return NextResponse.json({ id, result });
  } catch (error) {
    console.error('분석 오류:', error);
    const message = error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
