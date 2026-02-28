import { NextResponse } from 'next/server';
import { extractVideoId, getVideoInfo, fetchComments } from '@/lib/youtube';
import { analyzeComments } from '@/lib/gemini';
import { saveResult } from '@/lib/result-store';
import { getLevelFromScore, TOXICITY_CATEGORIES } from '@/lib/toxicity-constants';
import type { CommentAnalysis, AnalysisResult, ToxicityCategory } from '@/lib/toxicity-types';

/** 유효한 독성 카테고리 ID 집합 (CLEAN 등 비정의 값 필터용) */
const VALID_CATEGORY_IDS = new Set<string>(TOXICITY_CATEGORIES.map((c) => c.id));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoUrl } = body;

    // API 키: body에서 전달받거나, .env 환경변수 사용
    const youtubeApiKey = body.youtubeApiKey || process.env.YOUTUBE_API_KEY;
    const geminiApiKey = body.geminiApiKey || process.env.GOOGLE_API_KEY;

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'YouTube URL이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!youtubeApiKey || !geminiApiKey) {
      return NextResponse.json(
        { error: 'YouTube API Key와 Gemini API Key가 필요합니다. .env에 설정하거나 직접 입력해주세요.' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: '유효한 YouTube URL이 아닙니다.' },
        { status: 400 }
      );
    }

    // 1. 영상 정보 조회
    const videoInfo = await getVideoInfo(videoId, youtubeApiKey);

    // 2. 댓글 수집
    const rawComments = await fetchComments(videoId, youtubeApiKey, 100);

    if (rawComments.length === 0) {
      return NextResponse.json(
        { error: '이 영상에 댓글이 없습니다.' },
        { status: 400 }
      );
    }

    // 3. Gemini 분석
    let geminiResult;
    try {
      geminiResult = await analyzeComments(rawComments, geminiApiKey);
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      
      // 모델을 찾을 수 없음 에러 특별 처리
      if (errorMessage.includes('MODEL_NOT_FOUND') || errorMessage.includes('404') || errorMessage.includes('no longer available')) {
        return NextResponse.json(
          { 
            error: 'Gemini 모델을 찾을 수 없습니다.',
            errorType: 'MODEL_NOT_FOUND',
            details: '지정한 모델이 더 이상 사용할 수 없거나 존재하지 않습니다. 다음을 확인해주세요:\n1. .env 파일의 GEMINI_MODEL 값 확인\n2. 최신 모델명으로 업데이트 (예: gemini-1.5-flash, gemini-2.5-flash)\n3. Google AI Studio에서 사용 가능한 모델 확인: https://aistudio.google.com'
          },
          { status: 404 }
        );
      }
      
      // 할당량 초과 에러 특별 처리
      if (errorMessage.includes('QUOTA_EXCEEDED') || errorMessage.includes('quota') || errorMessage.includes('429')) {
        return NextResponse.json(
          { 
            error: 'Gemini API 할당량이 초과되었습니다.',
            errorType: 'QUOTA_EXCEEDED',
            details: '무료 티어의 일일/분당 할당량이 모두 소진되었습니다. 다음 중 하나를 시도해주세요:\n1. 잠시 후 다시 시도 (할당량이 리셋될 때까지 대기)\n2. 다른 Gemini API 키 사용\n3. Google Cloud Console에서 할당량 확인: https://ai.dev/rate-limit'
          },
          { status: 429 }
        );
      }
      throw error;
    }

    // 4. 결과 조합
    const comments: CommentAnalysis[] = rawComments.map((raw) => {
      const analysis = geminiResult.comments.find((c) => c.commentId === raw.commentId);
      return {
        commentId: raw.commentId,
        author: raw.author,
        text: raw.text,
        publishedAt: raw.publishedAt,
        likeCount: raw.likeCount,
        toxicityScore: analysis?.toxicityScore ?? 0,
        toxicityLevel: analysis?.toxicityLevel ?? 'safe',
        categories: (analysis?.categories ?? []) as ToxicityCategory[],
        explanation: analysis?.explanation ?? '',
        suggestion: analysis?.suggestion,
      };
    });

    const maliciousComments = comments.filter(
      (c) => c.toxicityScore >= 40
    );

    const total = rawComments.length;
    const toxicCount = maliciousComments.length;
    const cleanCount = total - toxicCount;

    const round1 = (n: number) => Math.round(n * 10) / 10;
    const toxicPercentage  = total > 0 ? round1((toxicCount / total) * 100) : 0;
    const cleanPercentage  = total > 0 ? round1((cleanCount / total) * 100) : 0;

    const safeCount     = comments.filter((c) => c.toxicityLevel === 'safe').length;
    const mildCount     = comments.filter((c) => c.toxicityLevel === 'mild').length;
    const moderateCount = comments.filter((c) => c.toxicityLevel === 'moderate').length;
    const severeCount   = comments.filter((c) => c.toxicityLevel === 'severe').length;
    const criticalCount = comments.filter((c) => c.toxicityLevel === 'critical').length;

    // CLEAN 등 정의되지 않은 카테고리를 categoryBreakdown에서 제거
    const categoryBreakdown = geminiResult.summary.categoryBreakdown
      .filter((cb) => VALID_CATEGORY_IDS.has(cb.category))
      .map((cb) => ({
        category: cb.category as ToxicityCategory,
        count: cb.count,
      }));

    const result: AnalysisResult = {
      videoId,
      videoTitle: videoInfo.title,
      channelTitle: videoInfo.channelTitle,
      totalComments: total,
      analyzedComments: comments.length,
      toxicComments: toxicCount,
      toxicPercentage,
      cleanComments: cleanCount,
      cleanPercentage,
      summary: {
        overallToxicityScore: geminiResult.summary.overallToxicityScore,
        toxicityLevel: getLevelFromScore(geminiResult.summary.overallToxicityScore),
        safeCount,
        mildCount,
        moderateCount,
        severeCount,
        criticalCount,
        categoryBreakdown,
        insight: geminiResult.summary.insight,
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
