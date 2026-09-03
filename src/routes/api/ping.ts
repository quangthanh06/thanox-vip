import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ping")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, t: Date.now() }),
    },
  },
});
