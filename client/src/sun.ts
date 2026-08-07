import SunCalc from "suncalc";

export interface SunTimes {
  sunrise: number | null; // epoch ms
  sunset: number | null;
  dawn: number | null; // civil dawn (sun 6° below horizon)
  dusk: number | null; // civil dusk
}

function ms(date: Date): number | null {
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
}

/** Sunrise/sunset (and civil twilight) for the calendar day containing
 * `dayNoonMs`, at the given coordinates. Times can be null at high latitudes
 * around midsummer, when civil twilight lasts all night — callers must cope. */
export function getSunTimes(dayNoonMs: number, lat: number, lon: number): SunTimes {
  const t = SunCalc.getTimes(new Date(dayNoonMs), lat, lon);
  return {
    sunrise: ms(t.sunrise),
    sunset: ms(t.sunset),
    dawn: ms(t.dawn),
    dusk: ms(t.dusk),
  };
}
