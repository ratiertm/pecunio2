"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/lib/context";
import { getStore } from "@/lib/store";
import { getLesson } from "@/lib/learning/content";
import { Quiz } from "@/components/learn/quiz";

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refresh } = useApp();
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizDone, setQuizDone] = useState(false);

  const lesson = getLesson(id);
  if (!lesson) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <span className="mb-3 text-4xl">😅</span>
        <p className="text-[15px] text-text-secondary">레슨을 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push("/learn")}
          className="btn-primary mt-4 rounded-2xl px-6 py-2.5 text-[14px]"
        >
          학습 목록으로 돌아가기
        </button>
      </div>
    );
  }

  const store = getStore();
  const existing = store.getQuizAttempt(lesson.id);

  function handleQuizComplete(score: number, xpEarned: number) {
    if (!existing) {
      store.addQuizAttempt({
        user_id: store.getUser().id,
        lesson_id: lesson!.id,
        score,
        completed_at: new Date().toISOString(),
      });
      store.addXP(xpEarned);
    }
    setQuizDone(true);
    refresh();
  }

  // Simple markdown-ish rendering
  const contentHtml = lesson.content_md
    .replace(/^### (.+)$/gm, '<h3 class="mt-5 mb-2 text-[16px] font-bold text-text-primary">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-8 mb-3 text-[18px] font-bold text-text-primary">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="mt-6 mb-4 text-[20px] font-bold text-text-primary">$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/30 bg-primary-light/30 rounded-r-xl pl-4 pr-4 py-3 my-4 text-text-secondary italic text-[15px]">$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary font-bold">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-5 list-disc text-[15px] leading-relaxed text-text-secondary">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-5 list-decimal text-[15px] leading-relaxed text-text-secondary">$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/g, "").trim();
      return `<pre class="bg-surface-hover rounded-xl p-4 my-3 text-[14px] font-mono overflow-x-auto text-text-secondary">${code}</pre>`;
    });

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-20 sm:pb-0">
      {/* Back button */}
      <button
        onClick={() => router.push("/learn")}
        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[14px] font-medium text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-secondary"
      >
        <span>←</span> 학습 목록
      </button>

      {/* Lesson header */}
      <div className="card rounded-2xl p-7">
        <p className="mb-2 text-[13px] font-semibold text-text-tertiary">
          Chapter {lesson.chapter} · 레슨 {lesson.order}
        </p>
        <h1 className="text-[22px] font-bold leading-snug text-text-primary">{lesson.title}</h1>
        {existing && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-light px-4 py-1.5 text-[13px] font-semibold text-success">
            <span>✓</span> 완료됨 · {existing.score}점
          </span>
        )}
      </div>

      {/* Content */}
      <div
        className="card prose prose-sm rounded-2xl p-7 text-[15px] leading-relaxed text-text-secondary"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* Quiz section */}
      {!showQuiz && !quizDone && !existing && (
        <div className="text-center">
          <button
            onClick={() => setShowQuiz(true)}
            className="btn-primary inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-[15px] shadow-lg shadow-primary/20"
          >
            <span>📝</span> 퀴즈 풀기 (+{lesson.xp_reward} XP)
          </button>
        </div>
      )}

      {showQuiz && !quizDone && (
        <Quiz
          lessonId={lesson.id}
          questions={lesson.questions.map((q, i) => ({
            id: `${lesson.id}-q${i}`,
            question: q.question,
            options: q.options,
            explanation: q.explanation,
            correct_index: q.correct_index,
          }))}
          onComplete={handleQuizComplete}
        />
      )}

      {(quizDone || existing) && (
        <div className="text-center">
          <button
            onClick={() => router.push("/learn")}
            className="btn-primary inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-[15px]"
          >
            다음 레슨으로 <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
}
