import type { GameTune, SensProfile } from "./games";
export type { GameTune, SensProfile };

export type Locale = "en" | "vi";
export type ThemeMode = "dark" | "light" | "system";
export type TabId = "home" | "optimize" | "appopt" | "tools" | "profile";

export type ScreenId =
  | TabId
  | "activity"
  | "notifications"
  | "settings"
  | "search"
  | "device"
  | "network"
  | "battery"
  | "storage"
  | "diagnostics"
  | "analyzer"
  | "appearance"
  | "about"
  | "privacy"
  | "terms"
  | "support"
  | "preferences"
  | "notif-tools"
  | "install"
  | "workspace"
  | "admin"
  | "performance"
  | "auth";

export type ActivityKind =
  | "network"
  | "scan"
  | "diagnostics"
  | "refresh"
  | "analysis"
  | "storage"
  | "battery"
  | "notification";

export type StatusTone = "ok" | "warn" | "error" | "info";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  titleKey: string;
  detail: string;
  status: StatusTone;
  at: number;
};

export type AppNotification = {
  id: string;
  titleKey: string;
  body: string;
  at: number;
  read: boolean;
  group?: string;
};

export type NetworkQuality = "excellent" | "good" | "fair" | "poor" | "offline";

export type NetworkResult = {
  at: number;
  online: boolean;
  quality: NetworkQuality;
  avgMs: number | null;
  minMs: number | null;
  maxMs: number | null;
  samples: number;
  type: string;
  error?: string;
};

export type DeviceSnapshot = {
  at: number;
  userAgent: string;
  platform: string;
  language: string;
  languages: string[];
  cores: number;
  memoryGB: number | null;
  screen: string;
  availScreen: string;
  pixelRatio: number;
  colorDepth: number;
  touchPoints: number;
  timezone: string;
  timezoneOffset: number;
  cookiesEnabled: boolean;
  online: boolean;
  connectionType: string;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
  standalone: boolean;
  maxTouchPoints: number;
  vendor: string;
  pdfViewer: boolean;
  hardwareConcurrency: number;
};

export type BatterySnapshot = {
  at: number;
  level: number | null;
  charging: boolean | null;
  chargingTime: number | null;
  dischargingTime: number | null;
  supported: boolean;
};

export type StorageSnapshot = {
  at: number;
  usage: number | null;
  quota: number | null;
  persisted: boolean | null;
  supported: boolean;
};

export type ToastTone = "success" | "info" | "warning" | "error";

export type ToastItem = {
  id: string;
  tone: ToastTone;
  message: string;
};

export type SheetKind =
  | { kind: "confirm"; title: string; body: string; confirmLabel: string; destructive?: boolean; action: string }
  | { kind: "analysis" }
  | { kind: "scan" }
  | { kind: "network" }
  | { kind: "name" };

export type AppTarget = {
  id: string;
  name: string;
  kind: "ff" | "ffmax" | "custom";
  icon?: string;
};

export const DEFAULT_APP_TARGETS: AppTarget[] = [
  { id: "ff", name: "Free Fire", kind: "ff" },
  { id: "ffmax", name: "Free Fire MAX", kind: "ffmax" },
];

export type TuneState = {
  cpuOpt: boolean;
  gpuBoost: boolean;
  focusMode: boolean;
  touchResponse: "standard" | "fast" | "ultra";
  refreshTarget: 60 | 90 | 120;
  thermalLimit: number;
  functions: string[];
  dpiBoost: number;
  touchSens: number;
  stability: number;
  swipeAccel: number;
  deadzone: number;
  adaptiveTouch: boolean;
  microSmooth: boolean;
  selectedProfile: string | null;
  gamingMode: boolean;
  ramOpt: boolean;
  batteryOpt: boolean;
};

export const DEFAULT_TUNE: TuneState = {
  cpuOpt: true,
  gpuBoost: false,
  focusMode: false,
  touchResponse: "ultra",
  refreshTarget: 90,
  thermalLimit: 45,
  functions: [],
  dpiBoost: 0,
  touchSens: 0,
  stability: 0,
  swipeAccel: 0,
  deadzone: 0,
  adaptiveTouch: false,
  microSmooth: false,
  selectedProfile: null,
  gamingMode: false,
  ramOpt: false,
  batteryOpt: false,
};
