import { NextRequest, NextResponse } from "next/server";
import { validateTrade, preTradeCheck, executeTrade } from "@/lib/trading/engine";
import type { TradeRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, bias_action, ...tradeData } = body;

    // TODO: get userId from Supabase auth session
    const userId = "demo-user";

    const tradeReq: TradeRequest = {
      portfolio_id: tradeData.portfolio_id,
      ticker: tradeData.ticker,
      market: tradeData.market,
      type: tradeData.type,
      qty: tradeData.qty,
      confidence: tradeData.confidence,
      emotion_tag: tradeData.emotion_tag,
    };

    if (action === "check") {
      // Step 1: Validate
      const validation = await validateTrade(tradeReq);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Step 2: Bias check
      const biasResult = await preTradeCheck(userId, tradeReq, validation.quote!);

      return NextResponse.json({
        valid: true,
        biasResult,
        quote: validation.quote,
      });
    }

    if (action === "execute") {
      const validation = await validateTrade(tradeReq);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const biasResult = await preTradeCheck(userId, tradeReq, validation.quote!);
      const trade = await executeTrade(
        userId,
        tradeReq,
        validation.quote!,
        biasResult,
        bias_action || "none"
      );

      return NextResponse.json({ trade });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
