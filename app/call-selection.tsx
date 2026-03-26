import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type CallSelectionParams = {
  name?: string | string[];
  specialty?: string | string[];
  patient?: string | string[];
};

const toSingleValue = (value: string | string[] | undefined): string =>
  typeof value === 'string' ? value : Array.isArray(value) ? value[0] ?? '' : '';

export default function CallSelectionScreen() {
  const params = useLocalSearchParams<CallSelectionParams>();
  const counselorName = toSingleValue(params.name) || 'Counselor';
  const specialty = toSingleValue(params.specialty) || 'General Counseling';
  const patientName = toSingleValue(params.patient) || 'Buddhini Perera';

  const goOverview = () => {
    router.replace({
      pathname: '/counselor-dashboard',
      params: { name: counselorName, specialty },
    });
  };

  const goSchedule = () => {
    router.replace({
      pathname: '/counselor-schedule',
      params: { name: counselorName, specialty },
    });
  };

  const goProfile = () => {
    router.replace({
      pathname: '/counselor-profile',
      params: { name: counselorName, specialty },
    });
  };

  const handleJoinCall = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({
      pathname: '/video-call-room',
      params: {
        name: counselorName,
        specialty,
        patient: patientName,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <Text style={styles.pageLabel}>Call Selection</Text>

        <View style={styles.hero}>
          <Text style={styles.title}>Join Video Call</Text>
          <Text style={styles.subtitle}>Get ready to join the call</Text>

          <View style={styles.previewCard}>
            <View style={styles.previewTop}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Medical Consultation</Text>
              </View>
              <TouchableOpacity style={styles.settingsButton} activeOpacity={0.85}>
                <Feather name="settings" size={20} color="#E9EEF8" />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarCircle}>
              <Feather name="user" size={48} color="#A8B3C5" />
            </View>
            <Text style={styles.previewText}>Camera Preview</Text>
            <Text style={styles.patientName}>{patientName}</Text>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.controlButton} activeOpacity={0.85}>
              <Feather name="mic" size={26} color="#E7ECF5" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} activeOpacity={0.85}>
              <Feather name="video" size={26} color="#E7ECF5" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.joinButton} activeOpacity={0.9} onPress={handleJoinCall}>
            <Text style={styles.joinButtonText}>Join Call</Text>
          </TouchableOpacity>
          <Text style={styles.note}>Your microphone and camera settings will be applied when you join</Text>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={goOverview}>
            <Feather name="grid" size={24} color="#7F8695" />
            <Text style={styles.navText}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={goSchedule}>
            <Feather name="calendar" size={24} color="#2F88E8" />
            <Text style={styles.navActive}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={goProfile}>
            <Feather name="user" size={24} color="#7F8695" />
            <Text style={styles.navText}>My Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E2A42',
  },
  screen: {
    flex: 1,
    backgroundColor: '#1E2A42',
  },
  pageLabel: {
    marginTop: 2,
    marginLeft: 10,
    fontFamily: 'Inter',
    fontSize: 28,
    lineHeight: 34,
    color: '#8E98AA',
    fontWeight: '500',
  },
  hero: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 52,
  },
  title: {
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 56,
    lineHeight: 62,
    color: '#F2F5FA',
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 22,
    color: '#A8B2C3',
    fontWeight: '500',
  },
  previewCard: {
    marginTop: 28,
    borderRadius: 24,
    backgroundColor: 'rgba(11, 24, 47, 0.55)',
    borderWidth: 1,
    borderColor: '#2C3B57',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  previewTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tag: {
    borderRadius: 10,
    backgroundColor: '#F2F5FA',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tagText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 15,
    color: '#212734',
    fontWeight: '600',
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3A455A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 2,
    borderColor: '#56647C',
    backgroundColor: '#354257',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    marginTop: 16,
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 20,
    color: '#C8D0DE',
    fontWeight: '500',
  },
  patientName: {
    marginTop: 8,
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 18,
    color: '#8DA1C2',
    fontWeight: '600',
  },
  controlsRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4A556A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButton: {
    marginTop: 24,
    height: 62,
    borderRadius: 16,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonText: {
    fontFamily: 'Inter',
    fontSize: 24,
    lineHeight: 28,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  note: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    color: '#9DA7B8',
    fontWeight: '500',
    paddingHorizontal: 18,
  },
  bottomBar: {
    height: 78,
    borderTopWidth: 1,
    borderTopColor: '#D4DAE5',
    backgroundColor: '#F5F8FC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  navItem: {
    alignItems: 'center',
    gap: 6,
  },
  navText: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#737C8C',
    fontWeight: '700',
  },
  navActive: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#2F88E8',
    fontWeight: '800',
  },
});
