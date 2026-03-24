"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { getStore } from "@/lib/store";
import { getLevelForXP } from "@/types";

export default function SettingsPage() {
  const { user, portfolio, tradeCount, refresh } = useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [name, setName] = useState(user.name);
  const [saved, setSaved] = useState(false);
  const level = getLevelForXP(user.xp);

  function handleSaveName() {
    const store = getStore();
    const u = store.getUser();
    u.name = name;
    // Force save by adding 0 XP
    store.addXP(0);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refresh();
  }

  function handleReset() {
    const store = getStore();
    store.reset();
    setShowResetConfirm(false);
    refresh();
    window.location.href = "/";
  }

  function handleExport() {
    const data = localStorage.getItem("pecunio2_data");
    if (!data) return;
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pecunio2-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          JSON.parse(reader.result as string); // validate JSON
          localStorage.setItem("pecunio2_data", reader.result as string);
          window.location.reload();
        } catch {
          alert("유효하지 않은 백업 파일입니다.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profile */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          프로필
        </h2>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-lg font-bold text-white">
              {name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold">{name}</p>
              <p className="text-xs text-gray-500">
                Lv.{level.level} {level.title} · XP {user.xp} · 매매 {tradeCount}건
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              placeholder="이름"
            />
            <button
              onClick={handleSaveName}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
            >
              저장
            </button>
          </div>
          {saved && (
            <p className="mt-2 text-xs text-green-600">저장되었습니다!</p>
          )}
        </div>
      </div>

      {/* Training environment */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          훈련 환경
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
            <div>
              <p className="text-sm font-semibold">초기 가상 자금</p>
              <p className="text-xs text-gray-500">모의 투자 시작 금액</p>
            </div>
            <p className="text-sm font-semibold">{portfolio.initial_cash.toLocaleString()}원</p>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
            <div>
              <p className="text-sm font-semibold">현재 잔액</p>
              <p className="text-xs text-gray-500">사용 가능한 현금</p>
            </div>
            <p className="text-sm font-semibold">{portfolio.current_cash.toLocaleString()}원</p>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
            <div>
              <p className="text-sm font-semibold">투자 시장</p>
              <p className="text-xs text-gray-500">매매 가능한 시장</p>
            </div>
            <div className="flex gap-1.5">
              <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                KRX
              </span>
              <span className="rounded-full border border-gray-300 px-2.5 py-0.5 text-xs text-gray-400">
                NYSE (Phase 2)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Data management */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          데이터 관리
        </h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              데이터 내보내기 (JSON)
            </button>
            <button
              onClick={handleImport}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              데이터 가져오기
            </button>
          </div>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50"
            >
              모든 데이터 초기화
            </button>
          ) : (
            <div className="rounded-lg border-2 border-red-400 bg-red-50 p-4">
              <p className="mb-2 text-sm font-semibold text-red-700">
                정말 초기화하시겠습니까?
              </p>
              <p className="mb-3 text-xs text-red-600">
                모든 매매 기록, 학습 진도, 편향 데이터가 삭제됩니다. 복구할 수 없습니다.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 rounded-md bg-red-500 py-2 text-sm font-semibold text-white"
                >
                  초기화 실행
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 rounded-md border border-gray-300 py-2 text-sm font-semibold text-gray-700"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* App info */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-xs text-gray-400">
        <p>pecunio2 v0.1.0 — 행동경제학 기반 투자 훈련 플랫폼</p>
        <p className="mt-1">데이터는 브라우저 localStorage에 저장됩니다</p>
      </div>
    </div>
  );
}
