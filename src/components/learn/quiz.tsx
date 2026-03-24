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
      <div className="card animate-fade-in-up rounded-2xl p-8 text-center">
        <div className="mb-3 text-5xl">{isPerfect ? "🎉" : "👍"}</div>
        <p className="text-2xl font-bold text-text-primary">
          {correctCount}/{questions.length} 정답
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-light px-4 py-1.5">
          <span className="text-sm font-bold text-primary">
            +{result.xpEarned} XP 획득{isPerfect && " (만점 보너스!)"}
          </span>
        </div>
        {/* Show explanations */}
        <div className="mt-6 space-y-3 text-left">
          {questions.map((q, i) => (
            <div
              key={i}
              className={`rounded-2xl p-4 text-[14px] ${
                result.correct[i]
                  ? "bg-success-light text-success"
                  : "bg-danger-light text-danger"
              }`}
            >
              <p className="font-semibold">
                {result.correct[i] ? "✓" : "✗"} {q.question}
              </p>
              <p className="mt-1.5 text-text-secondary">{q.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in-up rounded-2xl p-6">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-text-tertiary">
          문제 {currentIdx + 1}/{questions.length}
        </span>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-all duration-300 ${
                i < currentIdx
                  ? "bg-success"
                  : i === currentIdx
                    ? "bg-primary"
                    : "bg-card-border"
              }`}
            />
          ))}
        </div>
      </div>

      <p className="mb-5 mt-4 text-[17px] font-bold leading-relaxed text-text-primary">
        {q.question}
      </p>

      <div className="space-y-2.5">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`w-full rounded-2xl border-2 px-5 py-3.5 text-left text-[15px] transition-all duration-200 ${
              selected === i
                ? "border-primary bg-primary-light font-medium text-primary shadow-sm shadow-primary/10"
                : "border-card-border text-text-secondary hover:border-primary/30 hover:bg-surface-hover"
            }`}
          >
            <span className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
              selected === i ? "bg-primary text-white" : "bg-surface-hover text-text-tertiary"
            }`}>
              {String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={selected === null}
        className="btn-primary mt-5 w-full rounded-2xl py-3.5 text-[15px] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isLast ? "제출하기" : "다음 문제"}
      </button>
    </div>
  );
}
