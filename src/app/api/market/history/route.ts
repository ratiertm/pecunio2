import { NextRequest, NextResponse } from "next/server";

const KRX_API_URL = "https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService";
const KRX_API_KEY = process.env.KRX_API_KEY || "";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  const days = parseInt(req.nextUrl.searchParams.get("days") || "30");

  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  try {
    const url = new URL(`${KRX_API_URL}/getStockPriceInfo`);
    url.searchParams.set("serviceKey", KRX_API_KEY);
    url.searchParams.set("resultType", "json");
    url.searchParams.set("numOfRows", String(Math.min(days, 60)));
    url.searchParams.set("likeSrtnCd", ticker);

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // 1h cache — historical data doesn't change
    });
    if (!res.ok) throw new Error(`KRX API ${res.status}`);

    const data = await res.json();
    const items = data?.response?.body?.items?.item || [];

    // API returns newest first — reverse for chronological order
    const history = items
      .map((item: any) => ({
        date: item.basDt, // YYYYMMDD
        price: Number(item.clpr),
        open: Number(item.mkp),
        high: Number(item.hipr),
        low: Number(item.lopr),
        volume: Number(item.trqu),
      }))
      .reverse();

    return NextResponse.json({ history, ticker });
  } catch {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
