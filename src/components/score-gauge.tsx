"use client";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "lg";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getScoreStroke(score: number): string {
  if (score >= 80) return "stroke-green-400";
  if (score >= 60) return "stroke-yellow-400";
  if (score >= 40) return "stroke-orange-400";
  return "stroke-red-400";
}

function getScoreGlow(score: number): string {
  if (score >= 80) return "drop-shadow-[0_0_6px_rgba(74,222,128,0.4)]";
  if (score >= 60) return "drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]";
  if (score >= 40) return "drop-shadow-[0_0_6px_rgba(251,146,60,0.4)]";
  return "drop-shadow-[0_0_6px_rgba(248,113,113,0.4)]";
}

export function ScoreGauge({ score, size = "sm" }: ScoreGaugeProps) {
  const radius = size === "lg" ? 45 : 22;
  const svgSize = size === "lg" ? 120 : 56;
  const strokeWidth = size === "lg" ? 7 : 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${getScoreGlow(score)}`}
    >
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
          className={`${getScoreStroke(score)} transition-all duration-700`}
        />
      </svg>
      <span
        className={`absolute font-bold ${getScoreColor(score)} ${
          size === "lg" ? "text-2xl" : "text-xs"
        }`}
      >
        {score}
      </span>
    </div>
  );
}
