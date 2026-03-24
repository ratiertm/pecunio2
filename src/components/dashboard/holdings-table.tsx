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
        const buyTotal = h.avg_price * h.qty;
        const evalTotal = currentPrice * h.qty;
        const pnlAmount = evalTotal - buyTotal;
        const pnlPercent = buyTotal > 0 ? (pnlAmount / buyTotal) * 100 : 0;
        const isPositive = pnlPercent >= 0;
        const name = getTickerName(h.ticker);

        return (
          <div
            key={h.id}
            className="card rounded-2xl p-5 transition-all duration-200 hover:shadow-md"
          >
            {/* Header: 종목명 + 수량 + 수익률 배지 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold text-text-primary">
                  {name || h.ticker}
                </span>
                <span className="text-[12px] text-text-tertiary">{h.ticker}</span>
                <span className="rounded-lg bg-primary-light px-2 py-0.5 text-[12px] font-semibold text-primary">
                  {h.qty}주
                </span>
              </div>
              <span
                className={`rounded-xl px-3 py-1.5 text-[15px] font-bold ${
                  isPositive
                    ? "bg-success-light text-success"
                    : "bg-danger-light text-danger"
                }`}
              >
                {isPositive ? "+" : ""}{pnlPercent.toFixed(2)}%
              </span>
            </div>

            {/* Detail grid */}
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
              <div className="flex justify-between">
                <span className="text-[13px] text-text-tertiary">매입단가</span>
                <span className="text-[13px] font-medium text-text-secondary">{h.avg_price.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-text-tertiary">현재가</span>
                <span className="text-[13px] font-medium text-text-primary">{currentPrice.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-text-tertiary">매입총액</span>
                <span className="text-[13px] font-medium text-text-secondary">{buyTotal.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-text-tertiary">평가총액</span>
                <span className="text-[13px] font-medium text-text-primary">{evalTotal.toLocaleString()}원</span>
              </div>
            </div>

            {/* Profit/Loss bar */}
            <div className={`mt-3 flex items-center justify-between rounded-xl px-4 py-2.5 ${
              isPositive ? "bg-success-light/60" : "bg-danger-light/60"
            }`}>
              <span className={`text-[13px] font-semibold ${isPositive ? "text-success" : "text-danger"}`}>
                수익금액
              </span>
              <span className={`text-[15px] font-bold ${isPositive ? "text-success" : "text-danger"}`}>
                {isPositive ? "+" : ""}{pnlAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
