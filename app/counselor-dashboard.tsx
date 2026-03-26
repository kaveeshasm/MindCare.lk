import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type DashboardParams = {
  name?: string | string[];
  specialty?: string | string[];
};

const toSingleValue = (value: string | string[] | undefined): string =>
  typeof value === 'string' ? value : Array.isArray(value) ? value[0] ?? '' : '';

export default function CounselorDashboardScreen() {
  const params = useLocalSearchParams<DashboardParams>();
  const counselorName = toSingleValue(params.name) || 'Counselor';
  const specialty = toSingleValue(params.specialty) || 'General Counseling';
  const [isReminderSent, setIsReminderSent] = useState(false);

  const sendReminder = (label: string) => {
    setIsReminderSent(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Reminder Sent', `Reminder scheduled for Ruwani Madumali (${label}).`);
  };

  const handleRemindPress = () => {
    if (isReminderSent) {
      void Haptics.selectionAsync();
      Alert.alert('Already Reminded', 'A reminder is already set for this session.');
      return;
    }

    void Haptics.selectionAsync();
    Alert.alert('Set Reminder', 'Choose when to send the reminder.', [
      { text: 'Send Now', onPress: () => sendReminder('sent now') },
      { text: '15 min before', onPress: () => sendReminder('15 min before') },
      { text: '30 min before', onPress: () => sendReminder('30 min before') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Counselor Portal</Text>
          <TouchableOpacity style={styles.headerIcon} activeOpacity={0.85}>
            <Feather name="settings" size={24} color="#111B2E" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerDivider} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="people-outline" size={22} color="#2F88E8" />
              </View>
              <Text style={styles.summaryValue}>24</Text>
              <Text style={styles.summaryLabel}>Total Patient</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Feather name="clock" size={20} color="#2F88E8" />
              </View>
              <Text style={styles.summaryValue}>6.5</Text>
              <Text style={styles.summaryLabel}>Hours Today</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PENDING REQUEST</Text>
            <Text style={styles.sectionBadge}>1 New</Text>
          </View>

          <View style={styles.requestCard}>
            <View style={styles.requestTop}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80' }}
                style={styles.requestAvatar}
              />
              <View style={styles.requestMeta}>
                <Text style={styles.requestName}>Deepika Gunawardana</Text>
                <Text style={styles.requestTime}>Requested for Today, 2:00 PM</Text>
              </View>
            </View>

            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>Patient Note:</Text>
              <Text style={styles.noteText}>&quot;Feeling overwhelmed with work recently.&quot;</Text>
            </View>

            <View style={styles.tagsRow}>
              <Text style={styles.tagPill}>Anxiety Management</Text>
              <Text style={styles.timePill}>45 mins</Text>
            </View>

            <View style={styles.requestActions}>
              <TouchableOpacity style={styles.acceptButton} activeOpacity={0.88}>
                <Feather name="check" size={20} color="#FFFFFF" />
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.declineButton} activeOpacity={0.88}>
                <Feather name="x" size={20} color="#F24D4D" />
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>UPCOMING SESSIONS</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.replace({
                  pathname: '/counselor-schedule',
                  params: { name: counselorName, specialty },
                })
              }>
              <Text style={styles.linkText}>View Calendar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sessionCard}>
            <Text style={styles.sessionTime}>10:30 AM</Text>
            <View style={styles.sessionDivider} />
            <View style={styles.sessionMain}>
              <Text style={styles.sessionName}>Buddhini Perera</Text>
              <Text style={styles.sessionType}>Video call</Text>
            </View>
            <TouchableOpacity
              style={styles.sessionActionButton}
              activeOpacity={0.88}
              onPress={() =>
                router.push({
                  pathname: '/call-selection',
                  params: {
                    name: counselorName,
                    specialty,
                    patient: 'Buddhini Perera',
                  },
                })
              }>
              <Text style={styles.sessionActionText}>Join Now</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sessionCard}>
            <Text style={styles.sessionTime}>1:30 PM</Text>
            <View style={styles.sessionDivider} />
            <View style={styles.sessionMain}>
              <Text style={styles.sessionName}>Ruwani Madumali</Text>
              <Text style={styles.sessionType}>Video call</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.sessionActionButton,
                styles.remindButton,
                isReminderSent && styles.remindedButton,
              ]}
              activeOpacity={0.88}
              onPress={handleRemindPress}>
              <Text style={[styles.sessionActionText, styles.remindText, isReminderSent && styles.remindedText]}>
                {isReminderSent ? 'Reminded' : 'Remind'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>All caught up for today</Text>
          <Text style={styles.profileInfo}>
            Logged in as {counselorName} ({specialty})
          </Text>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85}>
            <Feather name="grid" size={24} color="#2F88E8" />
            <Text style={styles.navActive}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.85}
            onPress={() =>
              router.replace({
                pathname: '/counselor-schedule',
                params: { name: counselorName, specialty },
              })
            }>
            <Feather name="calendar" size={24} color="#7F8695" />
            <Text style={styles.navText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.85}
            onPress={() =>
              router.replace({
                pathname: '/counselor-profile',
                params: { name: counselorName },
              })
            }>
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
    backgroundColor: '#F3F5F8',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F3F5F8',
  },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    lineHeight: 24,
    color: '#111B2E',
    fontWeight: '800',
  },
  headerIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#DEE2E9',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEE4EC',
    padding: 14,
    gap: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EAF3FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: 'Inter',
    fontSize: 28,
    lineHeight: 34,
    color: '#111111',
    fontWeight: '800',
  },
  summaryLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#6B7484',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 17,
    lineHeight: 22,
    color: '#697283',
    fontWeight: '800',
  },
  sectionBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#77B4F5',
    color: '#2F88E8',
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  requestCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEE4EC',
    padding: 14,
    gap: 12,
  },
  requestTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  requestAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  requestMeta: {
    flex: 1,
    gap: 4,
  },
  requestName: {
    fontFamily: 'Inter',
    fontSize: 20,
    lineHeight: 24,
    color: '#111111',
    fontWeight: '800',
  },
  requestTime: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#4E5664',
    fontWeight: '500',
  },
  noteBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8DEE8',
    backgroundColor: '#F1F4F8',
    padding: 12,
    gap: 4,
  },
  noteTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 18,
    color: '#667085',
    fontWeight: '700',
  },
  noteText: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#444D5A',
    fontStyle: 'italic',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tagPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#8CBFF7',
    color: '#2F88E8',
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#111111',
    color: '#111111',
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  requestActions: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5EAF1',
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#2F88E8',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  acceptText: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  declineButton: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3D7D7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  declineText: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 20,
    color: '#F24D4D',
    fontWeight: '800',
  },
  linkText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#0D8AF3',
    fontWeight: '600',
  },
  sessionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D7DDE6',
    backgroundColor: '#F6F8FB',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionTime: {
    width: 74,
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 20,
    color: '#111111',
    fontWeight: '800',
  },
  sessionDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#CBD2DD',
  },
  sessionMain: {
    flex: 1,
    gap: 4,
  },
  sessionName: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 20,
    color: '#111111',
    fontWeight: '800',
  },
  sessionType: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#5D6777',
    fontWeight: '500',
  },
  sessionActionButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C8CCD2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  sessionActionText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#111111',
    fontWeight: '700',
  },
  remindButton: {
    backgroundColor: '#D7EAFF',
    borderColor: '#A9D0FB',
  },
  remindText: {
    color: '#2F88E8',
  },
  remindedButton: {
    backgroundColor: '#E8F6ED',
    borderColor: '#B8E3C3',
  },
  remindedText: {
    color: '#2A9A58',
  },
  footerText: {
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 20,
    color: '#626A78',
    fontWeight: '700',
  },
  profileInfo: {
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#8791A1',
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
