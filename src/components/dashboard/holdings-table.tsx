import type { Holding, Quote } from "@/types";
import { getTickerName } from "@/lib/market/krx-search";

interface HoldingsTableProps {
  holdings: (Holding & { currentPrice?: number })[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center rounded-2xl p-10 text-center">
        <span className="mb-3 text-4xl">💼</span>
        <p className="text-[15px] font-medium text-text-secondary">
          아직 보유 종목이 없습니다
        </p>
        <p className="mt-1 text-[13px] text-text-tertiary">
          매매 탭에서 첫 거래를 시작해보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {holdings.map((h) => {
        const currentPrice = h.currentPrice ?? h.avg_price;
        const pnlPercent = ((currentPrice - h.avg_price) / h.avg_price) * 100;
        const pnlAmount = (currentPrice - h.avg_price) * h.qty;
        const isPositive = pnlPercent >= 0;
        const name = getTickerName(h.ticker);

        return (
          <div
            key={h.id}
            className="card rounded-2xl p-5 transition-all duration-200 hover:shadow-md"
          >
            {/* Top: 종목명 + 수익률 */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[16px] font-bold text-text-primary">
                  {name || h.ticker}
                </span>
                <span className="ml-2 text-[12px] text-text-tertiary">
                  {h.ticker}
                </span>
              </div>
              <span
                className={`rounded-xl px-3 py-1 text-[14px] font-bold ${
                  isPositive
                    ? "bg-success-light text-success"
                    : "bg-danger-light text-danger"
                }`}
              >
                {isPositive ? "+" : ""}{pnlPercent.toFixed(1)}%
              </span>
            </div>

            {/* Middle: 현재가 + 수익금 */}
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-[20px] font-bold text-text-primary">
                {currentPrice.toLocaleString()}
                <span className="ml-0.5 text-[13px] font-normal text-text-tertiary">원</span>
              </p>
              <p className={`text-[14px] font-semibold ${isPositive ? "text-success" : "text-danger"}`}>
                {isPositive ? "+" : ""}{pnlAmount.toLocaleString()}원
              </p>
            </div>

            {/* Bottom: 매입가 + 수량 */}
            <div className="mt-2 flex items-center justify-between border-t border-card-border/50 pt-2">
              <div className="flex gap-4 text-[13px] text-text-tertiary">
                <span>매입가 <span className="font-medium text-text-secondary">{h.avg_price.toLocaleString()}원</span></span>
                <span>수량 <span className="font-medium text-text-secondary">{h.qty}주</span></span>
              </div>
              <span className="text-[12px] text-text-tertiary">
                평가금 {(currentPrice * h.qty).toLocaleString()}원
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
