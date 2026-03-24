import { describe, it, expect } from "vitest";
import { getLevelForXP, LEVELS } from "./index";

describe("Level System", () => {
  it("has 10 levels", () => {
    expect(LEVELS).toHaveLength(10);
  });

  it("levels are sorted by min_xp", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].min_xp).toBeGreaterThan(LEVELS[i - 1].min_xp);
    }
  });

  it("getLevelForXP returns level 1 for 0 XP", () => {
    expect(getLevelForXP(0).level).toBe(1);
  });

  it("getLevelForXP returns correct levels at boundaries", () => {
    expect(getLevelForXP(0).level).toBe(1);
    expect(getLevelForXP(149).level).toBe(1);
    expect(getLevelForXP(150).level).toBe(2);
    expect(getLevelForXP(300).level).toBe(3);
    expect(getLevelForXP(3500).level).toBe(10);
    expect(getLevelForXP(9999).level).toBe(10);
  });

  it("each level has a title", () => {
    LEVELS.forEach((l) => expect(l.title).toBeTruthy());
  });

  it("level 2 unlocks basic trading", () => {
    const l2 = LEVELS.find((l) => l.level === 2);
    expect(l2!.unlocks).toContain("기본 모의 매매");
  });

  it("level 9 unlocks real trading qualification", () => {
    const l9 = LEVELS.find((l) => l.level === 9);
    expect(l9!.unlocks).toContain("실거래 전환 자격");
  });
});
