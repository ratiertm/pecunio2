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
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-4">
        <Link href="/" className="mr-6 py-3 text-lg font-bold tracking-tight">
          pecunio<span className="text-blue-600">2</span>
        </Link>
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
        <div className="ml-auto">
          <ModeSwitcher />
        </div>
      </div>
    </nav>
  );
}

function ModeSwitcher() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5">
      <span className="h-2 w-2 rounded-full bg-blue-500" />
      <span className="text-xs font-semibold text-blue-700">모의 거래</span>
    </div>
  );
}
