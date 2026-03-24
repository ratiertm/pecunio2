"use client";

import { useApp } from "@/lib/context";
import { getStore } from "@/lib/store";
import { LevelBar } from "@/components/learn/level-bar";
import { LessonList } from "@/components/learn/lesson-list";
import type { LessonItem } from "@/components/learn/lesson-list";
import { LESSONS } from "@/lib/learning/content";
import { getLevelForXP, LEVELS } from "@/types";

export default function LearnPage() {
  const { user, refresh } = useApp();
  const store = getStore();
  const level = getLevelForXP(user.xp);
  const nextLevel = LEVELS.find((l) => l.level === level.level + 1) ?? null;
  const attempts = store.getQuizAttempts();
  const completedIds = new Set(attempts.map((a) => a.lesson_id));

  function getLessonStatus(lessonId: string, index: number): "completed" | "current" | "locked" {
    if (completedIds.has(lessonId)) return "completed";
    // First uncompleted lesson is current; rest are locked
    // But first lesson is always unlocked
    if (index === 0 && !completedIds.has(LESSONS[0].id)) return "current";
    // Check if previous lesson is completed
    if (index > 0 && completedIds.has(LESSONS[index - 1].id)) return "current";
    if (completedIds.size === 0 && index === 0) return "current";
    return "locked";
  }

  const lessonItems: LessonItem[] = LESSONS.map((l, i) => ({
    id: l.id,
    chapter: l.chapter,
    order: l.order,
    title: l.title,
    xp_reward: l.xp_reward,
    status: getLessonStatus(l.id, i),
  }));

  const ch1 = lessonItems.filter((l) => l.chapter === 1);
  const ch2 = lessonItems.filter((l) => l.chapter === 2);
  const completedCount = completedIds.size;
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
    : 0;

  return (
    <div className="space-y-8 pb-20 sm:pb-0">
      <LevelBar level={level} xp={user.xp} nextLevel={nextLevel} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card flex flex-col items-center rounded-2xl p-5 text-center">
          <p className="text-2xl font-bold text-primary">{completedCount}/{LESSONS.length}</p>
          <p className="mt-1 text-[13px] text-text-tertiary">완료한 레슨</p>
        </div>
        <div className="card flex flex-col items-center rounded-2xl p-5 text-center">
          <p className="text-2xl font-bold text-accent">{avgScore > 0 ? `${avgScore}%` : "—"}</p>
          <p className="mt-1 text-[13px] text-text-tertiary">퀴즈 평균 점수</p>
        </div>
        <div className="card flex flex-col items-center rounded-2xl p-5 text-center">
          <p className="text-2xl font-bold text-primary">{user.xp}</p>
          <p className="mt-1 text-[13px] text-text-tertiary">총 XP</p>
        </div>
      </div>

      <LessonList chapterTitle="Chapter 1: 투자의 기초" lessons={ch1} />
      <LessonList chapterTitle="Chapter 2: 투자 심리의 함정" lessons={ch2} />
    </div>
  );
}
