import { supabase } from "@/lib/supabase";
import { getLevelForXP, LEVELS } from "@/types";
import type { Lesson, QuizAttempt, LevelInfo } from "@/types";

// ===========================
// Learning System
// ===========================
//
// Lesson flow:
//   getLessonContent(lessonId, userId)
//       │
//       ├── unlocked? → return content
//       └── locked?   → 403 + unlock requirements
//
// Quiz flow:
//   submitQuiz(userId, lessonId, answers)
//       │
//       ├── all correct → full XP (100) + bonus (50)
//       ├── partial     → partial XP
//       └── already done → no additional XP
//
// XP thresholds:
//   Lesson complete: 100 XP
//   Quiz perfect:    +50 XP bonus
//   Bias overcome:   +30 XP
// ===========================

const XP_LESSON_COMPLETE = 100;
const XP_QUIZ_PERFECT_BONUS = 50;

export async function getLessonContent(
  lessonId: string,
  userId: string
): Promise<{ lesson: Lesson; completed: boolean; locked: boolean; lockReason?: string }> {
  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();

  if (!lesson) throw new Error("레슨을 찾을 수 없습니다");

  // Check if locked (previous lessons must be completed)
  const locked = await isLessonLocked(lesson, userId);

  if (locked) {
    return {
      lesson: { ...lesson, content_md: "" },
      completed: false,
      locked: true,
      lockReason: `이전 레슨을 먼저 완료해주세요`,
    };
  }

  // Check if already completed
  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .limit(1)
    .single();

  return {
    lesson: lesson as Lesson,
    completed: !!attempt,
    locked: false,
  };
}

async function isLessonLocked(lesson: Lesson, userId: string): Promise<boolean> {
  // First lesson is always unlocked
  if (lesson.chapter === 1 && lesson.order === 1) return false;

  // Find previous lesson
  const { data: prevLessons } = await supabase
    .from("lessons")
    .select("id")
    .or(
      `and(chapter.eq.${lesson.chapter},order.lt.${lesson.order}),chapter.lt.${lesson.chapter}`
    )
    .order("chapter", { ascending: false })
    .order("order", { ascending: false })
    .limit(1);

  if (!prevLessons || prevLessons.length === 0) return false;

  const prevLessonId = prevLessons[0].id;
  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id")
    .eq("user_id", userId)
    .eq("lesson_id", prevLessonId)
    .limit(1)
    .single();

  return !attempt;
}

export async function submitQuiz(
  userId: string,
  lessonId: string,
  answers: number[]
): Promise<{ score: number; xpEarned: number; newLevel: LevelInfo; correct: boolean[] }> {
  // Check if already completed
  const { data: existing } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .limit(1)
    .single();

  if (existing) {
    const user = await getUser(userId);
    return {
      score: existing.score,
      xpEarned: 0,
      newLevel: getLevelForXP(user.xp),
      correct: [],
    };
  }

  // Get quiz questions
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("id");

  if (!questions || questions.length === 0) {
    throw new Error("퀴즈 문제를 찾을 수 없습니다");
  }

  // Grade
  const correct = questions.map(
    (q, i) => answers[i] === q.correct_index
  );
  const correctCount = correct.filter(Boolean).length;
  const score = Math.round((correctCount / questions.length) * 100);
  const isPerfect = correctCount === questions.length;

  // Calculate XP
  const baseXP = XP_LESSON_COMPLETE;
  const bonusXP = isPerfect ? XP_QUIZ_PERFECT_BONUS : 0;
  const xpEarned = baseXP + bonusXP;

  // Record attempt
  await supabase.from("quiz_attempts").insert({
    user_id: userId,
    lesson_id: lessonId,
    score,
    completed_at: new Date().toISOString(),
  });

  // Update user XP
  await supabase.rpc("add_user_xp", {
    p_user_id: userId,
    p_xp: xpEarned,
  });

  const user = await getUser(userId);
  const newLevel = getLevelForXP(user.xp);

  // Update user level if changed
  if (newLevel.level !== user.level) {
    await supabase
      .from("users")
      .update({ level: newLevel.level })
      .eq("id", userId);
  }

  return { score, xpEarned, newLevel, correct };
}

async function getUser(userId: string) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!data) throw new Error("사용자를 찾을 수 없습니다");
  return data;
}

export function getProgressSummary(
  xp: number
): { level: LevelInfo; progress: number; nextLevel: LevelInfo | null } {
  const level = getLevelForXP(xp);
  const nextLevel =
    LEVELS.find((l) => l.level === level.level + 1) ?? null;

  const progress = nextLevel
    ? (xp - level.min_xp) / (nextLevel.min_xp - level.min_xp)
    : 1;

  return { level, progress, nextLevel };
}
