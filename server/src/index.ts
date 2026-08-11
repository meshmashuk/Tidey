import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { conditionsErrorHandler, conditionsRouter } from "./routes/conditions.js";
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

app.use("/api/conditions", conditionsRouter);
app.use(conditionsErrorHandler);

// --- NEW: serve the built React client in production ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, "../../client/dist");

// app.use(express.static(clientDist));

app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});
// --- end new ---

// Only listen on a port locally — Vercel invokes the exported app directly
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Tidey proxy server listening on http://localhost:${port}`);
  });
}

export default app;