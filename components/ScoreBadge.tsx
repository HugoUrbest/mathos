import { getScorePercent, getScoreLabel } from "@/lib/quiz";

interface Props {
  score: number;
  maxScore: number;
  showPoints?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function ScoreBadge({ score, maxScore, showPoints = true, size = "md" }: Props) {
  const pct = getScorePercent(score, maxScore);
  const { label, color } = getScoreLabel(pct);

  const pctSize  = size === "lg" ? "text-5xl" : size === "sm" ? "text-2xl" : "text-4xl";
  const lblSize  = size === "lg" ? "text-lg"  : size === "sm" ? "text-xs"  : "text-base";

  return (
    <div className="text-center">
      <div className={`font-black ${pctSize} ${color}`}>{pct}%</div>
      <div className={`font-semibold mt-0.5 ${lblSize} ${color}`}>{label}</div>
      {showPoints && (
        <div className="text-gray-500 text-sm mt-1">{score} / {maxScore} pts</div>
      )}
    </div>
  );
}
