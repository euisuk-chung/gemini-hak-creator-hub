"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import RiskGauge from "@/components/analysis/RiskGauge";

// 임시 이미지 URL
const imgVector1 = "http://localhost:3845/assets/bf1af201689fc0314debd506b98d3e2a10ffa3c9.svg";

export default function SummaryPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 실제 데이터를 API에서 가져오기
    setLoading(false);
  }, []);

  // 더미 데이터
  const dummyData = {
    highestRiskVideo: {
      title: "영상이름",
      views: "조회수",
      comments: "댓글수",
      date: "yyyy-mm-dd",
      commentCount: 1234,
      totalComments: 1234,
      maliciousComments: 234,
      maliciousRatio: 15,
      riskIndex: 65,
    },
    videoList: [
      { title: "영상이름이름", index: 75, status: "CAUTION" },
      { title: "영상이름이름", index: 70, status: "CAUTION" },
      { title: "영상이름이름", index: 65, status: "CAUTION" },
      { title: "영상이름이름", index: 60, status: "CAUTION" },
    ],
  };

  return (
    <div className="bg-white relative min-h-screen" data-name="Desktop - 2">
      <Sidebar />
      
      <div className="lg:ml-[320px] px-4 sm:px-6 lg:px-0 pt-20 lg:pt-[61px] pb-8 lg:pb-0 lg:pl-[46px]">
        {/* 헤더 */}
        <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-bold text-black mb-10 lg:mb-[80px]">
          이번 주 요약
        </h1>

        {/* 제일 높은 위험 영상 섹션 */}
        <div className="mb-12 lg:mb-[89px]">
          <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-bold text-black mb-8 lg:mb-[67px]">
            제일높은위험영상
          </h2>
          
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-[60px] items-start">
            {/* 썸네일 */}
            <div className="w-full sm:w-[400px] lg:w-[300px] h-auto sm:h-[225px] lg:h-[160px] bg-[#d9d9d9] flex-shrink-0 rounded-lg" />

            {/* 영상 정보 */}
            <div className="flex-1 w-full">
              <h3 className="text-xl sm:text-2xl lg:text-[40px] font-bold text-black mb-4 lg:mb-[31px] break-words">
                {dummyData.highestRiskVideo.title}
              </h3>
              <div className="space-y-4 lg:space-y-[27px]">
                <div className="flex flex-wrap gap-3 lg:gap-[19px]">
                  <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black">
                    {dummyData.highestRiskVideo.views}
                  </p>
                  <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black">
                    {dummyData.highestRiskVideo.comments}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 lg:gap-[19px]">
                  <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black">
                    {dummyData.highestRiskVideo.date}
                  </p>
                  <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black">
                    {dummyData.highestRiskVideo.commentCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 통계 섹션 */}
          <div className="mt-8 lg:mt-[64px] flex flex-col lg:flex-row items-start gap-6 lg:gap-[119px]">
            {/* 통계 카드들 */}
            <div className="flex flex-wrap gap-6 lg:gap-[119px] w-full lg:w-auto">
              <div>
                <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black mb-2 lg:mb-[12px]">
                  총 댓글 수
                </p>
                <p className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-black">
                  {dummyData.highestRiskVideo.totalComments}
                </p>
              </div>
              <div>
                <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black mb-2 lg:mb-[12px]">
                  악성 댓글 수
                </p>
                <p className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-black">
                  {dummyData.highestRiskVideo.maliciousComments}
                </p>
              </div>
              <div>
                <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black mb-2 lg:mb-[12px]">
                  악성 비율
                </p>
                <p className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-black">
                  {dummyData.highestRiskVideo.maliciousRatio}%
                </p>
              </div>
            </div>

            {/* 위험도 지수 */}
            <div className="w-full lg:w-auto lg:ml-auto flex flex-col items-start lg:items-end">
              <p className="text-base sm:text-lg lg:text-[20px] font-bold text-black mb-4 lg:mb-[35px]">
                위험도 지수
              </p>
              <RiskGauge score={dummyData.highestRiskVideo.riskIndex} />
            </div>
          </div>
        </div>

        {/* 영상별 위험도 섹션 */}
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-bold text-black mb-8 lg:mb-[78px]">
            영상별 위험도
          </h2>

          {/* 테이블 헤더 */}
          <div className="hidden lg:flex items-center mb-8 lg:mb-[48px]">
            <p className="text-xl lg:text-[24px] font-bold text-[#858585] w-[440px]">
              영상 제목
            </p>
            <p className="text-xl lg:text-[24px] font-bold text-[#858585] w-[393px]">
              지수
            </p>
            <p className="text-xl lg:text-[24px] font-bold text-[#858585]">
              상태
            </p>
          </div>

          {/* 구분선 */}
          <div className="hidden lg:block w-full max-w-[969px] h-px mb-6 lg:mb-[24px]">
            <img
              src={imgVector1}
              alt="Divider"
              className="w-full h-full"
            />
          </div>

          {/* 테이블 행들 */}
          <div className="space-y-6 lg:space-y-[39px]">
            {dummyData.videoList.map((video, index) => (
              <div key={index} className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0 bg-stone-50 lg:bg-transparent rounded-lg p-4 lg:p-0">
                <p className="text-lg lg:text-[24px] font-bold text-black lg:w-[440px] break-words">
                  {video.title}
                </p>
                <div className="flex items-center gap-4 lg:gap-[20px] lg:w-[393px]">
                  <div className="flex-1 lg:flex-none">
                    <div
                      className="h-4 lg:h-[20px] bg-black rounded-full"
                      style={{ width: `${Math.min((video.index / 100) * 140, 100)}%` }}
                    />
                  </div>
                  <p className="text-lg lg:text-[24px] font-bold text-black">
                    {video.index}
                  </p>
                </div>
                <p className="text-lg lg:text-[24px] font-bold text-black">
                  {video.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
