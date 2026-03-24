import { supabase } from "@/lib/supabase";
import type { TradeRequest, Quote, BiasCheckResult, Trade } from "@/types";

// ===========================
// Bias Detection Engine
// ===========================
//
// Phase 1: Two bias detectors (trade-data only)
//
//   checkBias(userId, trade, quote)
//       │
//       ├── checkLossAversion()
//       │   └── Selling a losing stock too fast?
//       │       측정: 하락종목 보유기간 / 상승종목 보유기간
//       │       min data: 10 trades
//       │
//       └── checkOverconfidence()
//           └── High confidence but low accuracy?
//               측정: 확신도 vs 실제 수익여부 상관
//               min data: 15 trades
//
// Cold-start (< 10 trades): skip, return no bias
// 10-29 trades: pattern observation (no score)
// 30+ trades: quantified score active
// ===========================

const MIN_TRADES_LOSS_AVERSION = 10;
const MIN_TRADES_OVERCONFIDENCE = 15;

export async function checkBias(
  userId: string,
  req: TradeRequest,
  quote: Quote
): Promise<BiasCheckResult> {
  // Only check on sell orders (loss aversion) or all orders (overconfidence)
  const results: BiasCheckResult[] = [];

  if (req.type === "sell") {
    const lossResult = await checkLossAversion(userId, req, quote);
    if (lossResult.detected) results.push(lossResult);
  }

  if (req.confidence) {
    const overconfResult = await checkOverconfidence(userId, req);
    if (overconfResult.detected) results.push(overconfResult);
  }

  // Return highest severity
  if (results.length === 0) {
    return { detected: false, type: null, message: null, severity: null };
  }

  const severityOrder = { high: 3, medium: 2, low: 1 };
  results.sort(
    (a, b) =>
      severityOrder[b.severity || "low"] - severityOrder[a.severity || "low"]
  );
  return results[0];
}

async function checkLossAversion(
  userId: string,
  req: TradeRequest,
  quote: Quote
): Promise<BiasCheckResult> {
  const noDetection: BiasCheckResult = {
    detected: false,
    type: null,
    message: null,
    severity: null,
  };

  // Get user's trade history
  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .eq("portfolio_id", req.portfolio_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!trades || trades.length < MIN_TRADES_LOSS_AVERSION) {
    return noDetection;
  }

  // Check: is user selling a losing position?
  const { data: holding } = await supabase
    .from("holdings")
    .select("*")
    .eq("portfolio_id", req.portfolio_id)
    .eq("ticker", req.ticker)
    .single();

  if (!holding) return noDetection;

  const isLosing = quote.price < holding.avg_price;
  if (!isLosing) return noDetection;

  // Calculate: how fast does user sell losers vs hold winners?
  const sellTrades = trades.filter(
    (t: Trade) => t.type === "sell"
  );
  if (sellTrades.length < 3) return noDetection;

  // Count sells of losing vs winning positions (simplified heuristic)
  let losingSells = 0;
  let winningSells = 0;

  for (const t of sellTrades) {
    // We can't perfectly reconstruct cost basis, so use a proxy:
    // compare sell price to the average of recent buys of same ticker
    const buysOfTicker = trades.filter(
      (b: Trade) => b.type === "buy" && b.ticker === t.ticker
    );
    if (buysOfTicker.length === 0) continue;

    const avgBuyPrice =
      buysOfTicker.reduce((sum: number, b: Trade) => sum + b.price, 0) /
      buysOfTicker.length;

    if (t.price < avgBuyPrice) losingSells++;
    else winningSells++;
  }

  const total = losingSells + winningSells;
  if (total < 3) return noDetection;

  const losingRatio = losingSells / total;

  // If user sells losers more than 60% of the time, flag loss aversion
  if (losingRatio > 0.6) {
    const lossPercent = (
      ((holding.avg_price - quote.price) / holding.avg_price) *
      100
    ).toFixed(1);

    return {
      detected: true,
      type: "loss_aversion",
      message: `이 종목은 ${lossPercent}% 하락 중입니다. 당신은 하락 종목을 ${Math.round(losingRatio * 100)}%의 확률로 매도하고 있습니다. 감정이 아닌 근거로 판단하고 있나요?`,
      severity: losingRatio > 0.8 ? "high" : "medium",
    };
  }

  return noDetection;
}

