"use client";

import { useState } from "react";
import type { Quote, TradeType, BiasCheckResult } from "@/types";
import { BiasAlert } from "@/components/ui/bias-alert";

interface OrderPanelProps {
  ticker: string | null;
  quote: Quote | null;
  portfolioId: string;
  onTradeComplete: () => void;
}

export function OrderPanel({ ticker, quote, portfolioId, onTradeComplete }: OrderPanelProps) {
  const [qty, setQty] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [tradeType, setTradeType] = useState<TradeType>("buy");
  const [loading, setLoading] = useState(false);
  const [biasResult, setBiasResult] = useState<BiasCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!ticker || !quote) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
        종목을 검색해서 선택해주세요
      </div>
    );
  }

  const totalAmount = quote.price * (parseInt(qty) || 0);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      // Step 1: Validate + Bias check
      const checkRes = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check",
          portfolio_id: portfolioId,
          ticker,
          market: quote!.market,
          type: tradeType,
          qty: parseInt(qty),
          confidence,
        }),
      });
      const checkData = await checkRes.json();

      if (!checkRes.ok) {
        setError(checkData.error);
        return;
      }

      if (checkData.biasResult?.detected) {
        setBiasResult(checkData.biasResult);
        return; // Show bias alert, user decides
      }

      // No bias detected, execute directly
      await executeTrade("none");
    } catch {
      setError("요청 처리 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function executeTrade(biasAction: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          portfolio_id: portfolioId,
          ticker,
          market: quote!.market,
          type: tradeType,
          qty: parseInt(qty),
          confidence,
          bias_action: biasAction,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setBiasResult(null);
      setQty("");
      onTradeComplete();
    } catch {
      setError("거래 실행 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  const changeColor = quote.change_percent >= 0 ? "text-green-600" : "text-red-500";
  const changePrefix = quote.change_percent >= 0 ? "+" : "";

  return (
    <div className="space-y-4">
      {/* Ticker info */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">{ticker}</h3>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
            {quote.market}
          </span>
        </div>
        <p className="mt-1 text-2xl font-bold">{quote.price.toLocaleString()}원</p>
        <p className={`text-sm ${changeColor}`}>
          {changePrefix}{quote.change_percent.toFixed(1)}% 오늘
        </p>
        {quote.is_stale && (
          <p className="mt-1 text-[11px] text-orange-500">데이터 업데이트 지연 중</p>
        )}
      </div>

      {/* Order form */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex gap-2">
          <button
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              tradeType === "buy"
                ? "bg-green-600 text-white"
                : "border border-gray-300 text-gray-500 hover:bg-gray-50"
            }`}
            onClick={() => setTradeType("buy")}
          >
            매수
          </button>
          <button
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              tradeType === "sell"
                ? "bg-red-500 text-white"
                : "border border-gray-300 text-gray-500 hover:bg-gray-50"
            }`}
            onClick={() => setTradeType("sell")}
          >
            매도
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">수량</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="수량 입력"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">
              확신도 ({confidence}/5)
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={confidence}
              onChange={(e) => setConfidence(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>불확실</span>
              <span>확신</span>
            </div>
          </div>

          {qty && parseInt(qty) > 0 && (
            <p className="text-xs text-gray-500">
              예상 금액: <span className="font-semibold">{totalAmount.toLocaleString()}원</span>
            </p>
          )}

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !qty || parseInt(qty) <= 0}
            className={`w-full rounded-md py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              tradeType === "buy"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {loading ? "처리 중..." : tradeType === "buy" ? "매수 주문" : "매도 주문"}
          </button>
        </div>
      </div>

      {/* Bias alert */}
      {biasResult?.detected && (
        <BiasAlert
          result={biasResult}
          onDelay={() => {
            setBiasResult(null);
            // TODO: schedule 30-min reminder
          }}
          onLearn={() => {
            setBiasResult(null);
            window.location.href = "/learn";
          }}
          onIgnore={() => executeTrade("ignore")}
        />
      )}
    </div>
  );
}
