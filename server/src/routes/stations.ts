import { Router } from "express";
import { AdmiraltyApiError, fetchStations, fetchTidalEvents } from "../admiraltyClient.js";

export const stationsRouter = Router();

const MAX_DURATION = 7; // Discovery tier: current day + next 6 days

stationsRouter.get("/", async (req, res, next) => {
  try {
    const name = typeof req.query.name === "string" ? req.query.name : undefined;
    const data = await fetchStations(name);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

stationsRouter.get("/:id/events", async (req, res, next) => {
  try {
    const requested = Number(req.query.duration ?? MAX_DURATION);
    const duration = Number.isFinite(requested)
      ? Math.min(Math.max(Math.trunc(requested), 1), MAX_DURATION)
      : MAX_DURATION;

    const data = await fetchTidalEvents(req.params.id, duration);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export function stationsErrorHandler(
  err: unknown,
  _req: import("express").Request,
  res: import("express").Response,
  _next: import("express").NextFunction,
) {
  if (err instanceof AdmiraltyApiError) {
    res.status(err.status === 401 || err.status === 403 ? 502 : err.status).json({
      error: err.message,
    });
    return;
  }
  console.error(err);
  const message = err instanceof Error ? err.message : "Unexpected server error";
  res.status(500).json({ error: message });
}
