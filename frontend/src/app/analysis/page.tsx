"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import RiskGauge from "@/components/analysis/RiskGauge";
import DonutChart from "@/components/analysis/DonutChart";
import type { AnalysisResult } from "@/lib/toxicity-types";

// 임시 이미지 URL (실제로는 Figma에서 제공된 이미지 URL 사용)
const imgImage1 = "http://localhost:3845/assets/23463d90dc7f3388bfef2efcc55f3ef586ee1b99.png";
const imgPolygon1 = "http://localhost:3845/assets/e4748aefb94fcbd67304433f1aaad1c79cb929a4.svg";

export default function AnalysisPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 실제 데이터를 API에서 가져오기
    // 임시로 더미 데이터 사용
    setLoading(false);
  }, []);

  // 더미 데이터
  const dummyData = {
    videoTitle: "영상이름",
    views: "조회수",
    comments: "댓글수",
    date: "yyyy-mm-dd",
    commentCount: 1234,
    totalComments: 1234,
    maliciousComments: 234,
    maliciousRatio: 15,
    riskIndex: 65,
    commentsList: [
      {
        id: 1,
        username: "유저이름",
        timeAgo: "2시간 전",
        category: "카테고리",
        text: "악성댓글댓글",
        riskPercent: 75,
      },
      {
        id: 2,
        username: "유저이름",
        timeAgo: "2시간 전",
        category: "카테고리",
        text: "악성댓글댓글",
        riskPercent: 60,
      },
    ],
  };

  return (
    <div className="bg-white relative min-h-screen" data-name="Desktop - 1">
      <Sidebar />
      
      <div className="lg:ml-[320px] px-4 sm:px-6 lg:px-0 pt-20 lg:pt-[61px] pb-8 lg:pb-0 lg:pl-[46px]">
        {/* 헤더 */}
        <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-bold text-black mb-8 lg:mb-[60px]">
          특정 영상 분석
        </h1>

        {/* 영상 정보 섹션 */}
        <div className="mb-12 lg:mb-[88px]">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-[60px] items-start">
            {/* 썸네일 */}
            <div className="w-full sm:w-[400px] lg:w-[300px] h-auto sm:h-[225px] lg:h-[160px] bg-[#d9d9d9] flex-shrink-0 overflow-hidden rounded-lg">
              <img
                src={imgImage1}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
            </div>

            {/* 영상 정보 */}
            <div className="flex-1 w-full">
              <h2 className="text-xl sm:text-2xl lg:text-[40px] font-bold text-black mb-4 lg:mb-[31px] break-words">
                {dummyData.videoTitle}
              </h2>
              <div className="space-y-4 lg:space-y-[27px]">
                <div className="flex flex-wrap gap-3 lg:gap-[19px]">
                  <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black">
                    {dummyData.views}
                  </p>
                  <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black">
                    {dummyData.comments}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 lg:gap-[19px]">
                  <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black">
                    {dummyData.date}
                  </p>
                  <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black">
                    {dummyData.commentCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 통계 섹션 */}
          <div className="mt-8 lg:mt-[58px] flex flex-col lg:flex-row items-start gap-6 lg:gap-[119px]">
            {/* 통계 카드들 */}
            <div className="flex flex-wrap gap-6 lg:gap-[119px] w-full lg:w-auto">
              <div>
                <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black mb-2 lg:mb-[12px]">
                  총 댓글 수
                </p>
                <p className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-black">
                  {dummyData.totalComments}
                </p>
              </div>
              <div>
                <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black mb-2 lg:mb-[12px]">
                  악성 댓글 수
                </p>
                <p className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-black">
                  {dummyData.maliciousComments}
                </p>
              </div>
              <div>
                <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black mb-2 lg:mb-[12px]">
                  악성 비율
                </p>
                <p className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-black">
                  {dummyData.maliciousRatio}%
                </p>
              </div>
            </div>

            {/* 위험도 지수 */}
            <div className="w-full lg:w-auto lg:ml-auto flex flex-col items-start lg:items-end">
              <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black mb-4 lg:mb-[35px]">
                위험도 지수
              </p>
              <RiskGauge score={dummyData.riskIndex} />
            </div>
          </div>
        </div>

        {/* 악성 댓글 섹션 */}
        <div className="mb-12 lg:mb-[88px]">
          <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-bold text-black mb-6 lg:mb-[48px]">
            악성 댓글
          </h2>
          <div className="space-y-6 lg:space-y-[40px]">
            {dummyData.commentsList.map((comment) => (
              <div key={comment.id} className="relative bg-stone-50 rounded-lg p-4 lg:p-0 lg:bg-transparent">
                <div className="flex flex-wrap items-center gap-3 lg:gap-[20px] mb-4 lg:mb-[35px]">
                  <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black">
                    {comment.username}
                  </p>
                  <p className="text-sm lg:text-[16px] font-normal text-black">
                    {comment.timeAgo}
                  </p>
                  <p className="text-sm lg:text-[16px] font-normal text-black">
                    {comment.category}
                  </p>
                </div>
                <p className="text-sm lg:text-[16px] font-normal text-black mb-4 lg:mb-[28px] break-words">
                  {comment.text}
                </p>
                <div className="relative">
                  <div className="w-full lg:w-[440px] h-[10px] bg-[#d9d9d9] mb-[2px] rounded-full" />
                  <div
                    className="absolute top-0 left-0 h-[10px] bg-black rounded-full"
                    style={{ width: `${comment.riskPercent}%` }}
                  />
                  <p className="text-xs lg:text-[12px] font-normal text-black mt-1">
                    위험도 {comment.riskPercent}%
                  </p>
                </div>
                <div className="absolute right-4 lg:right-0 top-[29px] w-[24px] h-[24px] lg:w-[32px] lg:h-[32px] flex items-center justify-center opacity-50">
                  <div className="rotate-90">
                    <img
                      src={imgPolygon1}
                      alt="Expand"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 유형별 분류 섹션 */}
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-bold text-black mb-6 lg:mb-[40px]">
            유형별 분류
          </h2>
          <div className="flex justify-center lg:justify-start">
            <DonutChart
              data={[
                { label: "욕설", value: 2400, color: "#1E40AF" },
                { label: "혐오", value: 1900, color: "#3B82F6" },
                { label: "위협", value: 900, color: "#10B981" },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
