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
    <div className="mx-auto max-w-2xl space-y-8 pb-20 sm:pb-0">
      {/* Profile */}
      <div>
        <h2 className="section-title mb-4">프로필</h2>
        <div className="card rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-xl font-bold text-white shadow-lg shadow-primary/20">
              {name.charAt(0)}
            </div>
            <div>
              <p className="text-[17px] font-bold text-text-primary">{name}</p>
              <p className="mt-0.5 text-[13px] text-text-tertiary">
                Lv.{level.level} {level.title} · XP {user.xp} · 매매 {tradeCount}건
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-xl border-2 border-card-border bg-white px-4 py-3 text-[15px] text-text-primary transition-all duration-200 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="이름"
            />
            <button
              onClick={handleSaveName}
              className="btn-primary rounded-xl px-6 py-3 text-[14px]"
            >
              저장
            </button>
          </div>
          {saved && (
            <p className="mt-3 animate-fade-in-up text-[13px] font-medium text-success">
              저장되었습니다!
            </p>
          )}
        </div>
      </div>

      {/* Training environment */}
      <div>
        <h2 className="section-title mb-4">훈련 환경</h2>
        <div className="space-y-3">
          <div className="card flex items-center justify-between rounded-2xl p-5">
            <div>
              <p className="text-[15px] font-semibold text-text-primary">초기 가상 자금</p>
              <p className="mt-0.5 text-[13px] text-text-tertiary">모의 투자 시작 금액</p>
            </div>
            <p className="text-[15px] font-bold text-text-primary">{portfolio.initial_cash.toLocaleString()}원</p>
          </div>
          <div className="card flex items-center justify-between rounded-2xl p-5">
            <div>
              <p className="text-[15px] font-semibold text-text-primary">현재 잔액</p>
              <p className="mt-0.5 text-[13px] text-text-tertiary">사용 가능한 현금</p>
            </div>
            <p className="text-[15px] font-bold text-text-primary">{portfolio.current_cash.toLocaleString()}원</p>
          </div>
          <div className="card flex items-center justify-between rounded-2xl p-5">
            <div>
              <p className="text-[15px] font-semibold text-text-primary">투자 시장</p>
              <p className="mt-0.5 text-[13px] text-text-tertiary">매매 가능한 시장</p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-[12px] font-bold text-white shadow-sm shadow-primary/20">
                KRX
              </span>
              <span className="rounded-full border-2 border-card-border px-3 py-1 text-[12px] font-medium text-text-tertiary">
                NYSE (Phase 2)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Data management */}
      <div>
        <h2 className="section-title mb-4">데이터 관리</h2>
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="card card-interactive flex-1 rounded-2xl px-5 py-4 text-center text-[14px] font-semibold text-text-secondary transition-all hover:text-text-primary"
            >
              데이터 내보내기 (JSON)
            </button>
            <button
              onClick={handleImport}
              className="card card-interactive flex-1 rounded-2xl px-5 py-4 text-center text-[14px] font-semibold text-text-secondary transition-all hover:text-text-primary"
            >
              데이터 가져오기
            </button>
          </div>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full rounded-2xl border-2 border-danger/20 bg-danger-light/50 px-5 py-4 text-[14px] font-semibold text-danger transition-all duration-200 hover:border-danger/40 hover:bg-danger-light active:scale-[0.99]"
            >
              모든 데이터 초기화
            </button>
          ) : (
            <div className="animate-fade-in-up rounded-2xl border-2 border-danger/30 bg-danger-light p-6">
              <p className="mb-2 text-[16px] font-bold text-danger">
                정말 초기화하시겠습니까?
              </p>
              <p className="mb-4 text-[14px] leading-relaxed text-danger/80">
                모든 매매 기록, 학습 진도, 편향 데이터가 삭제됩니다. 복구할 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 rounded-xl bg-danger py-3 text-[14px] font-bold text-white shadow-md shadow-danger/20 transition-all duration-200 hover:shadow-lg hover:shadow-danger/30 active:scale-[0.98]"
                >
                  초기화 실행
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 rounded-xl border-2 border-card-border bg-white py-3 text-[14px] font-bold text-text-secondary transition-all duration-200 hover:bg-surface-hover active:scale-[0.98]"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* App info */}
      <div className="card rounded-2xl p-5 text-center">
        <p className="text-[13px] text-text-tertiary">pecunio2 v0.1.0 — 행동경제학 기반 투자 훈련 플랫폼</p>
        <p className="mt-1.5 text-[12px] text-text-tertiary/70">데이터는 브라우저 localStorage에 저장됩니다</p>
      </div>
    </div>
  );
}
