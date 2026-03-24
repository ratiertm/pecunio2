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
    <div className="card flex items-center gap-4 rounded-2xl p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-md shadow-primary/20">
        {level.level}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[15px] font-bold text-text-primary">
            Lv.{level.level} {level.title}
          </span>
          <span className="text-[13px] font-medium text-text-tertiary">
            {xp} / {nextLevel?.min_xp ?? level.max_xp} XP
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-primary-light">
          <div
            className="animate-progress h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