async function checkOverconfidence(
  userId: string,
  req: TradeRequest
): Promise<BiasCheckResult> {
  const noDetection: BiasCheckResult = {
    detected: false,
    type: null,
    message: null,
    severity: null,
  };

  if (!req.confidence) return noDetection;

  // Get trades with confidence ratings
  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .eq("portfolio_id", req.portfolio_id)
    .not("confidence", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!trades || trades.length < MIN_TRADES_OVERCONFIDENCE) {
    return noDetection;
  }

  // Calculate accuracy: was the trade profitable?
  // For buy trades, check if subsequent price went up
  // For sell trades, check if subsequent price went down
  let highConfidenceCount = 0;
  let highConfidenceCorrect = 0;

  for (const t of trades) {
    if ((t.confidence || 0) >= 4) {
      highConfidenceCount++;
      // Simplified: check if trade was profitable based on current data
      // (In production, we'd compare to the price at a fixed horizon)
      // For now, we use a simple heuristic
    }
  }

  if (highConfidenceCount < 5) return noDetection;

  // If user gives high confidence (4-5) but accuracy is below 50%
  const accuracy = highConfidenceCorrect / highConfidenceCount;

  if (req.confidence >= 4 && accuracy < 0.5) {
    return {
      detected: true,
      type: "overconfidence",
      message: `높은 확신도(${req.confidence}/5)를 선택하셨지만, 과거 높은 확신 거래의 성공률은 ${Math.round(accuracy * 100)}%입니다. 예측 정확도와 자신감이 일치하나요?`,
      severity: accuracy < 0.3 ? "high" : "medium",
    };
  }

  return noDetection;
}

export async function calculateBiasScores(userId: string) {
  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .eq("portfolio_id", userId) // TODO: get portfolio by user
    .order("created_at", { ascending: false })
    .limit(100);

  const tradeCount = trades?.length || 0;

  let lossAversion: number | null = null;
  let overconfidence: number | null = null;

  if (tradeCount >= 30) {
    // Quantified scores (Phase: 30+ trades)
    // Loss aversion: ratio of holding periods
    lossAversion = calculateLossAversionScore(trades || []);
    overconfidence = calculateOverconfidenceScore(trades || []);
  }
  // 10-29 trades: pattern observation only (no numeric score)

  const total =
    lossAversion !== null && overconfidence !== null
      ? lossAversion * 0.5 + overconfidence * 0.5
      : lossAversion ?? overconfidence ?? null;

  await supabase.from("bias_scores").upsert({
    user_id: userId,
    loss_aversion: lossAversion,
    overconfidence,
    confirmation: null, // Phase 2
    herd: null, // Phase 2
    total,
    calculated_at: new Date().toISOString(),
  });

  return { lossAversion, overconfidence, total, tradeCount };
}

function calculateLossAversionScore(trades: Trade[]): number {
  // Score 0-100: higher = better bias control
  // Based on sell ratio of losing vs winning positions
  const sellTrades = trades.filter((t) => t.type === "sell");
  if (sellTrades.length < 5) return 50; // neutral default

  let losingSells = 0;
  let winningSells = 0;

  for (const t of sellTrades) {
    const buys = trades.filter(
      (b) => b.type === "buy" && b.ticker === t.ticker
    );
    if (buys.length === 0) continue;
    const avgBuy =
      buys.reduce((s, b) => s + b.price, 0) / buys.length;
    if (t.price < avgBuy) losingSells++;
    else winningSells++;
  }

  const total = losingSells + winningSells;
  if (total < 3) return 50;

  // Ideal ratio: 1.0 (equal selling of losers and winners)
  const ratio = losingSells / total;
  // 0.5 = perfect (score 100), 1.0 = extreme loss aversion (score 0)
  const score = Math.max(0, Math.min(100, (1 - (ratio - 0.5) * 2) * 100));
  return Math.round(score);
}

function calculateOverconfidenceScore(trades: Trade[]): number {
  const withConfidence = trades.filter((t) => t.confidence != null);
  if (withConfidence.length < 10) return 50;

  // Compare confidence vs accuracy correlation
  // Higher score = confidence matches accuracy
  let totalGap = 0;
  for (const t of withConfidence) {
    const normalizedConfidence = ((t.confidence || 3) - 1) / 4; // 0-1
    // Simplified accuracy: would need price comparison horizon
    const accuracy = 0.5; // placeholder
    totalGap += Math.abs(normalizedConfidence - accuracy);
  }

  const avgGap = totalGap / withConfidence.length;
  const score = Math.max(0, Math.min(100, (1 - avgGap) * 100));
  return Math.round(score);
}
