"use client";

import type { BiasCheckResult } from "@/types";

interface BiasAlertProps {
  result: BiasCheckResult;
  onDelay: () => void;
  onLearn: () => void;
  onIgnore: () => void;
}

const severityStyles = {
  high: "border-red-400 bg-red-50",
  medium: "border-orange-400 bg-orange-50",
  low: "border-yellow-400 bg-yellow-50",
};

const severityTitle = {
  high: "text-red-600",
  medium: "text-orange-600",
  low: "text-yellow-600",
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
    <div className={`rounded-lg border-2 p-4 ${severityStyles[result.severity]}`}>
      <p className={`mb-1.5 text-xs font-bold ${severityTitle[result.severity]}`}>
        {biasLabels[result.type] || "편향 감지"}
      </p>
      <p className="mb-3 text-sm leading-relaxed text-gray-700">
        {result.message}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onDelay}
          className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
        >
          30분 후 재검토
        </button>
        <button
          onClick={onLearn}
          className="rounded-md border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100"
        >
          편향 학습 보기
        </button>
        <button
          onClick={onIgnore}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100"
        >
          무시하고 진행
        </button>
      </div>
    </div>
  );
}
