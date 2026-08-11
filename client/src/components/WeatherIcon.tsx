/** Hand-rolled inline-SVG weather glyphs, keyed off Xweather's coded weather
 * string (e.g. "::FW"). No icon library — same approach as TideIcon/sun markers.
 * The third ":"-separated segment is the weather code; see
 * https://www.xweather.com/docs/weather-api/reference/weather-codes */
type Category = "clear" | "partly" | "cloudy" | "rain" | "snow" | "thunder" | "fog";

function categorise(coded: string): Category {
  const code = coded.split(":").pop()?.toUpperCase() ?? "";
  if (["CL"].includes(code)) return "clear";
  if (["FW", "SC"].includes(code)) return "partly";
  if (["BK", "OV"].includes(code)) return "cloudy";
  if (["R", "RW", "L", "ZL", "ZR", "RS", "IP"].includes(code)) return "rain";
  if (["S", "SW", "SI", "WM", "BS"].includes(code)) return "snow";
  if (["T"].includes(code)) return "thunder";
  if (["F", "BR", "H", "K", "BD", "BN", "IF", "VA"].includes(code)) return "fog";
  return "cloudy";
}

function Sun() {
  return (
    <>
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const r = (a * Math.PI) / 180;
          return (
            <line
              key={a}
              x1={12 + Math.cos(r) * 6.6}
              y1={12 + Math.sin(r) * 6.6}
              x2={12 + Math.cos(r) * 8.6}
              y2={12 + Math.sin(r) * 8.6}
            />
          );
        })}
      </g>
    </>
  );
}

function Moon() {
  return <path d="M15.5 3a7.5 7.5 0 1 0 5.5 11.8A6 6 0 0 1 15.5 3Z" fill="currentColor" />;
}

function Cloud({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${scale})`}
      d="M7.5 18a3.5 3.5 0 0 1-.3-6.99A5 5 0 0 1 17 10.2 3.9 3.9 0 0 1 16.6 18Z"
      fill="currentColor"
    />
  );
}

export function WeatherIcon({
  coded,
  isDay = true,
  className = "h-8 w-8",
}: {
  coded: string;
  isDay?: boolean;
  className?: string;
}) {
  const category = categorise(coded);

  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true">
      {category === "clear" && (isDay ? <Sun /> : <Moon />)}

      {category === "partly" && (
        <>
          <g transform="translate(-3 -3) scale(0.62)" className="text-amber-500 dark:text-amber-300">
            {isDay ? <Sun /> : <Moon />}
          </g>
          <Cloud x={2} y={4} scale={0.82} />
        </>
      )}

      {category === "cloudy" && <Cloud x={0} y={1} />}

      {category === "rain" && (
        <>
          <Cloud x={0} y={-2} scale={0.95} />
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-sky-500 dark:text-sky-400">
            <line x1="8" y1="18" x2="7" y2="21" />
            <line x1="12" y1="18" x2="11" y2="21" />
            <line x1="16" y1="18" x2="15" y2="21" />
          </g>
        </>
      )}

      {category === "snow" && (
        <>
          <Cloud x={0} y={-2} scale={0.95} />
          <g fill="currentColor" className="text-sky-400">
            <circle cx="8" cy="19.5" r="1" />
            <circle cx="12" cy="20.5" r="1" />
            <circle cx="16" cy="19.5" r="1" />
          </g>
        </>
      )}

      {category === "thunder" && (
        <>
          <Cloud x={0} y={-2} scale={0.95} />
          <path d="M12 17l-2.5 3.5H12L10.5 23l4-4H12l1.5-2Z" fill="currentColor" className="text-amber-500" />
        </>
      )}

      {category === "fog" && (
        <>
          <Cloud x={0} y={-3} scale={0.85} />
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.8">
            <line x1="5" y1="18" x2="17" y2="18" />
            <line x1="7" y1="21" x2="19" y2="21" />
          </g>
        </>
      )}
    </svg>
  );
}
