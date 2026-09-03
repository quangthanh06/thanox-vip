import { createFileRoute } from "@tanstack/react-router";
import { APP_ICON_B64 } from "@/lib/app-icon-b64";
import { buildWebClipProfile } from "@/lib/profile";

export const Route = createFileRoute("/thanox.mobileconfig")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const xml = buildWebClipProfile({ url: `${origin}/`, iconB64: APP_ICON_B64 });
        return new Response(xml, {
          headers: {
            "Content-Type": "application/x-apple-aspen-config",
            "Content-Disposition": 'attachment; filename="Thanox.mobileconfig"',
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
