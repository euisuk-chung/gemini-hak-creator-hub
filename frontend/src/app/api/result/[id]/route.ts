import { NextResponse } from 'next/server';
import { getResult } from '@/lib/result-store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stored = getResult(id);

  if (!stored) {
    return NextResponse.json(
      { error: '결과를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  return NextResponse.json(stored);
}
