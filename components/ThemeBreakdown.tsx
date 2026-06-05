import { THEME_LABELS, Theme } from "@/lib/types";

interface ThemeScore {
  correct: number;
  total: number;
  score: number;
}

interface Props {
  themeScores: Record<string, ThemeScore>;
  showCounts?: boolean;
}

function themePercent(data: ThemeScore): number {
  const max = data.total * 3;
  const min = data.total * -1;
  const range = max - min;
  return range > 0 ? Math.round(((data.score - min) / range) * 100) : 0;
}

function barColor(pct: number) {
  return pct >= 60 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400";
}

export function ThemeBreakdown({ themeScores, showCounts = false }: Props) {
  return (
    <div className="space-y-2">
      {Object.entries(themeScores).map(([theme, data]) => {
        const pct = themePercent(data);
        return (
          <div key={theme} className="flex items-center gap-3">
            <div className="text-xs text-gray-600 font-medium w-24 shrink-0">
              {THEME_LABELS[theme as Theme] ?? theme}
            </div>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${barColor(pct)}`}
                style={{ width: `${pct}%` }} />
            </div>
            <div className="text-xs font-bold w-10 text-right text-gray-600">{pct}%</div>
            {showCounts && (
              <div className="text-xs text-gray-400 w-16 text-right">{data.correct}/{data.total}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { themePercent };
