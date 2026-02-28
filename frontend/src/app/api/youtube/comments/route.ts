import { NextResponse } from 'next/server';
import { extractVideoId, getVideoInfo, fetchComments } from '@/lib/youtube';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoUrl } = body;

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
      return NextResponse.json(
        { error: '유효한 YouTube URL이 아닙니다.' },
        { status: 400 }
      );
    }

    const videoInfo = await getVideoInfo(videoId, youtubeApiKey);
    const comments = await fetchComments(videoId, youtubeApiKey, 100);

    return NextResponse.json({
      videoId,
      ...videoInfo,
      commentCount: comments.length,
      comments,
    });
  } catch (error) {
    console.error('YouTube 댓글 조회 오류:', error);
    const message = error instanceof Error ? error.message : '댓글 조회 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
