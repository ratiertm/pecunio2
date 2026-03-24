import type { Holding, Quote } from "@/types";

interface HoldingsTableProps {
  holdings: (Holding & { currentPrice?: number })[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">
        아직 보유 종목이 없습니다. 매매 탭에서 첫 거래를 시작해보세요!
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
            <th className="px-4 py-2 text-left font-medium">종목</th>
            <th className="px-4 py-2 text-right font-medium">수량</th>
            <th className="px-4 py-2 text-right font-medium">평균단가</th>
            <th className="px-4 py-2 text-right font-medium">현재가</th>
            <th className="px-4 py-2 text-right font-medium">수익률</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const currentPrice = h.currentPrice ?? h.avg_price;
            const pnlPercent =
              ((currentPrice - h.avg_price) / h.avg_price) * 100;
            const isPositive = pnlPercent >= 0;

            return (
              <tr key={h.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 font-semibold">
                  {h.ticker}
                  <span className="ml-1.5 text-[10px] text-gray-400">
                    {h.market}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{h.qty}주</td>
                <td className="px-4 py-3 text-right">
                  {h.avg_price.toLocaleString()}원
                </td>
                <td className="px-4 py-3 text-right">
                  {currentPrice.toLocaleString()}원
                </td>
                <td
                  className={`px-4 py-3 text-right font-semibold ${
                    isPositive ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {pnlPercent.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
