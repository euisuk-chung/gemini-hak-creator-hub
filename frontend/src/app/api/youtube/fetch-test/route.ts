import { NextResponse } from 'next/server';
import {
  extractVideoId,
  getVideoDetail,
  fetchComments,
  listCaptions,
} from '@/lib/youtube';

/**
 * YouTube Fetch Test API
 *
 * POST /api/youtube/fetch-test
 * Body: { videoUrl, youtubeApiKey, targets: ['detail', 'comments', 'captions'] }
 *
 * Returns fetched data for each requested target.
 * All endpoints use YouTube Data API v3 (requires API key).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoUrl, targets } = body;

    // API 키: body에서 전달받거나, .env 환경변수 사용
    const youtubeApiKey = body.youtubeApiKey || process.env.YOUTUBE_API_KEY;

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'YouTube URL이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!youtubeApiKey) {
      return NextResponse.json(
        { error: 'YouTube API Key가 필요합니다. .env에 설정하거나 직접 입력해주세요.' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: '유효한 YouTube URL이 아닙니다.' }, { status: 400 });
    }

    const requestedTargets: string[] = targets || ['detail', 'comments', 'captions'];
    const results: Record<string, any> = { videoId };
    const errors: Record<string, string> = {};

    // 1. Video Detail (snippet + contentDetails + statistics)
    if (requestedTargets.includes('detail')) {
      try {
        results.detail = await getVideoDetail(videoId, youtubeApiKey);
      } catch (err) {
        errors.detail = err instanceof Error ? err.message : 'Failed';
      }
    }

    // 2. Comments (first 20 for test)
    if (requestedTargets.includes('comments')) {
      try {
        const comments = await fetchComments(videoId, youtubeApiKey, 20);
        results.comments = {
          count: comments.length,
          sample: comments.slice(0, 5),
          allComments: comments,
        };
      } catch (err) {
        errors.comments = err instanceof Error ? err.message : 'Failed';
      }
    }

    // 3. Available Captions
    if (requestedTargets.includes('captions')) {
      try {
        results.captions = await listCaptions(videoId, youtubeApiKey);
      } catch (err) {
        errors.captions = err instanceof Error ? err.message : 'Failed';
      }
    }

    return NextResponse.json({
      success: true,
      videoId,
      results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Fetch test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fetch test failed' },
      { status: 500 }
    );
  }
}
