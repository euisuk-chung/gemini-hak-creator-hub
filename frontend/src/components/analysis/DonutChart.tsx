"use client";

interface DonutChartData {
  id?: string;
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
}

export default function DonutChart({ data, selectedId, onSelect }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const centerX = 200;
  const centerY = 200;
  const radius = 150;
  const innerRadius = 82;
  const pushOut = 14; // 선택 시 바깥으로 밀리는 거리

  let currentAngle = -90;

  const slices = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    const midAngle = (startAngle + endAngle) / 2;
    const midAngleRad = ((midAngle - 90) * Math.PI) / 180;

    const startAngleRad = ((startAngle - 90) * Math.PI) / 180;
    const endAngleRad   = ((endAngle   - 90) * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    const x3 = centerX + innerRadius * Math.cos(endAngleRad);
    const y3 = centerY + innerRadius * Math.sin(endAngleRad);
    const x4 = centerX + innerRadius * Math.cos(startAngleRad);
    const y4 = centerY + innerRadius * Math.sin(startAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      "Z",
    ].join(" ");

    // 선택 시 바깥으로 translate
    const tx = Math.cos(midAngleRad) * pushOut;
    const ty = Math.sin(midAngleRad) * pushOut;

    currentAngle += angle;

    return { item, pathData, tx, ty, pct: Math.round(percentage) };
  });

  const hasSelection = selectedId != null;

  // 선택된 항목 정보
  const selectedItem = selectedId ? data.find((d) => d.id === selectedId) : null;

  return (
    <div className="relative w-full max-w-[400px] aspect-square mx-auto">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
      >
        {slices.map(({ item, pathData, tx, ty, pct }) => {
          const isSelected = item.id != null && item.id === selectedId;
          const isDimmed   = hasSelection && !isSelected;

          return (
            <path
              key={item.id ?? item.label}
              d={pathData}
              fill={item.color}
              stroke="white"
              strokeWidth="2.5"
              opacity={isDimmed ? 0.3 : 1}
              transform={isSelected ? `translate(${tx}, ${ty})` : "translate(0,0)"}
              style={{
                cursor: onSelect ? "pointer" : "default",
                transition: "opacity 0.2s, transform 0.25s",
              }}
              onClick={() => {
                if (!onSelect) return;
                onSelect(isSelected ? null : (item.id ?? null));
              }}
            />
          );
        })}
      </svg>

      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {selectedItem ? (
          <>
            <span
              className="text-2xl font-bold leading-none"
              style={{ color: selectedItem.color }}
            >
              {selectedItem.value}건
            </span>
            <span
              className="text-xs font-medium mt-1 text-center px-4"
              style={{ color: selectedItem.color, opacity: 0.8 }}
            >
              {selectedItem.label}
            </span>
          </>
        ) : (
          <>
            <span className="text-2xl font-bold leading-none" style={{ color: "var(--text-primary)" }}>
              {total}
            </span>
            <span className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              전체 악성 댓글
            </span>
          </>
        )}
      </div>
    </div>
  );
}
