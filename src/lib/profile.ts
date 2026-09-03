const AMP = "\u0026";

export function buildWebClipProfile(opts: { url: string; iconB64?: string }) {
  const ident = "com.thanoxstore.thanox.webclip";
  const payloadUuid = "8C2E4A11-7B90-4F3C-9E21-5D6A8B1C4F02";
  const clipUuid = "1A9F3C70-2D55-4B88-AE14-6C0D9E8B7A31";
  const iconXml = opts.iconB64
    ? ["      <key>Icon</key>", `      <data>${opts.iconB64}</data>`, ""].join("\n")
    : "";
  const url = escapeXml(opts.url);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    "<dict>",
    "  <key>PayloadContent</key>",
    "  <array>",
    "    <dict>",
    "      <key>FullScreen</key>",
    "      <true/>",
    "      <key>IgnoreManifestScope</key>",
    "      <true/>",
    "      <key>IsRemovable</key>",
    "      <true/>",
    "      <key>Label</key>",
    "      <string>Thanox</string>",
    "      <key>PayloadDescription</key>",
    "      <string>Thanox Home Screen Web Clip — Make By Thanox Store</string>",
    "      <key>PayloadDisplayName</key>",
    "      <string>Thanox</string>",
    "      <key>PayloadIdentifier</key>",
    `      <string>${ident}</string>`,
    "      <key>PayloadType</key>",
    "      <string>com.apple.webClip.managed</string>",
    "      <key>PayloadUUID</key>",
    `      <string>${clipUuid}</string>`,
    "      <key>PayloadVersion</key>",
    "      <integer>1</integer>",
    "      <key>Precomposed</key>",
    "      <true/>",
    "      <key>URL</key>",
    `      <string>${url}</string>`,
    iconXml + "    </dict>",
    "  </array>",
    "  <key>PayloadDescription</key>",
    "  <string>Adds Thanox to the Home Screen. Make By Thanox Store.</string>",
    "  <key>PayloadDisplayName</key>",
    "  <string>Thanox</string>",
    "  <key>PayloadIdentifier</key>",
    "  <string>com.thanoxstore.thanox</string>",
    "  <key>PayloadOrganization</key>",
    "  <string>Make By Thanox Store</string>",
    "  <key>PayloadRemovalDisallowed</key>",
    "  <false/>",
    "  <key>PayloadType</key>",
    "  <string>Configuration</string>",
    "  <key>PayloadUUID</key>",
    `  <string>${payloadUuid}</string>`,
    "  <key>PayloadVersion</key>",
    "  <integer>1</integer>",
    "</dict>",
    "</plist>",
    "",
  ].join("\n");
}

function escapeXml(s: string) {
  return s
    .replaceAll("&", `${AMP}amp;`)
    .replaceAll("<", `${AMP}lt;`)
    .replaceAll(">", `${AMP}gt;`)
    .replaceAll('"', `${AMP}quot;`);
}
