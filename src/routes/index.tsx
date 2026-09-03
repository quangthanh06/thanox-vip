import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ConfirmSheet, PhoneFrame, StatusBar, TabBar, ToastHost } from "@/components/shell";
import { Stage } from "@/components/nav";
import { HomeScreen } from "@/screens/home";
import { OptimizeScreen } from "@/screens/optimize";
import { AppOptScreen } from "../screens/app-opt";
import { ProfileScreen } from "../screens/profile";
import { ActivityScreen } from "@/screens/activity";
import { NotificationsScreen } from "@/screens/notifications";
import {
  AboutScreen,
  AppearanceScreen,
  InstallScreen,
  PreferencesScreen,
  PrivacyScreen,
  SearchScreen,
  SettingsScreen,
  SupportScreen,
  TermsScreen,
} from "@/screens/settings";
import {
  AnalyzerScreen,
  BatteryScreen,
  DeviceScreen,
  DiagnosticsScreen,
  NetworkScreen,
  NotifToolsScreen,
  StorageScreen,
  ToolsScreen,
  WorkspaceScreen,
} from "@/screens/tools";
import { PerformanceScreen } from "@/screens/performance";
import { AuthScreen } from "@/screens/auth";
import { AdminScreen } from "@/screens/admin";
import { useAppStore } from "@/lib/store";
import { readSessionToken, thanoxSession, writeSessionToken } from "@/lib/thanox-auth";
import type { ScreenId, TabId } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const tab = useAppStore((s) => s.tab);
  const stack = useAppStore((s) => s.stack);
  const session = useAppStore((s) => s.session);

  useEffect(() => {
    const s = useAppStore.getState();
    s.setHydrated();
    s.enterApp();
    s.setLocale("vi");
    if (!s.welcomeSeeded) {
      s.seedWelcome();
    }
    const token = readSessionToken();
    if (!token || s.session) return;
    void thanoxSession({ data: { token } })
      .then((res) => {
        if (res.ok) useAppStore.getState().setSession(res.session);
        else writeSessionToken(null);
      })
      .catch(() => undefined);
  }, []);

  if (!session) {
    return (
      <PhoneFrame>
        <StatusBar />
        <AuthScreen />
        <ToastHost />
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <StatusBar />
      <Stage tab={tab} stack={stack} renderTab={tabFor} renderScreen={screenFor} />
      <TabBar />
      <ToastHost />
      <ConfirmSheet />
    </PhoneFrame>
  );
}

function tabFor(id: TabId) {
  switch (id) {
    case "optimize":
      return <OptimizeScreen />;
    case "appopt":
      return <AppOptScreen />;
    case "tools":
      return <ToolsScreen />;
    case "profile":
      return <ProfileScreen />;
    default:
      return <HomeScreen />;
  }
}

function screenFor(current: ScreenId) {
  switch (current) {
    case "activity":
      return <ActivityScreen />;
    case "notifications":
      return <NotificationsScreen />;
    case "settings":
      return <SettingsScreen />;
    case "search":
      return <SearchScreen />;
    case "device":
      return <DeviceScreen />;
    case "network":
      return <NetworkScreen />;
    case "battery":
      return <BatteryScreen />;
    case "storage":
      return <StorageScreen />;
    case "diagnostics":
      return <DiagnosticsScreen />;
    case "analyzer":
      return <AnalyzerScreen />;
    case "appearance":
      return <AppearanceScreen />;
    case "about":
      return <AboutScreen />;
    case "privacy":
      return <PrivacyScreen />;
    case "terms":
      return <TermsScreen />;
    case "support":
      return <SupportScreen />;
    case "preferences":
      return <PreferencesScreen />;
    case "notif-tools":
      return <NotifToolsScreen />;
    case "install":
      return <InstallScreen />;
    case "workspace":
      return <WorkspaceScreen />;
    case "admin":
      return <AdminScreen />;
    case "performance":
      return <PerformanceScreen />;
    case "auth":
      return <AuthScreen />;
    default:
      return <HomeScreen />;
  }
}
