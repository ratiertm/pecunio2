import { NextRequest, NextResponse } from "next/server";
import { marketData } from "@/lib/market/provider";
import { KRXProvider } from "@/lib/market/krx";

// Register providers on first import
if (!marketData["providers"].has("KRX")) {
  marketData.registerProvider(new KRXProvider());
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await marketData.searchTickers(q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
