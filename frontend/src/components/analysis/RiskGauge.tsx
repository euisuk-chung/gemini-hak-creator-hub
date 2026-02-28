"use client";

interface RiskGaugeProps {
  score: number;
}

export default function RiskGauge({ score }: RiskGaugeProps) {
  // 반원 게이지 SVG 생성
  const radius = 50;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const startX = 10;
  const endX = 10 + radius * 2;
  const y = 65;

  return (
    <div className="relative w-[100px] h-[50px] sm:w-[115px] sm:h-[58px] lg:w-[130px] lg:h-[65px]">
      <svg
        className="w-full h-full"
        viewBox="0 0 130 65"
        style={{ overflow: "visible" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 배경 반원 */}
        <path
          d={`M ${startX} ${y} A ${radius} ${radius} 0 0 1 ${endX} ${y}`}
          fill="none"
          stroke="#d9d9d9"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* 채워진 반원 */}
        <path
          d={`M ${startX} ${y} A ${radius} ${radius} 0 0 1 ${endX} ${y}`}
          fill="none"
          stroke="#000000"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(180 65 65)"
          style={{ transformOrigin: "65px 65px" }}
        />
      </svg>
      {/* 점수 표시 */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-1 sm:mb-1.5 lg:mb-2">
        <span className="text-sm sm:text-base lg:text-[16px] font-bold text-black">{score}</span>
      </div>
    </div>
  );
}
