import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type VideoCallRoomParams = {
  patient?: string | string[];
  name?: string | string[];
  specialty?: string | string[];
};

const toSingleValue = (value: string | string[] | undefined): string =>
  typeof value === 'string' ? value : Array.isArray(value) ? value[0] ?? '' : '';

export default function VideoCallRoomScreen() {
  const params = useLocalSearchParams<VideoCallRoomParams>();
  const patientName = toSingleValue(params.patient) || 'Deepika Gunawardana';
  const counselorName = toSingleValue(params.name) || 'Counselor';
  const specialty = toSingleValue(params.specialty) || 'General Counseling';

  const handleEndCall = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.replace({
      pathname: '/counselor-dashboard',
      params: { name: counselorName, specialty },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <Text style={styles.pageLabel}>Video Call Room</Text>

        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1200&q=80',
          }}
          style={styles.callStage}
          imageStyle={styles.callBackgroundImage}>
          <View style={styles.overlay} />

          <View style={styles.topInfoBar}>
            <View style={styles.topLeft}>
              <View style={styles.greenDot} />
              <Text style={styles.topName}>{patientName}</Text>
            </View>
            <View style={styles.topRight}>
              <View style={styles.redDot} />
              <Text style={styles.timerText}>04:22</Text>
            </View>
          </View>

          <View style={styles.remotePreview}>
            <ImageBackground
              source={{
                uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80',
              }}
              style={styles.remotePreviewImage}
              imageStyle={styles.remotePreviewImageStyle}
            />
          </View>

          <TouchableOpacity style={styles.audioOnlyButton} activeOpacity={0.85}>
            <Feather name="headphones" size={16} color="#FFFFFF" />
            <Text style={styles.audioOnlyText}>Switch to Audio-Only</Text>
          </TouchableOpacity>

          <View style={styles.controlDock}>
            <TouchableOpacity style={styles.controlItem} activeOpacity={0.85}>
              <Feather name="mic-off" size={18} color="#DCE4F2" />
              <Text style={styles.controlLabel}>MIC</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlItem} activeOpacity={0.85}>
              <Feather name="video-off" size={18} color="#DCE4F2" />
              <Text style={styles.controlLabel}>VIDEO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.controlItem, styles.endItem]} activeOpacity={0.85} onPress={handleEndCall}>
              <MaterialCommunityIcons name="phone-hangup" size={18} color="#FFFFFF" />
              <Text style={styles.controlLabel}>END</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlItem} activeOpacity={0.85}>
              <Ionicons name="stats-chart-outline" size={18} color="#DCE4F2" />
              <Text style={styles.controlLabel}>SIGNAL</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlItem} activeOpacity={0.85}>
              <Feather name="more-horizontal" size={18} color="#DCE4F2" />
              <Text style={styles.controlLabel}>MORE</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E7EDF6',
  },
  screen: {
    flex: 1,
    backgroundColor: '#E7EDF6',
  },
  pageLabel: {
    marginTop: 2,
    marginLeft: 10,
    fontFamily: 'Inter',
    fontSize: 28,
    lineHeight: 34,
    color: '#699CE8',
    fontWeight: '500',
  },
  callStage: {
    flex: 1,
    margin: 8,
    borderWidth: 2,
    borderColor: '#2F88E8',
    overflow: 'hidden',
  },
  callBackgroundImage: {
    opacity: 0.72,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 41, 63, 0.42)',
  },
  topInfoBar: {
    marginTop: 10,
    marginHorizontal: 16,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F5F8FC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2AC769',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F04444',
  },
  topName: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 18,
    color: '#1E2736',
    fontWeight: '500',
  },
  timerText: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 18,
    color: '#1E2736',
    fontWeight: '700',
  },
  remotePreview: {
    position: 'absolute',
    top: 78,
    right: 20,
    width: 88,
    height: 128,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0D1626',
    backgroundColor: '#0D1626',
  },
  remotePreviewImage: {
    flex: 1,
  },
  remotePreviewImageStyle: {
    borderRadius: 12,
  },
  audioOnlyButton: {
    position: 'absolute',
    bottom: 124,
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(240, 246, 255, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(240, 246, 255, 0.26)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioOnlyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 16,
    color: '#F1F6FF',
    fontWeight: '500',
  },
  controlDock: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    height: 86,
    borderRadius: 18,
    backgroundColor: '#0E1C36',
    borderWidth: 1,
    borderColor: '#223351',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  controlItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  endItem: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FF2E6E',
  },
  controlLabel: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 12,
    color: '#DCE4F2',
    fontWeight: '700',
  },
});
