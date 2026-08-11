import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import "react-native-reanimated";

// Suppress unhandled asset download promise rejections globally
if (typeof Promise !== "undefined") {
  const p = Promise as any;
  let currentHandler = p._onUnhandled;
  
  Object.defineProperty(p, "_onUnhandled", {
    configurable: true,
    enumerable: true,
    get() {
      return currentHandler;
    },
    set(newHandler) {
      currentHandler = (id: any, rejection: any) => {
        const msg = rejection?.message || "";
        if (msg.includes("ExpoAsset.downloadAsync") || msg.includes("downloadAsync")) {
          // Suppress warning/crash for asset download failures
          return;
        }
        if (newHandler) {
          newHandler(id, rejection);
        }
      };
    }
  });

  if (currentHandler) {
    p._onUnhandled = currentHandler;
  }
}

if (typeof globalThis !== "undefined") {
  (globalThis as any).onunhandledrejection = (event: any) => {
    const msg = event?.reason?.message || "";
    if (msg.includes("ExpoAsset.downloadAsync") || msg.includes("downloadAsync")) {
      if (event.preventDefault) {
        event.preventDefault();
      }
    }
  };
}

import { AuthProvider } from "@/components/AuthContext";
import { CallProvider } from "@/context/CallContext";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import * as Font from "expo-font";
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome, FontAwesome5 } from "@expo/vector-icons";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        const fontsToLoad = {
          ...Feather.font,
          ...Ionicons.font,
          ...MaterialCommunityIcons.font,
          ...FontAwesome.font,
          ...FontAwesome5.font,
          "Inter": require("../assets/fonts/Inter-Regular.ttf"),
          "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
          "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
          "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
        };
        
        await Font.loadAsync(fontsToLoad);
      } catch (e) {
        console.warn("Failed to load assets/fonts:", e);
      } finally {
        setAppReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <AuthProvider>
      <CallProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(main-tabs)" />
          <Stack.Screen name="(counselor-tabs)" />
          <Stack.Screen name="(admin-tabs)" />
          <Stack.Screen name="admin-login" />
          <Stack.Screen name="member-login" />
          <Stack.Screen name="counselor-login" />
          <Stack.Screen name="article-detail" />
          <Stack.Screen name="counselor-register" />
          <Stack.Screen name="member-register" />
          <Stack.Screen name="member-information-form" />
          <Stack.Screen name="call-selection" />
          <Stack.Screen name="video-call-room" />
          <Stack.Screen name="schedule-session" />
          <Stack.Screen name="doctor_profile" />
          <Stack.Screen name="reviews" />
          <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
        </Stack>
      </CallProvider>
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor="#FFFFFF" hidden={false} />
    </AuthProvider>
  );
}