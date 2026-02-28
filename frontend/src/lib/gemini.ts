import { GoogleGenerativeAI } from '@google/generative-ai';
import { TOXICITY_ANALYSIS_PROMPT } from '@/logics/prompt';
import type { YouTubeComment } from './toxicity-types';

interface GeminiCommentResult {
  commentId: string;
  toxicityScore: number;
  toxicityLevel: 'safe' | 'mild' | 'moderate' | 'severe' | 'critical';
  categories: string[];
  explanation: string;
  suggestion?: string;
}

interface GeminiResponse {
  comments: GeminiCommentResult[];
  summary: {
    overallToxicityScore: number;
    toxicityLevel: 'safe' | 'mild' | 'moderate' | 'severe' | 'critical';
    categoryBreakdown: { category: string; count: number }[];
    insight: string;
  };
}

/** Gemini로 댓글 독성 분석 (단일 호출) */
export async function analyzeComments(
  comments: YouTubeComment[],
  geminiApiKey: string
): Promise<GeminiResponse> {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: TOXICITY_ANALYSIS_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  const input = comments.map((c) => ({
    commentId: c.commentId,
    author: c.author,
    text: c.text,
    publishedAt: c.publishedAt,
    likeCount: c.likeCount,
  }));

  const userMessage = `다음 YouTube 댓글들을 분석해주세요:\n\n${JSON.stringify(input, null, 2)}`;

  try {
    const result = await model.generateContent(userMessage);
    const text = result.response.text();
    return JSON.parse(text) as GeminiResponse;
  } catch (error: any) {
    const errorMessage = error?.message || String(error);

    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Quota')) {
      throw new Error('QUOTA_EXCEEDED: Gemini API 할당량이 초과되었습니다. 잠시 후 다시 시도하거나 다른 API 키를 사용해주세요.');
    }
    if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('no longer available')) {
      throw new Error('MODEL_NOT_FOUND: 지정한 Gemini 모델을 찾을 수 없습니다. 모델명을 확인하거나 최신 모델로 업데이트해주세요.');
    }

    throw error;
  }
}
