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
      <div className="py-12 text-center text-gray-500">
        레슨을 찾을 수 없습니다.
        <br />
        <button onClick={() => router.push("/learn")} className="mt-2 text-sm text-blue-600 underline">
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
    .replace(/^### (.+)$/gm, '<h3 class="mt-4 mb-2 text-base font-semibold">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-6 mb-2 text-lg font-bold">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="mt-4 mb-3 text-xl font-bold">$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 my-3 text-gray-600 italic">$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm leading-relaxed">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm leading-relaxed">$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/g, "").trim();
      return `<pre class="bg-gray-100 rounded-md p-3 my-2 text-sm font-mono overflow-x-auto">${code}</pre>`;
    });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/learn")}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← 학습 목록
      </button>

      {/* Lesson header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="mb-1 text-xs font-medium text-gray-500">
          Chapter {lesson.chapter} · 레슨 {lesson.order}
        </p>
        <h1 className="text-xl font-bold">{lesson.title}</h1>
        {existing && (
          <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            완료됨 · {existing.score}점
          </span>
        )}
      </div>

      {/* Content */}
      <div
        className="prose prose-sm rounded-lg border border-gray-200 bg-white p-6"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* Quiz section */}
      {!showQuiz && !quizDone && !existing && (
        <div className="text-center">
          <button
            onClick={() => setShowQuiz(true)}
            className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            퀴즈 풀기 (+{lesson.xp_reward} XP)
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
            className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            다음 레슨으로 →
          </button>
        </div>
      )}
    </div>
  );
}
