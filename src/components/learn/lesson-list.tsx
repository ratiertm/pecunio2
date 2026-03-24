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
  completed: "border-green-500 bg-green-50",
  current: "border-gray-900 border-2",
  locked: "border-gray-200 opacity-50",
};

const iconStyle = {
  completed: "border-green-500 text-green-600",
  current: "border-gray-900 text-gray-900",
  locked: "border-gray-300 text-gray-400",
};

function LessonContent({ lesson }: { lesson: LessonItem }) {
  return (
    <>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm ${iconStyle[lesson.status]}`}
      >
        {statusIcon[lesson.status]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {lesson.chapter}-{lesson.order}. {lesson.title}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
          lesson.status === "completed"
            ? "border-green-300 text-green-600"
            : lesson.status === "current"
              ? "border-orange-300 text-orange-600"
              : "border-gray-200 text-gray-400"
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
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {chapterTitle}
      </h3>
      <div className="space-y-2.5">
        {lessons.map((lesson) => {
          const cls = `flex items-center gap-3 rounded-lg border p-3.5 transition-colors ${statusStyle[lesson.status]} ${
            lesson.status !== "locked" ? "cursor-pointer hover:shadow-sm" : ""
          }`;

          if (lesson.status === "locked") {
            return (
              <div key={lesson.id} className={cls}>
                <LessonContent lesson={lesson} />
              </div>
            );
          }

          return (
            <Link key={lesson.id} href={`/learn/${lesson.id}`} className={cls}>
              <LessonContent lesson={lesson} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
