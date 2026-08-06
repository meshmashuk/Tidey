import { dayLabel, formatDayHeading } from "../format";

interface Props {
  dayKeys: string[];
  todayKey: string;
  selected: string;
  onSelect: (dayKey: string) => void;
}

export function DaySelector({ dayKeys, todayKey, selected, onSelect }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Select day"
      className="day-scroll flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible"
    >
      {dayKeys.map((key) => {
        const isSelected = key === selected;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(key)}
            title={formatDayHeading(key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              isSelected
                ? "bg-sky-600 text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {dayLabel(key, todayKey)}
          </button>
        );
      })}
    </div>
  );
}
