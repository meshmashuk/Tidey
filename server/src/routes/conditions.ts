import { Router } from "express";
import { XweatherApiError, fetchConditions } from "../xweatherClient.js";

export const conditionsRouter = Router();

// GET /api/conditions?lat=<num>&lng=<num>
// Returns current weather + sea-surface temperature at the nearest Xweather
// data point to the given coordinate (i.e. the selected tidal station).
conditionsRouter.get("/", async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      res.status(400).json({ error: "Valid 'lat' and 'lng' query parameters are required." });
      return;
    }

    const data = await fetchConditions(lat, lng);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export function conditionsErrorHandler(
  err: unknown,
  _req: import("express").Request,
  res: import("express").Response,
  _next: import("express").NextFunction,
) {
  if (err instanceof XweatherApiError) {
    res.status(err.status === 401 || err.status === 403 ? 502 : err.status).json({
      error: err.message,
    });
    return;
  }
  console.error(err);
  const message = err instanceof Error ? err.message : "Unexpected server error";
  res.status(500).json({ error: message });
}
