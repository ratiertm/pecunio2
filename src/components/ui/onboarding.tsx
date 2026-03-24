"use client";

import { useApp } from "@/lib/context";
import { getStore } from "@/lib/store";
import Link from "next/link";

export function OnboardingBanner() {
  const { tradeCount } = useApp();
  const store = getStore();
  const quizAttempts = store.getQuizAttempts();

  // Show if user hasn't completed first 2 lessons
  if (quizAttempts.length >= 2) return null;

  const lessonsDone = quizAttempts.length;

  return (
    <div className="animate-fade-in-up overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-primary-light/60 to-accent-light/40">
      <div className="flex items-start gap-4 p-6">
        <span className="mt-0.5 text-3xl">👋</span>
        <div className="flex-1">
          <p className="text-[17px] font-bold text-text-primary">
            {lessonsDone === 0
              ? "pecunio2에 오신 것을 환영합니다!"
              : `학습 진행 중 (${lessonsDone}/2)`}
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-text-secondary">
            {lessonsDone === 0
              ? "매매를 시작하기 전에 기초를 배워볼까요? 2개 레슨만 완료하면 매매 기능이 활성화됩니다."
              : "1개 레슨만 더 완료하면 매매를 시작할 수 있습니다!"}
          </p>
          <Link
            href="/learn"
            className="btn-primary mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-[14px]"
          >
            {lessonsDone === 0 ? "학습 시작하기" : "이어서 학습하기"}
            <span>→</span>
          </Link>
        </div>
      </div>
      {/* Progress dots */}
      <div className="flex gap-2 border-t border-primary/10 bg-white/50 px-6 py-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${i < lessonsDone ? "bg-success" : "bg-card-border"}`} />
            <span className="text-[12px] text-text-tertiary">레슨 {i + 1}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-card-border" />
          <span className="text-[12px] text-text-tertiary">매매 시작</span>
        </div>
      </div>
    </div>
  );
}

export function useCanTrade(): boolean {
  const store = getStore();
  const quizAttempts = store.getQuizAttempts();
  return quizAttempts.length >= 2;
}
