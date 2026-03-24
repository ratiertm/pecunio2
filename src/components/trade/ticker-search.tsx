"use client";

import { useState, useCallback } from "react";
import type { TickerSearchResult } from "@/types";

interface TickerSearchProps {
  onSelect: (result: TickerSearchResult) => void;
}

export function TickerSearch({ onSelect }: TickerSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TickerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          search(e.target.value);
        }}
        placeholder="종목 검색 (예: 삼성전자, 005930)"
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
      />
      {loading && (
        <div className="absolute right-3 top-3 text-xs text-gray-400">검색중...</div>
      )}
      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((r) => (
            <li key={`${r.market}:${r.ticker}`}>
              <button
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                onClick={() => {
                  onSelect(r);
                  setQuery(r.name);
                  setResults([]);
                }}
              >
                <span>
                  <span className="font-semibold">{r.name}</span>
                  <span className="ml-2 text-gray-400">{r.ticker}</span>
                </span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                  {r.market}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
