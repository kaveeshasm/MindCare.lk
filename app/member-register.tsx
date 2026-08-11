import { getFirebaseConfigError } from "@/lib/firebase";
import { createMemberAccount, signInMemberWithGoogle } from "@/lib/members";
import { signInWithNativeGoogle } from "@/lib/native-google-signin";
import { setExpectedRole } from "@/components/AuthContext";
import { Feather, Ionicons } from "@expo/vector-icons";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MemberRegisterScreen() {
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleSignUp = async () => {
    const trimmedEmail = emailAddress.trim();

    if (!trimmedEmail || !password || !confirmPassword) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Missing Details",
        "Please fill all fields before signing up.",
      );
      return;
    }

    if (!trimmedEmail.includes("@")) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Weak Password", "Password should be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Password Mismatch",
        "Password and confirm password must match.",
      );
      return;
    }

    try {
      setExpectedRole("member");
      await createMemberAccount(trimmedEmail, password);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.replace({
        pathname: "/member-information-form",
        params: {
          email: trimmedEmail,
        },
      });
    } catch (error) {
      setExpectedRole(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Sign Up Failed",
        error instanceof Error && error.message
          ? error.message
          : "Unable to create your account right now.",
      );
    }
  };

  const handleSignIn = () => {
    void Haptics.selectionAsync();
    router.push("/member-login");
  };

  const handleGooglePress = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      Alert.alert(
        "Google Sign-Up Requires Dev Build",
        "Expo Go cannot complete Google OAuth redirects. Build and run a development build, then try again.",
      );
      return;
    }

    const firebaseConfigError = getFirebaseConfigError();
    if (firebaseConfigError) {
      Alert.alert("Firebase Not Configured", firebaseConfigError);
      return;
    }

    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      Alert.alert(
        "Google Sign-Up",
        "Google sign-up is not configured yet. Add Google client IDs to env vars.",
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
      router.replace("/(main-tabs)/profile");
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Google Sign-Up Failed",
        error instanceof Error && error.message
          ? error.message
          : "Unable to sign up with Google right now.",
      );
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => {
              void Haptics.selectionAsync();
              router.back();
            }}
          >
            <Feather name="chevron-left" size={34} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          join Mindcare and start your journey to wellness
        </Text>
        <Text style={styles.roleText}>I am a member</Text>

        <View style={styles.formPanel}>
          <ScrollView
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.iconTile}>
              <Ionicons name="heart" size={42} color="#FFFFFF" />
            </View>

            <View style={styles.dividerWrap}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>sign up with email</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={18} color="#5D5D5D" />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#828282"
                value={emailAddress}
                onChangeText={setEmailAddress}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color="#5D5D5D" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#828282"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#A3A3A3"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color="#5D5D5D" />
              <TextInput
                style={styles.input}
                placeholder="Re enter the Password"
                placeholderTextColor="#828282"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowConfirmPassword((prev) => !prev)}
              >
                <Feather
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#A3A3A3"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.signUpButton}
              activeOpacity={0.9}
              onPress={handleSignUp}
            >
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>

            <View style={styles.signInRow}>
              <Text style={styles.signInPrompt}>Already have an account?</Text>
              <TouchableOpacity 
                activeOpacity={0.85} 
                onPress={handleSignIn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.signInLink}>Sign in</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.termsText}>
              By Signing up you agree to our Terms and Service and Privacy
              Policy.We ensure your data is encrypted and secure
            </Text>

            <View style={styles.bottomSocialWrap}>
              <View style={styles.bottomDividerWrap}>
                <View style={styles.bottomDividerLine} />
                <Text style={styles.bottomDividerText}>Or</Text>
                <View style={styles.bottomDividerLine} />
              </View>

              <TouchableOpacity
                style={styles.socialButton}
                activeOpacity={0.85}
                onPress={() => void handleGooglePress()}
                disabled={isGoogleSubmitting}
              >
                <Ionicons name="logo-google" size={24} color="#000000" />
                <Text style={styles.socialText}>
                  {isGoogleSubmitting
                    ? "Signing up..."
                    : "Continue with Google"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginTop: 24,
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 30,
    lineHeight: 36,
    color: "#FFFFFF",
    fontWeight: "800",
    textShadowColor: "rgba(0, 0, 0, 0.20)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  subtitle: {
    marginTop: 4,
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: "#E8F1FD",
    fontWeight: "500",
    paddingHorizontal: 24,
  },
  roleText: {
    marginTop: 20,
    marginBottom: 11,
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 22,
    lineHeight: 28,
    color: "#FFFFFF",
    fontStyle: "italic",
    fontWeight: "700",
  },
  formPanel: {
    flex: 1,
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
    backgroundColor: "#F3F4F6",
    paddingTop: 15,
    overflow: "hidden",
  },
  formContent: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    zIndex: 2,
  },
  iconTile: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "#2F88E8",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  dividerWrap: {
    marginTop: 16,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#D6DCE6",
  },
  dividerText: {
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 16,
    color: "#697386",
    fontWeight: "600",
  },
  label: {
    marginTop: 16,
    marginBottom: 4,
    fontFamily: "Inter",
    fontSize: 12.5,
    lineHeight: 19,
    color: "#161616",
    fontWeight: "500",
  },
  inputWrap: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 24,
    color: "#232323",
  },
  signUpButton: {
    marginTop: 28,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#2F88E8",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpText: {
    fontFamily: "Inter",
    fontSize: 18,
    lineHeight: 28,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  signInRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  signInPrompt: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 20,
    color: "#3D3D3D",
    fontWeight: "600",
  },
  signInLink: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 20,
    color: "#0F8AF1",
    fontWeight: "700",
  },
  termsText: {
    marginTop: 4,
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 10,
    lineHeight: 15,
    color: "#7E7E7E",
    fontWeight: "500",
    paddingHorizontal: 8,
  },
  bottomSocialWrap: {
    marginTop: 24,
  },
  bottomDividerWrap: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bottomDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#B4BBC7",
  },
  bottomDividerText: {
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
  },
  socialText: {
    fontFamily: "Inter",
    color: "#111111",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
  },
});
