// ===========================
// pecunio2 Core Types
// ===========================

// --- User & Auth ---
export interface User {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  created_at: string;
}

// --- Portfolio ---
export type PortfolioMode = "sim" | "real";
export type Market = "KRX" | "US";

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  mode: PortfolioMode;
  initial_cash: number;
  current_cash: number;
}

export interface Holding {
  id: string;
  portfolio_id: string;
  ticker: string;
  market: Market;
  qty: number;
  avg_price: number;
}

// --- Trading ---
export type TradeType = "buy" | "sell";
export type BiasAlertAction = "delay" | "learn" | "ignore" | "none";

export interface Trade {
  id: string;
  portfolio_id: string;
  ticker: string;
  market: Market;
  type: TradeType;
  qty: number;
  price: number;
  emotion_tag?: string;
  confidence?: number; // 1-5, for overconfidence tracking
  bias_alert_shown: boolean;
  bias_alert_action: BiasAlertAction;
  created_at: string;
}

export interface TradeRequest {
  portfolio_id: string;
  ticker: string;
  market: Market;
  type: TradeType;
  qty: number;
  confidence?: number;
  emotion_tag?: string;
}

// --- Market Data ---
export interface Quote {
  ticker: string;
  market: Market;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  timestamp: string;
  is_stale: boolean;
}

export interface TickerSearchResult {
  ticker: string;
  name: string;
  market: Market;
}

// --- Bias Detection ---
export type BiasType =
  | "loss_aversion"
  | "overconfidence"
  | "confirmation"
  | "herd";

export type BiasOutcome = "overcome" | "triggered";

export interface BiasEvent {
  id: string;
  user_id: string;
  trade_id?: string;
  bias_type: BiasType;
  score_delta: number;
  outcome: BiasOutcome;
  context_json: Record<string, unknown>;
}

export interface BiasScores {
  id: string;
  user_id: string;
  loss_aversion: number | null;
  overconfidence: number | null;
  confirmation: number | null;
  herd: number | null;
  total: number | null;
  calculated_at: string;
}

export interface BiasCheckResult {
  detected: boolean;
  type: BiasType | null;
  message: string | null;
  severity: "low" | "medium" | "high" | null;
}

// --- Learning ---
export interface Lesson {
  id: string;
  chapter: number;
  order: number;
  title: string;
  content_md: string;
  xp_reward: number;
}

export interface QuizQuestion {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  lesson_id: string;
  score: number;
  completed_at: string;
}

// --- Level System ---
export interface LevelInfo {
  level: number;
  title: string;
  min_xp: number;
  max_xp: number;
  unlocks: string[];
}

export const LEVELS: LevelInfo[] = [
  { level: 1, title: "투자 입문자", min_xp: 0, max_xp: 150, unlocks: ["기본 학습"] },
  { level: 2, title: "투자 입문자", min_xp: 150, max_xp: 300, unlocks: ["기본 모의 매매"] },
  { level: 3, title: "견습 투자자", min_xp: 300, max_xp: 500, unlocks: ["편향 분석 대시보드"] },
  { level: 4, title: "견습 투자자", min_xp: 500, max_xp: 750, unlocks: [] },
  { level: 5, title: "견습 투자자", min_xp: 750, max_xp: 1000, unlocks: [] },
  { level: 6, title: "숙련 투자자", min_xp: 1000, max_xp: 1500, unlocks: ["AI 코치"] },
  { level: 7, title: "숙련 투자자", min_xp: 1500, max_xp: 2000, unlocks: [] },
  { level: 8, title: "숙련 투자자", min_xp: 2000, max_xp: 2500, unlocks: [] },
  { level: 9, title: "마스터 투자자", min_xp: 2500, max_xp: 3500, unlocks: ["실거래 전환 자격"] },
  { level: 10, title: "마스터 투자자", min_xp: 3500, max_xp: 5000, unlocks: [] },
];

export function getLevelForXP(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min_xp) return LEVELS[i];
  }
  return LEVELS[0];
}
