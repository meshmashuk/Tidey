import { useId } from "react";

/** A small "porthole" glyph — a circular rim with a wavy waterline filled
 * near the top (high tide) or bottom (low tide) of the circle. */
export function TideIcon({ high, className }: { high: boolean; className?: string }) {
  const clipId = useId();
  const waterY = high ? 8 : 15.5;
  const wave = `M3,${waterY} C6,${waterY - 2.3} 9,${waterY + 2.3} 12,${waterY} C15,${waterY - 2.3} 18,${waterY + 2.3} 21,${waterY}`;

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <circle cx="12" cy="12" r="9" />
        </clipPath>
      </defs>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.4" />
      <g clipPath={`url(#${clipId})`}>
        <path d={`${wave} L21,22 L3,22 Z`} fill="currentColor" opacity="0.25" />
        <path d={wave} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
