import type { ThemeMode } from "../hooks/useTheme";

export function ThemeToggle({ mode, onToggle }: { mode: ThemeMode; onToggle: () => void }) {
  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={isDark ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isDark ? (
          <path d="M20 14.5a8 8 0 1 1-8.5-9.5 6.5 6.5 0 0 0 8.5 9.5Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 4.5V2m0 20v-2.5M4.5 12H2m20 0h-2.5M6 6 4.5 4.5M19.5 19.5 18 18M6 18l-1.5 1.5M19.5 4.5 18 6" />
          </>
        )}
      </svg>
      <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
