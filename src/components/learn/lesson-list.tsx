"use client";

import Link from "next/link";

export interface LessonItem {
  id: string;
  chapter: number;
  order: number;
  title: string;
  xp_reward: number;
  status: "completed" | "current" | "locked";
}

interface LessonListProps {
  lessons: LessonItem[];
  chapterTitle: string;
}

const statusIcon = {
  completed: "✓",
  current: "▶",
  locked: "🔒",
};

const statusStyle = {
  completed: "border-success/20 bg-success-light/50 hover:bg-success-light",
  current: "border-primary/30 bg-primary-light/50 shadow-sm shadow-primary/5 hover:bg-primary-light hover:shadow-md hover:shadow-primary/10",
  locked: "border-card-border bg-surface-hover/30 opacity-60",
};

const iconStyle = {
  completed: "bg-success text-white",
  current: "bg-primary text-white shadow-md shadow-primary/20",
  locked: "bg-card-border text-text-tertiary",
};

function LessonContent({ lesson }: { lesson: LessonItem }) {
  return (
    <>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold transition-transform duration-200 ${iconStyle[lesson.status]}`}
      >
        {statusIcon[lesson.status]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-text-primary">
          {lesson.chapter}-{lesson.order}. {lesson.title}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold ${
          lesson.status === "completed"
            ? "bg-success-light text-success"
            : lesson.status === "current"
              ? "bg-primary-light text-primary"
              : "bg-surface-hover text-text-tertiary"
        }`}
      >
        {lesson.status === "completed"
          ? `+${lesson.xp_reward} XP`
          : lesson.status === "current"
            ? "진행 중"
            : "잠김"}
      </span>
    </>
  );
}

export function LessonList({ lessons, chapterTitle }: LessonListProps) {
  return (
    <div>
      <h3 className="section-title mb-4">
        {chapterTitle}
      </h3>
      <div className="space-y-3">
        {lessons.map((lesson) => {
          const cls = `flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200 ${statusStyle[lesson.status]}`;

          if (lesson.status === "locked") {
            return (
              <div key={lesson.id} className={cls}>
                <LessonContent lesson={lesson} />
              </div>
            );
          }

          return (
            <Link
              key={lesson.id}
              href={`/learn/${lesson.id}`}
              className={`${cls} active:scale-[0.99]`}
            >
              <LessonContent lesson={lesson} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
