import { NextRequest, NextResponse } from "next/server";
import { marketData } from "@/lib/market/provider";
import { KRXProvider } from "@/lib/market/krx";
import type { Market } from "@/types";

if (!marketData["providers"].has("KRX")) {
  marketData.registerProvider(new KRXProvider());
}

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  const market = req.nextUrl.searchParams.get("market") as Market;

  if (!ticker || !market) {
    return NextResponse.json({ error: "ticker and market required" }, { status: 400 });
  }

  try {
    const quote = await marketData.getQuote(ticker, market);
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    return NextResponse.json({ quote });
  } catch {
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
