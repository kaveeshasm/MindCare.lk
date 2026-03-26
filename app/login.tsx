import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const canSignIn = emailAddress.trim().length > 4 && password.trim().length >= 8;

  const handleBack = () => {
    void Haptics.selectionAsync();
    router.back();
  };

  const handleSignIn = () => {
    if (!canSignIn) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const derivedName = (emailAddress.trim().split('@')[0] ?? '')
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(' ');

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({
      pathname: '/counselor-dashboard',
      params: {
        name: derivedName ? `Mr ${derivedName}` : 'Counselor',
        specialty: 'General Counseling',
      },
    });
  };

  const handleSocialPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCreateFree = () => {
    void Haptics.selectionAsync();
    router.push('/counselor-register');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.8} onPress={handleBack}>
            <Feather name="chevron-left" size={34} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Welcome Back</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.title}>Sign in to MindCare</Text>
          <Text style={styles.subtitle}>Continue your journey to a calmer mind and better wellness</Text>

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
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} activeOpacity={0.8}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={22} color="#B0B0B0" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signInButton, !canSignIn && styles.signInButtonDisabled]}
            activeOpacity={0.9}
            onPress={handleSignIn}
            disabled={!canSignIn}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.dividerWrap}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.socialButton} activeOpacity={0.85} onPress={handleSocialPress}>
            <Ionicons name="logo-apple" size={26} color="#000000" />
            <Text style={styles.socialText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton} activeOpacity={0.85} onPress={handleSocialPress}>
            <Ionicons name="logo-google" size={24} color="#000000" />
            <Text style={styles.socialText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Don&apos;t have an account?</Text>
            <TouchableOpacity onPress={handleCreateFree} activeOpacity={0.8}>
              <Text style={styles.createText}>Create one for free</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View pointerEvents="none" style={styles.bottomArc} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2F88E8',
  },
  container: {
    flex: 1,
    backgroundColor: '#2F88E8',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 54,
    lineHeight: 62,
    color: '#FFFFFF',
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.20)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  panel: {
    flex: 1,
    borderTopLeftRadius: 62,
    borderTopRightRadius: 62,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 22,
    paddingTop: 30,
  },
  title: {
    fontFamily: 'Inter',
    textAlign: 'center',
    fontSize: 23,
    lineHeight: 29,
    color: '#0C1016',
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontFamily: 'Inter',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 17,
    lineHeight: 22,
    color: '#0D0D0D',
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrap: {
    height: 58,
    borderBottomWidth: 1,
    borderBottomColor: '#D2D6DE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  input: {
    fontFamily: 'Inter',
    flex: 1,
    fontSize: 18,
    lineHeight: 22,
    color: '#111111',
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotText: {
    fontFamily: 'Inter',
    color: '#0D8AF3',
    fontWeight: '500',
    fontSize: 17,
    lineHeight: 22,
  },
  signInButton: {
    marginTop: 2,
    height: 62,
    borderRadius: 14,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonDisabled: {
    opacity: 0.65,
  },
  signInText: {
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  dividerWrap: {
    marginTop: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#B4BBC7',
  },
  dividerText: {
    fontFamily: 'Inter',
    fontSize: 20,
    lineHeight: 24,
    color: '#4F5971',
    fontWeight: '500',
  },
  socialButton: {
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: '#B3BAC7',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F7F8FA',
    marginBottom: 10,
  },
  socialText: {
    fontFamily: 'Inter',
    color: '#111111',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '500',
  },
  bottomRow: {
    marginTop: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  bottomText: {
    fontFamily: 'Inter',
    color: '#3F3F3F',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
  },
  createText: {
    fontFamily: 'Inter',
    color: '#0D8AF3',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '500',
  },
  bottomArc: {
    position: 'absolute',
    width: 520,
    height: 260,
    borderRadius: 260,
    backgroundColor: '#2F88E8',
    left: -40,
    bottom: -140,
    opacity: 0.96,
  },
});
