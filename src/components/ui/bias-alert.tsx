"use client";

import type { BiasCheckResult } from "@/types";

interface BiasAlertProps {
  result: BiasCheckResult;
  onDelay: () => void;
  onLearn: () => void;
  onIgnore: () => void;
}

const severityStyles = {
  high: "border-danger/30 bg-danger-light",
  medium: "border-warning/30 bg-warning-light",
  low: "border-warning/20 bg-[#fffcf5]",
};

const severityIcon = {
  high: "🚨",
  medium: "⚠️",
  low: "💡",
};

const severityTitle = {
  high: "text-danger",
  medium: "text-warning",
  low: "text-text-secondary",
};

const biasLabels: Record<string, string> = {
  loss_aversion: "손실 회피 편향 감지",
  overconfidence: "과신 편향 감지",
  confirmation: "확증 편향 감지",
  herd: "군중 심리 감지",
};

export function BiasAlert({ result, onDelay, onLearn, onIgnore }: BiasAlertProps) {
  if (!result.detected || !result.type || !result.severity) return null;

  return (
    <div className={`animate-fade-in-up rounded-2xl border-2 p-5 ${severityStyles[result.severity]}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">{severityIcon[result.severity]}</span>
        <p className={`text-sm font-bold ${severityTitle[result.severity]}`}>
          {biasLabels[result.type] || "편향 감지"}
        </p>
      </div>
      <p className="mb-4 text-[15px] leading-relaxed text-text-secondary">
        {result.message}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onDelay}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:shadow-md hover:shadow-accent/20 active:scale-[0.98]"
        >
          30분 후 재검토
        </button>
        <button
          onClick={onLearn}
          className="rounded-xl border-2 border-accent/30 bg-white px-4 py-2.5 text-sm font-semibold text-accent transition-all duration-150 hover:bg-accent-light active:scale-[0.98]"
        >
          편향 학습 보기
        </button>
        <button
          onClick={onIgnore}
          className="rounded-xl border border-card-border bg-white px-4 py-2.5 text-sm font-semibold text-text-tertiary transition-all duration-150 hover:bg-surface-hover active:scale-[0.98]"
        >
          무시하고 진행
        </button>
      </div>
    </div>
  );
}
