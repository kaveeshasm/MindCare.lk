import { signInMember, signInMemberWithGoogle } from "@/lib/members";
import { signInWithNativeGoogle } from "@/lib/native-google-signin";
import { Feather, Ionicons } from "@expo/vector-icons";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { isCurrentUserAdmin } from "@/lib/admin";
import { setExpectedRole } from "@/components/AuthContext";

export default function LoginScreen() {
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const canSignIn =
    emailAddress.trim().length > 4 && password.trim().length >= 8;

  const handleBack = () => {
    void Haptics.selectionAsync();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/role-selection');
    }
  };

  const handleSignIn = async () => {
    if (!canSignIn) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setExpectedRole("member");
      await signInMember(emailAddress.trim().toLowerCase(), password);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const isAdmin = await isCurrentUserAdmin();
      if (isAdmin) {
        router.replace("/(admin-tabs)/dashboard" as any);
      } else {
        router.replace("/(main-tabs)/profile");
      }
    } catch (error) {
      setExpectedRole(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Sign In Failed",
        error instanceof Error && error.message
          ? error.message
          : "Unable to sign in right now.",
      );
    }
  };

  const handleGooglePress = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      Alert.alert(
        "Google Sign-In Requires Dev Build",
        "Expo Go cannot complete Google OAuth redirects. Build and run a development build, then try again.",
      );
      return;
    }

    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      Alert.alert(
        "Google Sign-In",
        "Google sign-in is not configured yet. Add Google client IDs to env vars.",
      );
      return;
    }

    try {
      setIsGoogleSubmitting(true);
      setExpectedRole("member");
      const tokens = await signInWithNativeGoogle();

      if (!tokens) {
        setExpectedRole(null);
        return;
      }

      await signInMemberWithGoogle(tokens.idToken, tokens.accessToken);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const isAdmin = await isCurrentUserAdmin();
      if (isAdmin) {
        router.replace("/(admin-tabs)/dashboard" as any);
      } else {
        router.replace("/(main-tabs)/profile");
      }
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Google Sign-In Failed",
        error instanceof Error && error.message
          ? error.message
          : "Unable to sign in with Google right now.",
      );
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleCreateFree = () => {
    void Haptics.selectionAsync();
    router.push("/member-register");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={handleBack}
          >
            <Feather name="chevron-left" size={34} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Welcome Back</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.title}>Sign in to MindCare</Text>
          <Text style={styles.subtitle}>
            Continue your journey to a calmer mind and better wellness
          </Text>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <Feather name="mail" size={20} color="#131313" />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#818181"
              style={styles.input}
              value={emailAddress}
              onChangeText={setEmailAddress}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          <View style={styles.passwordRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity activeOpacity={0.8}>
              <Text style={styles.forgotText}>forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrap}>
            <Feather name="lock" size={20} color="#131313" />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#818181"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#B0B0B0"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.signInButton,
              !canSignIn && styles.signInButtonDisabled,
            ]}
            activeOpacity={0.9}
            onPress={() => void handleSignIn()}
            disabled={!canSignIn}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.dividerWrap}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.socialButton}
            activeOpacity={0.85}
            onPress={() => void handleGooglePress()}
            disabled={isGoogleSubmitting}
          >
            <Ionicons name="logo-google" size={24} color="#000000" />
            <Text style={styles.socialText}>
              {isGoogleSubmitting ? "Signing in..." : "Continue with Google"}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Don&apos;t have an account?</Text>
            <TouchableOpacity onPress={handleCreateFree} activeOpacity={0.8}>
              <Text style={styles.createText}>Create one for free</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#2F88E8",
  },
  container: {
    flex: 1,
    backgroundColor: "#2F88E8",
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
  },
  backButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  headerTitle: {
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 32,
    lineHeight: 40,
    color: "#FFFFFF",
    fontWeight: "800",
    textShadowColor: "rgba(0, 0, 0, 0.20)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  panel: {
    flex: 1,
    borderTopLeftRadius: 62,
    borderTopRightRadius: 62,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 22,
    paddingTop: 30,
  },
  title: {
    fontFamily: "Inter",
    textAlign: "center",
    fontSize: 20,
    lineHeight: 20,
    color: "#0C1016",
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontFamily: "Inter",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 20,
    color: "#333333",
    fontWeight: "500",
    paddingHorizontal: 12,
  },
  label: {
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 22,
    color: "#0D0D0D",
    fontWeight: "500",
    marginBottom: 6,
  },
  inputWrap: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#D2D6DE",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  input: {
    fontFamily: "Inter",
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#111111",
  },
  passwordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotText: {
    fontFamily: "Inter",
    color: "#0D8AF3",
    fontWeight: "500",
    fontSize: 15,
    lineHeight: 22,
  },
  signInButton: {
    marginTop: 2,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#2F88E8",
    justifyContent: "center",
    alignItems: "center",
  },
  signInButtonDisabled: {
    opacity: 0.65,
  },
  signInText: {
    fontFamily: "Inter",
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  dividerWrap: {
    marginTop: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#B4BBC7",
  },
  dividerText: {
    fontFamily: "Inter",
    fontSize: 18,
    lineHeight: 15,
    color: "#4F5971",
    fontWeight: "500",
  },
  socialButton: {
    height: 45,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: "#B3BAC7",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#F7F8FA",
    marginBottom: 10,
  },
  socialText: {
    fontFamily: "Inter",
    color: "#111111",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
  },
  bottomRow: {
    marginTop: 5,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  bottomText: {
    fontFamily: "Inter",
    color: "#3F3F3F",
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "600",
  },
  createText: {
    fontFamily: "Inter",
    color: "#0D8AF3",
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "500",
  },
});
