import { supabase } from "@/lib/supabase";
import type {
  TradeRequest,
  Trade,
  Portfolio,
  Holding,
  Quote,
  BiasCheckResult,
} from "@/types";
import { checkBias } from "@/lib/bias/checker";
import { marketData } from "@/lib/market/provider";

// ===========================
// Trading Engine
// ===========================
//
//  User clicks "매도"
//      │
//      ▼
//  validateTrade() ← qty > 0, holding exists, etc.
//      │
//      ▼
//  checkBias()     ← returns BiasCheckResult
//      │
//  ┌───┴───┐
//  │detect?│
//  yes  no
//  │    │
//  ▼    ▼
// Alert  Confirm → executeTrade() → update holdings + cash
// ===========================

export interface TradeValidation {
  valid: boolean;
  error?: string;
  quote?: Quote;
}

export async function validateTrade(
  req: TradeRequest
): Promise<TradeValidation> {
  if (req.qty <= 0 || !Number.isInteger(req.qty)) {
    return { valid: false, error: "수량은 1 이상의 정수여야 합니다" };
  }

  // Get portfolio
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("*")
    .eq("id", req.portfolio_id)
    .single();

  if (!portfolio) {
    return { valid: false, error: "포트폴리오를 찾을 수 없습니다" };
  }

  // Phase 1: simulation only
  if (portfolio.mode !== "sim") {
    return { valid: false, error: "현재 모의 거래만 지원합니다" };
  }

  // Get current quote
  const quote = await marketData.getQuote(req.ticker, req.market);
  if (!quote) {
    return { valid: false, error: "시세 정보를 가져올 수 없습니다" };
  }

  if (req.type === "buy") {
    const totalCost = quote.price * req.qty;
    if (totalCost > portfolio.current_cash) {
      return {
        valid: false,
        error: `잔액 부족: 필요 ${totalCost.toLocaleString()}원, 보유 ${portfolio.current_cash.toLocaleString()}원`,
      };
    }
  }

  if (req.type === "sell") {
    const { data: holding } = await supabase
      .from("holdings")
      .select("*")
      .eq("portfolio_id", req.portfolio_id)
      .eq("ticker", req.ticker)
      .single();

    if (!holding || holding.qty < req.qty) {
      return {
        valid: false,
        error: `보유 수량 부족: ${holding?.qty ?? 0}주 보유 중`,
      };
    }
  }

  return { valid: true, quote };
}

export async function preTradeCheck(
  userId: string,
  req: TradeRequest,
  quote: Quote
): Promise<BiasCheckResult> {
  return checkBias(userId, req, quote);
}

export async function executeTrade(
  userId: string,
  req: TradeRequest,
  quote: Quote,
  biasResult: BiasCheckResult,
  biasAction: "delay" | "learn" | "ignore" | "none"
): Promise<Trade> {
  const price = quote.price;
  const totalAmount = price * req.qty;

  // Insert trade record
  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .insert({
      portfolio_id: req.portfolio_id,
      ticker: req.ticker,
      market: req.market,
      type: req.type,
      qty: req.qty,
      price,
      confidence: req.confidence,
      emotion_tag: req.emotion_tag,
      bias_alert_shown: biasResult.detected,
      bias_alert_action: biasAction,
    })
    .select()
    .single();

  if (tradeError || !trade) {
    throw new Error("거래 기록 실패");
  }

  // Update portfolio cash
  const cashDelta = req.type === "buy" ? -totalAmount : totalAmount;
  await supabase.rpc("update_portfolio_cash", {
    p_portfolio_id: req.portfolio_id,
    p_delta: cashDelta,
  });

  // Update holdings
  if (req.type === "buy") {
    await upsertHolding(req.portfolio_id, req.ticker, req.market, req.qty, price);
  } else {
    await reduceHolding(req.portfolio_id, req.ticker, req.qty);
  }

  // Record bias event if detected
  if (biasResult.detected && biasResult.type) {
    await supabase.from("bias_events").insert({
      user_id: userId,
      trade_id: trade.id,
      bias_type: biasResult.type,
      score_delta: biasAction === "ignore" ? -5 : 3,
      outcome: biasAction === "ignore" ? "triggered" : "overcome",
      context_json: {
        ticker: req.ticker,
        trade_type: req.type,
        bias_message: biasResult.message,
      },
    });
  }

  return trade as Trade;
}

async function upsertHolding(
  portfolioId: string,
  ticker: string,
  market: string,
  qty: number,
  price: number
) {
  const { data: existing } = await supabase
    .from("holdings")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .eq("ticker", ticker)
    .single();

  if (existing) {
    // Update avg_price and qty
    const newQty = existing.qty + qty;
    const newAvgPrice =
      (existing.avg_price * existing.qty + price * qty) / newQty;

    await supabase
      .from("holdings")
      .update({ qty: newQty, avg_price: newAvgPrice })
      .eq("id", existing.id);
  } else {
    await supabase.from("holdings").insert({
      portfolio_id: portfolioId,
      ticker,
      market,
      qty,
      avg_price: price,
    });
  }
}

async function reduceHolding(
  portfolioId: string,
  ticker: string,
  qty: number
) {
  const { data: holding } = await supabase
    .from("holdings")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .eq("ticker", ticker)
    .single();

  if (!holding) return;

  if (holding.qty <= qty) {
    await supabase.from("holdings").delete().eq("id", holding.id);
  } else {
    await supabase
      .from("holdings")
      .update({ qty: holding.qty - qty })
      .eq("id", holding.id);
  }
}
