import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ActivityItem,
  AppNotification,
  BatterySnapshot,
  DeviceSnapshot,
  Locale,
  NetworkResult,
  ScreenId,
  SheetKind,
  StorageSnapshot,
  TabId,
  ThemeMode,
  ToastItem,
  ToastTone,
  TuneState,
  AppTarget,
  GameTune,
  SensProfile,
} from "./types";
import { DEFAULT_TUNE, DEFAULT_APP_TARGETS } from "./types";
import { DEFAULT_GAME_TUNE, seedSens } from "./games";
import { uid } from "./utils";
import type { PublicSession } from "./thanox-auth";

const MAX_ACTIVITY = 80;
const MAX_NOTIF = 80;

type AppState = {
  hydrated: boolean;
  setHydrated: () => void;
  locale: Locale;
  theme: ThemeMode;
  compact: boolean;
  reduceMotion: boolean;
  haptics: boolean;
  autoRefresh: boolean;
  refreshSeconds: number;
  confirmActions: boolean;
  notificationsEnabled: boolean;
  notificationSound: boolean;
  displayName: string;
  analysisDepth: number;
  perfMode: "balanced" | "performance" | "quiet";
  tune: TuneState;
  tab: TabId;
  stack: ScreenId[];
  toasts: ToastItem[];
  sheet: SheetKind | null;
  splashDone: boolean;
  hasEntered: boolean;
  autoEnter: boolean;
  requireEnter: boolean;
  activities: ActivityItem[];
  notifications: AppNotification[];
  lastNetwork: NetworkResult | null;
  lastDevice: DeviceSnapshot | null;
  lastBattery: BatterySnapshot | null;
  lastStorage: StorageSnapshot | null;
  lastScore: number | null;
  lastRefreshAt: number | null;
  welcomeSeeded: boolean;
  session: PublicSession | null;
  sessionReady: boolean;
  appTargets: AppTarget[];
  selectedAppId: string;
  addAppTarget: (name: string) => void;
  removeAppTarget: (id: string) => void;
  setSelectedAppId: (id: string) => void;
  setAppIcon: (id: string, icon?: string) => void;
  loginMark?: string;
  setLoginMark: (v?: string) => void;
  gameTunes: Record<string, GameTune>;
  patchGameTune: (id: string, p: Partial<GameTune>) => void;
  sens: SensProfile;
  setSens: (p: Partial<SensProfile>) => void;
  setSession: (s: PublicSession | null) => void;
  setSessionReady: (v: boolean) => void;
  setLocale: (l: Locale) => void;
  setTheme: (t: ThemeMode) => void;
  setCompact: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setHaptics: (v: boolean) => void;
  setAutoRefresh: (v: boolean) => void;
  setRefreshSeconds: (n: number) => void;
  setConfirmActions: (v: boolean) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setNotificationSound: (v: boolean) => void;
  setDisplayName: (n: string) => void;
  setAnalysisDepth: (n: number) => void;
  setPerfMode: (m: "balanced" | "performance" | "quiet") => void;
  patchTune: (p: Partial<TuneState>) => void;
  toggleFn: (id: string) => void;
  setTab: (t: TabId) => void;
  push: (s: ScreenId) => void;
  pop: () => void;
  goSearch: () => void;
  toast: (tone: ToastTone, message: string) => void;
  dismissToast: (id: string) => void;
  openSheet: (s: SheetKind) => void;
  closeSheet: () => void;
  finishSplash: () => void;
  enterApp: () => void;
  setAutoEnter: (v: boolean) => void;
  setRequireEnter: (v: boolean) => void;
  addActivity: (a: Omit<ActivityItem, "id" | "at"> & { at?: number }) => void;
  clearActivity: () => void;
  removeActivity: (id: string) => void;
  addNotification: (n: Omit<AppNotification, "id" | "at" | "read"> & { at?: number }) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setLastNetwork: (r: NetworkResult) => void;
  setLastDevice: (d: DeviceSnapshot) => void;
  setLastBattery: (b: BatterySnapshot) => void;
  setLastStorage: (s: StorageSnapshot) => void;
  setLastScore: (n: number) => void;
  touchRefresh: () => void;
  seedWelcome: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: true,
      setHydrated: () => set({ hydrated: true }),
      locale: "vi",
      theme: "dark",
      compact: false,
      reduceMotion: false,
      haptics: true,
      autoRefresh: false,
      refreshSeconds: 30,
      confirmActions: true,
      notificationsEnabled: false,
      notificationSound: true,
      displayName: "",
      analysisDepth: 5,
      perfMode: "balanced",
      tune: { ...DEFAULT_TUNE },
      tab: "home",
      stack: [],
      toasts: [],
      sheet: null,
      splashDone: false,
      hasEntered: false,
      autoEnter: true,
      requireEnter: false,
      activities: [],
      notifications: [],
      lastNetwork: null,
      lastDevice: null,
      lastBattery: null,
      lastStorage: null,
      lastScore: null,
      lastRefreshAt: null,
      welcomeSeeded: false,
      session: null,
      sessionReady: false,
      appTargets: DEFAULT_APP_TARGETS,
      selectedAppId: "ff",
      addAppTarget: (name) => {
        const n = name.trim();
        if (!n) return;
        set((s) => ({
          appTargets: [...s.appTargets, { id: uid(), name: n, kind: "custom" }],
        }));
      },
      removeAppTarget: (id) =>
        set((s) => ({
          appTargets: s.appTargets.filter((a) => a.id !== id || a.kind !== "custom"),
          selectedAppId: s.selectedAppId === id ? (s.appTargets[0]?.id ?? "ff") : s.selectedAppId,
        })),
      setSelectedAppId: (selectedAppId) => set({ selectedAppId }),
      setAppIcon: (id, icon) =>
        set((s) => ({
          appTargets: s.appTargets.map((a) => (a.id === id ? { ...a, icon } : a)),
        })),
      loginMark: undefined,
      setLoginMark: (loginMark) => set({ loginMark }),
      gameTunes: {},
      patchGameTune: (id, p) =>
        set({
          gameTunes: {
            ...get().gameTunes,
            [id]: { ...DEFAULT_GAME_TUNE, ...get().gameTunes[id], ...p },
          },
        }),
      sens: seedSens("thanox"),
      setSens: (p) => set({ sens: { ...get().sens, ...p } }),
      setSession: (session) => set({ session }),
      setSessionReady: (sessionReady) => set({ sessionReady }),
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
      setCompact: (compact) => set({ compact }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setHaptics: (haptics) => set({ haptics }),
      setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
      setRefreshSeconds: (refreshSeconds) => set({ refreshSeconds }),
      setConfirmActions: (confirmActions) => set({ confirmActions }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setNotificationSound: (notificationSound) => set({ notificationSound }),
      setDisplayName: (displayName) => set({ displayName }),
      setAna
... 