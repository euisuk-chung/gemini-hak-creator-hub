import type { StoredResult, AnalysisResult } from './toxicity-types';

/**
 * In-memory result store for MVP.
 * 프로세스 재시작 시 초기화됨. 추후 Vercel KV 등으로 전환.
 */
const store = new Map<string, StoredResult>();

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function saveResult(result: AnalysisResult): string {
  const id = generateId();
  store.set(id, {
    id,
    result,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export function getResult(id: string): StoredResult | undefined {
  return store.get(id);
}
