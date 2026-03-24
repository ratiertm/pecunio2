"use client";

import { useState } from "react";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  explanation: string;
  correct_index?: number;
}

interface QuizProps {
  lessonId: string;
  questions: QuizQuestion[];
  correctAnswers?: number[]; // if provided, grade locally
  onComplete: (score: number, xpEarned: number) => void;
}

const XP_LESSON = 100;
const XP_PERFECT_BONUS = 50;

export function Quiz({ lessonId, questions, correctAnswers, onComplete }: QuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean[];
    score: number;
    xpEarned: number;
  } | null>(null);

  const q = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  function handleNext() {
    if (selected === null) return;

    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);

    if (isLast) {
      // Grade locally using correct_index from questions
      const correct = questions.map(
        (q, i) => newAnswers[i] === (q.correct_index ?? correctAnswers?.[i] ?? -1)
      );
      const correctCount = correct.filter(Boolean).length;
      const score = Math.round((correctCount / questions.length) * 100);
      const isPerfect = correctCount === questions.length;
      const xpEarned = XP_LESSON + (isPerfect ? XP_PERFECT_BONUS : 0);

      setResult({ correct, score, xpEarned });
      setShowResult(true);
      onComplete(score, xpEarned);
    } else {
      setCurrentIdx(currentIdx + 1);
      setSelected(null);
    }
  }

  if (showResult && result) {
    const correctCount = result.correct.filter(Boolean).length;
    const isPerfect = correctCount === questions.length;

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
        <p className="mb-2 text-4xl">{isPerfect ? "🎉" : "👍"}</p>
        <p className="text-lg font-bold">
          {correctCount}/{questions.length} 정답
        </p>
        <p className="mt-1 text-sm text-gray-500">
          +{result.xpEarned} XP 획득{isPerfect && " (만점 보너스!)"}
        </p>
        {/* Show explanations */}
        <div className="mt-4 space-y-2 text-left">
          {questions.map((q, i) => (
            <div
              key={i}
              className={`rounded-md p-3 text-xs ${
                result.correct[i] ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              <p className="font-semibold">
                {result.correct[i] ? "✓" : "✗"} {q.question}
              </p>
              <p className="mt-1 text-gray-600">{q.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          문제 {currentIdx + 1}/{questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full ${
                i < currentIdx
                  ? "bg-green-500"
                  : i === currentIdx
                    ? "bg-gray-900"
                    : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      <p className="mb-4 mt-3 text-[15px] font-semibold leading-relaxed">
        {q.question}
      </p>

      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
              selected === i
                ? "border-gray-900 bg-gray-50 font-medium"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            {String.fromCharCode(65 + i)}) {opt}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={selected === null}
        className="mt-4 w-full rounded-md bg-gray-900 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLast ? "제출" : "다음"}
      </button>
    </div>
  );
}
