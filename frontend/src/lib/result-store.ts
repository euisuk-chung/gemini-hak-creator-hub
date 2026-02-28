import type { StoredResult, AnalysisResult } from './toxicity-types';

/**
 * In-memory result store for MVP.
 * global 객체에 연결해 Next.js HMR 시 초기화되지 않도록 방지.
 * 추후 Vercel KV 등으로 전환.
 */
const globalForStore = global as typeof global & {
  resultStore?: Map<string, StoredResult>;
};
if (!globalForStore.resultStore) {
  globalForStore.resultStore = new Map<string, StoredResult>();
}
const store = globalForStore.resultStore;

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
