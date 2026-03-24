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
    <div className="rounded-lg border-2 border-blue-400 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">👋</span>
        <div className="flex-1">
          <p className="font-semibold text-blue-900">
            {lessonsDone === 0
              ? "pecunio2에 오신 것을 환영합니다!"
              : `학습 진행 중 (${lessonsDone}/2)`}
          </p>
          <p className="mt-1 text-sm text-blue-800">
            {lessonsDone === 0
              ? "매매를 시작하기 전에 기초를 배워볼까요? 2개 레슨만 완료하면 매매 기능이 활성화됩니다."
              : "1개 레슨만 더 완료하면 매매를 시작할 수 있습니다!"}
          </p>
          <Link
            href="/learn"
            className="mt-2 inline-block rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {lessonsDone === 0 ? "학습 시작하기" : "이어서 학습하기"}
          </Link>
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
