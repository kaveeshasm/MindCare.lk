import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { signOut } from 'firebase/auth';

import { getCounselorProfile } from '@/lib/counselors';
import { getMemberProfile } from '@/lib/members';
import { auth, db } from '@/lib/firebase';
import { useCounselorSessions } from '@/components/session-store';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc } from 'firebase/firestore';

function PatientName({ uid, style }: { uid: string; style?: any }) {
  const [name, setName] = useState<string>('Loading...');

  useEffect(() => {
    if (!uid) {
      setName('Unknown Patient');
      return;
    }
    let isMounted = true;
    getMemberProfile(uid).then(profile => {
      if (isMounted) setName(profile?.name || profile?.displayName || 'Unknown Patient');
    }).catch(() => {
      if (isMounted) setName('Unknown Patient');
    });
    return () => { isMounted = false; };
  }, [uid]);

  return <Text style={style || styles.sessionName}>{name}</Text>;
}

export default function CounselorDashboardScreen() {
  const [counselorName, setCounselorName] = useState('Counselor');
  const [specialty, setSpecialty] = useState('General Counseling');
  const [isReminderSent, setIsReminderSent] = useState(false);
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  const [isAccountMenuVisible, setIsAccountMenuVisible] = useState(false);
  const [isLogoutConfirmVisible, setIsLogoutConfirmVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);

  const counselorSessions = useCounselorSessions(counselorName);
  const upcomingSessions = counselorSessions.filter(s => s.status === 'Upcoming');

  const uniquePatientsCount = useMemo(() => {
    const patientIds = counselorSessions.map(s => s.patientId).filter(Boolean);
    return new Set(patientIds).size;
  }, [counselorSessions]);

  const hoursToday = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const todaySessions = counselorSessions.filter(s => s.date === todayStr && s.status === 'Upcoming');
    return (todaySessions.length * 0.75).toFixed(1);
  }, [counselorSessions]);

  useEffect(() => {
    const user = auth?.currentUser;

    if (!user) {
      router.replace('/counselor-login');
      return;
    }

    const loadProfile = async () => {
      const profile = await getCounselorProfile(user.uid);
      if (!profile) {
        router.replace('/(counselor-tabs)/profile');
        return;
      }

      setCounselorName(profile.displayName || profile.fullName || user.displayName || 'Counselor');
      setSpecialty(profile.specialty || 'General Counseling');
    };

    void loadProfile();
  }, []);

  useEffect(() => {
    const user = auth?.currentUser;
    if (!user || !db) return;

    // Listen to notifications
    const qNotif = query(
      collection(db, 'notifications'),
      where('counselorUid', '==', user.uid)
    );
    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      list.sort((a: any, b: any) => b.createdAt - a.createdAt);
      setNotifications(list);
    }, (err) => {
      console.error("Error fetching notifications from Firestore:", err);
    });

    // Listen to pending appointments
    const qAppt = query(
      collection(db, 'appointments'),
      where('counselorUid', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsubAppt = onSnapshot(qAppt, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setPendingAppointments(list);
    }, (err) => {
      console.error("Error fetching pending appointments:", err);
    });

    return () => {
      unsubNotif();
      unsubAppt();
    };
  }, []);

  const handleAcceptRequest = async (id: string, date: string, time: string) => {
    if (!db || !auth?.currentUser) return;
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateDoc(doc(db, 'appointments', id), { status: 'scheduled' });
      Alert.alert('Request Accepted', 'Appointment has been scheduled successfully.');
      
      await addDoc(collection(db, 'notifications'), {
        counselorUid: auth.currentUser.uid,
        counselorName: counselorName,
        type: 'booking',
        title: 'Appointment Confirmed',
        message: `You confirmed the appointment for ${date} at ${time}.`,
        createdAt: Date.now(),
        read: false,
      });
    } catch (err) {
      console.error("Error accepting request:", err);
      Alert.alert('Error', 'Could not accept the request. Please try again.');
    }
  };

  const handleDeclineRequest = async (id: string, date: string, time: string) => {
    if (!db || !auth?.currentUser) return;
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateDoc(doc(db, 'appointments', id), { status: 'declined' });
      Alert.alert('Request Declined', 'Appointment request has been declined.');
    } catch (err) {
      console.error("Error declining request:", err);
      Alert.alert('Error', 'Could not decline the request. Please try again.');
    }
  };

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

  const handleLogout = () => {
    setIsAccountMenuVisible(false);
    setIsLogoutConfirmVisible(true);
  };

  const confirmLogout = async () => {
    try {
      setIsLogoutConfirmVisible(false);

      if (auth) {
        await signOut(auth);
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/role-selection');
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Logout Failed', 'Unable to log out right now. Please try again.');
    }
  };

  const handleOpenSettingsMenu = () => {
    void Haptics.selectionAsync();
    setIsAccountMenuVisible(true);
  };

  const counselorNotifications = notifications;
  const unreadNotificationCount = counselorNotifications.filter((notification) => !notification.read).length;

  const handleOpenNotifications = async () => {
    void Haptics.selectionAsync();
    setIsNotificationsVisible(true);
    if (!db) return;
    
    // Mark notifications as read in Firestore
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      try {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      } catch (err) {
        console.error("Error updating notification status in Firestore:", err);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Counselor Portal</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIcon} activeOpacity={0.85} onPress={handleOpenNotifications}>
              <Feather name="bell" size={22} color="#111B2E" />
              {unreadNotificationCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerIcon} activeOpacity={0.85} onPress={handleOpenSettingsMenu}>
              <Feather name="settings" size={24} color="#111B2E" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerDivider} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="people-outline" size={22} color="#2F88E8" />
              </View>
              <Text style={styles.summaryValue}>{uniquePatientsCount}</Text>
              <Text style={styles.summaryLabel}>Total Patients</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Feather name="clock" size={20} color="#2F88E8" />
              </View>
              <Text style={styles.summaryValue}>{hoursToday}</Text>
              <Text style={styles.summaryLabel}>Hours Today</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PENDING REQUESTS</Text>
            {pendingAppointments.length > 0 ? (
              <Text style={styles.sectionBadge}>{pendingAppointments.length} New</Text>
            ) : null}
          </View>

          {pendingAppointments.length === 0 ? (
            <Text style={styles.noRequestsText}>No pending requests</Text>
          ) : (
            pendingAppointments.map((appt) => (
              <View key={appt.id} style={styles.requestCard}>
                <View style={styles.requestTop}>
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' }}
                    style={styles.requestAvatar}
                  />
                  <View style={styles.requestMeta}>
                    <PatientName uid={appt.patientId || ''} style={styles.requestName} />
                    <Text style={styles.requestTime}>Requested for {appt.date}, {appt.time}</Text>
                  </View>
                </View>

                <View style={styles.noteBox}>
                  <Text style={styles.noteTitle}>Patient Note:</Text>
                  <Text style={styles.noteText}>&quot;{appt.note || 'Seeking support'}&quot;</Text>
                </View>

                <View style={styles.tagsRow}>
                  <Text style={styles.tagPill}>General Counseling</Text>
                  <Text style={styles.timePill}>45 mins</Text>
                </View>

                <View style={styles.requestActions}>
                  <TouchableOpacity 
                    style={styles.acceptButton} 
                    activeOpacity={0.88}
                    onPress={() => void handleAcceptRequest(appt.id, appt.date, appt.time)}
                  >
                    <Feather name="check" size={20} color="#FFFFFF" />
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.declineButton} 
                    activeOpacity={0.88}
                    onPress={() => void handleDeclineRequest(appt.id, appt.date, appt.time)}
                  >
                    <Feather name="x" size={20} color="#F24D4D" />
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>UPCOMING SESSIONS</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.replace({
                  pathname: '/(counselor-tabs)/schedule',
                  params: { name: counselorName, specialty },
                })
              }>
              <Text style={styles.linkText}>View Calendar</Text>
            </TouchableOpacity>
          </View>

          {upcomingSessions.length === 0 ? (
            <Text style={styles.footerText}>No upcoming sessions for today</Text>
          ) : (
            upcomingSessions.map(session => (
              <View key={session.id} style={styles.sessionCard}>
                <Text style={styles.sessionTime}>{session.time}</Text>
                <View style={styles.sessionDivider} />
                <View style={styles.sessionMain}>
                  <PatientName uid={session.patientId || ''} />
                  <Text style={styles.sessionType}>Video call</Text>
                </View>
                <TouchableOpacity
                  style={styles.sessionActionButton}
                  activeOpacity={0.88}
                  onPress={() =>
                    router.push({
                      pathname: '/video-call-room',
                      params: {
                        roomId: session.id,
                        role: 'counselor',
                      },
                    })
                  }>
                  <Text style={styles.sessionActionText}>Join Call</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <Text style={styles.footerText}>All caught up</Text>
          <Text style={styles.profileInfo}>
            Logged in as {counselorName} ({specialty})
          </Text>
        </ScrollView>

        <Modal visible={isNotificationsVisible} transparent animationType="fade" onRequestClose={() => setIsNotificationsVisible(false)}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsNotificationsVisible(false)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetTitle}>Notifications</Text>
                  <Text style={styles.sheetSubtitle}>Booking and reschedule updates</Text>
                </View>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setIsNotificationsVisible(false)}>
                  <Feather name="x" size={20} color="#6D7685" />
                </TouchableOpacity>
              </View>

              {counselorNotifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Feather name="bell" size={20} color="#2F88E8" />
                  </View>
                  <Text style={styles.emptyTitle}>No notifications yet</Text>
                  <Text style={styles.emptyText}>New bookings and reschedules will appear here.</Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.sheetList} showsVerticalScrollIndicator={false}>
                  {counselorNotifications.slice(0, 8).map((notification) => (
                    <View key={notification.id} style={styles.notificationCard}>
                      <View
                        style={[
                          styles.notificationTypeIcon,
                          notification.type === 'booking' ? styles.notificationTypeBooking : styles.notificationTypeReschedule,
                        ]}>
                        <Feather
                          name={notification.type === 'booking' ? 'calendar' : 'refresh-cw'}
                          size={16}
                          color={notification.type === 'booking' ? '#2F88E8' : '#0B7A75'}
                        />
                      </View>
                      <View style={styles.notificationTextWrap}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        <Text style={styles.notificationMessage}>{notification.message}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={isAccountMenuVisible} transparent animationType="fade" onRequestClose={() => setIsAccountMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsAccountMenuVisible(false)} />
            <View style={styles.actionSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Account</Text>
              <Text style={styles.sheetSubtitle}>Manage your counselor profile</Text>

              <TouchableOpacity
                style={styles.actionRow}
                activeOpacity={0.9}
                onPress={() => {
                  setIsAccountMenuVisible(false);
                  router.replace({
                    pathname: '/(counselor-tabs)/profile',
                    params: { name: counselorName },
                  });
                }}>
                <View style={styles.actionIconWrap}>
                  <Feather name="user" size={18} color="#2F88E8" />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>My Profile</Text>
                  <Text style={styles.actionHint}>View and update your counselor details</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#94A0AE" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionRow} activeOpacity={0.9} onPress={handleLogout}>
                <View style={[styles.actionIconWrap, styles.actionIconDanger]}>
                  <Feather name="log-out" size={18} color="#D84C4C" />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitleDanger}>Logout</Text>
                  <Text style={styles.actionHint}>Sign out from this device securely</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#D7A1A1" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={isLogoutConfirmVisible} transparent animationType="fade" onRequestClose={() => setIsLogoutConfirmVisible(false)}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsLogoutConfirmVisible(false)} />
            <View style={styles.confirmSheet}>
              <View style={[styles.confirmIconWrap, styles.actionIconDanger]}>
                <Feather name="log-out" size={22} color="#D84C4C" />
              </View>
              <Text style={styles.confirmTitle}>Logout from account?</Text>
              <Text style={styles.confirmText}>You will need to sign in again to access the counselor portal.</Text>

              <View style={styles.confirmActions}>
                <TouchableOpacity style={styles.confirmSecondaryButton} activeOpacity={0.9} onPress={() => setIsLogoutConfirmVisible(false)}>
                  <Text style={styles.confirmSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmPrimaryButton} activeOpacity={0.9} onPress={() => void confirmLogout()}>
                  <Text style={styles.confirmPrimaryText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F24D4D',
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 11,
    color: '#FFFFFF',
    fontWeight: '800',
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
  noRequestsText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B7484',
    textAlign: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DEE4EC',
    fontWeight: '500',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  modalBackdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: '72%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 14,
  },
  actionSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 14,
  },
  confirmSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 14,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D7DEE8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    lineHeight: 28,
    color: '#142033',
    fontWeight: '800',
  },
  sheetSubtitle: {
    marginTop: 4,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    color: '#728096',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 18,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#EAF3FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 14,
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 22,
    color: '#1A2332',
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 19,
    color: '#738194',
    fontWeight: '500',
  },
  sheetList: {
    gap: 12,
    paddingBottom: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    backgroundColor: '#FAFBFD',
    padding: 14,
  },
  notificationTypeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTypeBooking: {
    backgroundColor: '#EAF3FE',
  },
  notificationTypeReschedule: {
    backgroundColor: '#E7F7F4',
  },
  notificationTextWrap: {
    flex: 1,
  },
  notificationTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 20,
    color: '#172133',
    fontWeight: '800',
  },
  notificationMessage: {
    marginTop: 4,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 19,
    color: '#677689',
    fontWeight: '500',
  },
  actionRow: {
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    backgroundColor: '#FBFCFE',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EAF3FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconDanger: {
    backgroundColor: '#FDEEEE',
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 19,
    color: '#172133',
    fontWeight: '800',
  },
  actionTitleDanger: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 19,
    color: '#D84C4C',
    fontWeight: '800',
  },
  actionHint: {
    marginTop: 3,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 17,
    color: '#7A8799',
    fontWeight: '500',
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmTitle: {
    marginTop: 16,
    fontFamily: 'Inter',
    fontSize: 22,
    lineHeight: 27,
    color: '#172133',
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmText: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#728096',
    fontWeight: '500',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  confirmSecondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7DEE8',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmSecondaryText: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 19,
    color: '#556275',
    fontWeight: '700',
  },
  confirmPrimaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#D84C4C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmPrimaryText: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 19,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
