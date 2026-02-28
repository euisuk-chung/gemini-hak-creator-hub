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

/** 댓글을 배치로 나누기 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/** 단일 배치 분석 */
async function analyzeBatch(
  comments: YouTubeComment[],
  model: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>
): Promise<GeminiResponse> {
  const input = comments.map((c) => ({
    commentId: c.commentId,
    author: c.author,
    text: c.text,
    publishedAt: c.publishedAt,
    likeCount: c.likeCount,
  }));

  const userMessage = `다음 YouTube 댓글들을 분석해주세요:\n\n${JSON.stringify(input, null, 2)}`;

  const result = await model.generateContent(userMessage);
  const text = result.response.text();

  return JSON.parse(text) as GeminiResponse;
}

/** Gemini로 댓글 독성 분석 (배치 처리) */
export async function analyzeComments(
  comments: YouTubeComment[],
  geminiApiKey: string
): Promise<GeminiResponse> {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: TOXICITY_ANALYSIS_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  const BATCH_SIZE = 20;
  const batches = chunkArray(comments, BATCH_SIZE);

  if (batches.length === 1) {
    return analyzeBatch(comments, model);
  }

  // 여러 배치 병렬 처리
  const batchResults = await Promise.all(
    batches.map((batch) => analyzeBatch(batch, model))
  );

  // 결과 통합
  const allComments = batchResults.flatMap((r) => r.comments);

  // 카테고리 통합
  const categoryMap = new Map<string, number>();
  for (const r of batchResults) {
    for (const cb of r.summary.categoryBreakdown) {
      categoryMap.set(cb.category, (categoryMap.get(cb.category) || 0) + cb.count);
    }
  }

  const overallScore = allComments.length > 0
    ? Math.round(allComments.reduce((sum, c) => sum + c.toxicityScore, 0) / allComments.length)
    : 0;

  const toxicityLevel: GeminiResponse['summary']['toxicityLevel'] =
    overallScore >= 80 ? 'critical' :
    overallScore >= 60 ? 'severe' :
    overallScore >= 40 ? 'moderate' :
    overallScore >= 20 ? 'mild' : 'safe';

  return {
    comments: allComments,
    summary: {
      overallToxicityScore: overallScore,
      toxicityLevel,
      categoryBreakdown: Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        count,
      })),
      insight: batchResults[batchResults.length - 1].summary.insight,
    },
  };
}
