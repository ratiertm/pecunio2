import { describe, it, expect } from "vitest";
import { LESSONS, getLesson, getLessonsByChapter } from "./content";

describe("Learning Content", () => {
  it("has 8 lessons total", () => {
    expect(LESSONS).toHaveLength(8);
  });

  it("has 4 lessons per chapter", () => {
    expect(getLessonsByChapter(1)).toHaveLength(4);
    expect(getLessonsByChapter(2)).toHaveLength(4);
  });

  it("each lesson has content and questions", () => {
    for (const lesson of LESSONS) {
      expect(lesson.title).toBeTruthy();
      expect(lesson.content_md.length).toBeGreaterThan(100);
      expect(lesson.questions.length).toBeGreaterThanOrEqual(3);
      expect(lesson.xp_reward).toBe(100);
    }
  });

  it("each question has 4 options and valid correct_index", () => {
    for (const lesson of LESSONS) {
      for (const q of lesson.questions) {
        expect(q.options).toHaveLength(4);
        expect(q.correct_index).toBeGreaterThanOrEqual(0);
        expect(q.correct_index).toBeLessThan(4);
        expect(q.explanation).toBeTruthy();
      }
    }
  });

  it("getLesson returns lesson by id", () => {
    const lesson = getLesson("c1l1");
    expect(lesson).toBeTruthy();
    expect(lesson!.title).toBe("주식이란?");
  });

  it("getLesson returns undefined for invalid id", () => {
    expect(getLesson("nonexistent")).toBeUndefined();
  });

  it("lessons have unique ids", () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("lessons are ordered by chapter and order", () => {
    for (let i = 1; i < LESSONS.length; i++) {
      const prev = LESSONS[i - 1];
      const curr = LESSONS[i];
      const prevSort = prev.chapter * 100 + prev.order;
      const currSort = curr.chapter * 100 + curr.order;
      expect(currSort).toBeGreaterThan(prevSort);
    }
  });
});
