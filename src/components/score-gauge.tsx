"use client";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "lg";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "stroke-green-500";
  if (score >= 60) return "stroke-yellow-500";
  if (score >= 40) return "stroke-orange-500";
  return "stroke-red-500";
}

export function ScoreGauge({ score, size = "sm" }: ScoreGaugeProps) {
  const radius = size === "lg" ? 45 : 30;
  const svgSize = size === "lg" ? 120 : 80;
  const strokeWidth = size === "lg" ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={svgSize} height={svgSize} className="-rotate-90">
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={getScoreBg(score)}
        />
      </svg>
      <span
        className={`absolute font-bold ${getScoreColor(score)} ${
          size === "lg" ? "text-2xl" : "text-sm"
        }`}
      >
        {score}
      </span>
    </div>
  );
}
