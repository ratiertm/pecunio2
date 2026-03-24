import type { Holding, Quote } from "@/types";

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
    <div className="card overflow-hidden rounded-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-card-border bg-surface-hover/50 text-[13px] text-text-tertiary">
            <th className="px-5 py-3.5 text-left font-medium">종목</th>
            <th className="px-5 py-3.5 text-right font-medium">수량</th>
            <th className="hidden px-5 py-3.5 text-right font-medium sm:table-cell">평균단가</th>
            <th className="px-5 py-3.5 text-right font-medium">현재가</th>
            <th className="px-5 py-3.5 text-right font-medium">수익률</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const currentPrice = h.currentPrice ?? h.avg_price;
            const pnlPercent =
              ((currentPrice - h.avg_price) / h.avg_price) * 100;
            const isPositive = pnlPercent >= 0;

            return (
              <tr
                key={h.id}
                className="border-b border-card-border/50 transition-colors last:border-0 hover:bg-surface-hover/30"
              >
                <td className="px-5 py-4">
                  <span className="font-semibold text-text-primary">{h.ticker}</span>
                  <span className="ml-2 rounded-md bg-surface-hover px-1.5 py-0.5 text-[11px] font-medium text-text-tertiary">
                    {h.market}
                  </span>
                </td>
                <td className="px-5 py-4 text-right text-text-secondary">{h.qty}주</td>
                <td className="hidden px-5 py-4 text-right text-text-secondary sm:table-cell">
                  {h.avg_price.toLocaleString()}원
                </td>
                <td className="px-5 py-4 text-right font-medium text-text-primary">
                  {currentPrice.toLocaleString()}원
                </td>
                <td className="px-5 py-4 text-right">
                  <span
                    className={`inline-flex items-center rounded-lg px-2 py-1 text-sm font-bold ${
                      isPositive
                        ? "bg-success-light text-success"
                        : "bg-danger-light text-danger"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {pnlPercent.toFixed(1)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
