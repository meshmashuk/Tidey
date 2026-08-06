import "dotenv/config";
import cors from "cors";
import express from "express";
import { stationsErrorHandler, stationsRouter } from "./routes/stations.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin: clientOrigin }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/stations", stationsRouter);
app.use(stationsErrorHandler);

app.listen(port, () => {
  console.log(`Tidey proxy server listening on http://localhost:${port}`);
});
