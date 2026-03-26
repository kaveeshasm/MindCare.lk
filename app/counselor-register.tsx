import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SALUTATION_OPTIONS = ['Mr', 'Mrs', 'Ms'] as const;

export default function CounselorRegisterScreen() {
  const [salutation, setSalutation] = useState<(typeof SALUTATION_OPTIONS)[number]>('Mr');
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSelectSalutation = () => {
    void Haptics.selectionAsync();
    Alert.alert(
      'Select Title',
      'Choose your title',
      [
        ...SALUTATION_OPTIONS.map((option) => ({
          text: option,
          onPress: () => {
            setSalutation(option);
            void Haptics.selectionAsync();
          },
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
      { cancelable: true }
    );
  };

  const handleSignUp = () => {
    const trimmedSalutation = salutation.trim();
    const trimmedName = fullName.trim();
    const trimmedEmail = emailAddress.trim();

    if (!trimmedSalutation || !trimmedName || !trimmedEmail || !password || !confirmPassword) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Missing Details', 'Please fill all fields before signing up.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Weak Password', 'Password should be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Password Mismatch', 'Password and confirm password must match.');
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({
      pathname: '/counselor-profile',
      params: {
        name: trimmedName,
        email: trimmedEmail,
        salutation: trimmedSalutation,
      },
    });
  };

  const handleSignIn = () => {
    void Haptics.selectionAsync();
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>join Mindcare and start your journey to wellness</Text>
        <Text style={styles.roleText}>I am a counselor</Text>

        <View style={styles.formPanel}>
          <View pointerEvents="none" style={styles.bottomArc} />
          <ScrollView
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons name="stethoscope" size={50} color="#FFFFFF" />
            </View>

            <Text style={styles.label}>Mr/ Mrs/ Ms</Text>
            <TouchableOpacity style={styles.inputWrap} activeOpacity={0.85} onPress={handleSelectSalutation}>
              <Feather name="user" size={18} color="#5D5D5D" />
              <Text style={styles.input}>{salutation}</Text>
              <Feather name="chevron-down" size={20} color="#8A8A8A" />
            </TouchableOpacity>

            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={18} color="#5D5D5D" />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#828282"
                value={fullName}
                onChangeText={setFullName}
              />
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
              <TouchableOpacity activeOpacity={0.85} onPress={() => setShowPassword((prev) => !prev)}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#A3A3A3" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color="#5D5D5D" />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#828282"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity activeOpacity={0.85} onPress={() => setShowConfirmPassword((prev) => !prev)}>
                <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#A3A3A3" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.signUpButton} activeOpacity={0.9} onPress={handleSignUp}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>

            <View style={styles.signInRow}>
              <Text style={styles.signInPrompt}>Already have an account?</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={handleSignIn}>
                <Text style={styles.signInLink}>Sign in</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.termsText}>
              By Signing up you agree to our Terms and Service and Privacy Policy.We ensure your data is encrypted and
              secure
            </Text>
          </ScrollView>
        </View>
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
  title: {
    marginTop: 24,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 30,
    lineHeight: 36,
    color: '#FFFFFF',
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.20)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  subtitle: {
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    color: '#E8F1FD',
    fontWeight: '500',
    paddingHorizontal: 24,
  },
  roleText: {
    marginTop: 28,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 22,
    lineHeight: 28,
    color: '#FFFFFF',
    fontStyle: 'italic',
    fontWeight: '700',
  },
  formPanel: {
    flex: 1,
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
    backgroundColor: '#F3F4F6',
    paddingTop: 22,
    overflow: 'hidden',
  },
  formContent: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    zIndex: 2,
  },
  iconTile: {
    width: 100,
    height: 100,
    borderRadius: 22,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 19,
    color: '#161616',
    fontWeight: '500',
  },
  inputWrap: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 24,
    color: '#232323',
  },
  signUpButton: {
    marginTop: 18,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontFamily: 'Inter',
    fontSize: 24,
    lineHeight: 28,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  signInRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  signInPrompt: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 19,
    color: '#3D3D3D',
    fontWeight: '600',
  },
  signInLink: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 19,
    color: '#0F8AF1',
    fontWeight: '700',
  },
  termsText: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 15,
    color: '#7E7E7E',
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  bottomArc: {
    position: 'absolute',
    width: 640,
    height: 300,
    borderRadius: 320,
    backgroundColor: '#2F88E8',
    left: -120,
    bottom: -220,
    opacity: 0.96,
    zIndex: 0,
  },
});
