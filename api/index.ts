import type { IncomingMessage, ServerResponse } from "http";

// Cache the dynamic import across invocations (warm starts) so we're not
// re-importing on every request.
let appPromise: Promise<any> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!appPromise) {
    appPromise = import("../server/dist/index.js").then((m) => m.default);
  }
  const app = await appPromise;
  return app(req, res);
}