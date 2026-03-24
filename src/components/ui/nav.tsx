"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "대시보드", icon: "📊" },
  { href: "/trade", label: "매매", icon: "💹" },
  { href: "/learn", label: "학습", icon: "📚" },
  { href: "/bias", label: "편향분석", icon: "🧠" },
  { href: "/settings", label: "설정", icon: "⚙️" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-card-border bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-5 sm:px-8">
        <Link
          href="/"
          className="mr-8 flex items-center gap-2 py-4 text-lg font-bold tracking-tight text-text-primary transition-opacity hover:opacity-70"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm text-white">
            P
          </span>
          <span>
            pecunio<span className="text-primary">2</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary-light text-primary"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto">
          <ModeSwitcher />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-card-border bg-white/90 backdrop-blur-xl sm:hidden">
        <div className="flex items-center justify-around px-2 py-1">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-all duration-200 ${
                  active
                    ? "text-primary"
                    : "text-text-tertiary"
                }`}
              >
                <span className="text-xl">{icon}</span>
                <span className="text-[10px] font-medium">{label}</span>
                {active && (
                  <span className="absolute -top-0.5 h-0.5 w-6 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function ModeSwitcher() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-primary-light px-3.5 py-1.5 transition-all duration-200 hover:shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      <span className="text-xs font-semibold text-primary">모의 거래</span>
    </div>
  );
}
