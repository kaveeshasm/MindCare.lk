import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(main-tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(main-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="member-login" options={{ headerShown: false }} />
        <Stack.Screen name="counselor-login" options={{ headerShown: false }} />
        <Stack.Screen
          name="counselor-register"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="member-register"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="counselor-profile"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="counselor-dashboard"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="counselor-schedule"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="call-selection" options={{ headerShown: false }} />
        <Stack.Screen name="video-call-room" options={{ headerShown: false }} />
        <Stack.Screen
          name="schedule-session"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="doctor_profile" options={{ headerShown: false }} />
        <Stack.Screen name="reviews" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
