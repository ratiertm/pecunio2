import type { LevelInfo } from "@/types";

interface LevelBarProps {
  level: LevelInfo;
  xp: number;
  nextLevel: LevelInfo | null;
}

export function LevelBar({ level, xp, nextLevel }: LevelBarProps) {
  const progress = nextLevel
    ? ((xp - level.min_xp) / (nextLevel.min_xp - level.min_xp)) * 100
    : 100;

  return (
    <div className="flex items-center gap-3">
      <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
        Lv.{level.level} {level.title}
      </span>
      <div className="flex-1">
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gray-900 transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-gray-500">
        {xp} / {nextLevel?.min_xp ?? level.max_xp} XP
      </span>
    </div>
  );
}
