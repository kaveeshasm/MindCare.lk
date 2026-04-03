import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RescheduleModal, type RescheduleSession } from '@/components/RescheduleModal';
import { removeBookedSession, updateBookedSession, useBookedSessions } from '@/components/session-store';

type ProfileForm = {
  name: string;
  email: string;
  gender: string;
  dob: string;
};

type InfoField = {
  id: keyof ProfileForm;
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  fullWidth?: boolean;
};

type SessionCard = RescheduleSession;

function buildSessionRange(start: string) {
  const [time, meridiem] = start.split(' ');
  const [hourString] = time.split(':');
  const hour = Number(hourString);
  const nextHour = hour === 12 ? 1 : hour + 1;
  const nextMeridiem = hour === 11 ? (meridiem === 'AM' ? 'PM' : 'AM') : meridiem;
  return `${start} - ${nextHour}:00 ${nextMeridiem}`;
}

function formatSessionDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const personalInfo: InfoField[] = [
  {
    id: 'name',
    label: 'Full Name',
    icon: 'user',
    fullWidth: true,
  },
  {
    id: 'email',
    label: 'Email',
    icon: 'mail',
    fullWidth: true,
  },
  {
    id: 'gender',
    label: 'Gender',
  },
  {
    id: 'dob',
    label: 'Date of Birth',
  },
];

const initialProfile: ProfileForm = {
  name: '',
  email: '',
  gender: '',
  dob: '',
};

function InfoFieldCard({
  field,
  isEditing,
  value,
  onChange,
}: {
  field: InfoField;
  isEditing: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={[styles.infoCard, field.fullWidth && styles.infoCardFull]}>
      {field.icon ? (
        <View style={styles.infoIconWrap}>
          <Feather name={field.icon} size={16} color="#7EB5F5" />
        </View>
      ) : null}

      <View style={styles.infoTextBlock}>
        <Text style={styles.infoLabel}>{field.label}</Text>
        {isEditing ? (
          <TextInput
            value={value}
            onChangeText={onChange}
            style={styles.infoInput}
            placeholder={field.label}
            placeholderTextColor="#AAB5C2"
          />
        ) : (
          <Text style={styles.infoValue}>{value}</Text>
        )}
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  trailing,
}: {
  title: string;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {trailing}
    </View>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile);
  const [draftProfile, setDraftProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [rescheduleSession, setRescheduleSession] = useState<SessionCard | null>(null);
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState('2026-03-11');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00 AM');
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [detailsSectionY, setDetailsSectionY] = useState(0);
  const bookedSessions = useBookedSessions();
  const [isInfoFilled, setIsInfoFilled] = useState(false);

  const upcomingCount = bookedSessions.filter((session) => session.status === 'Upcoming').length;

  const params = useLocalSearchParams<{ filledName?: string; filledEmail?: string; filledGender?: string; filledDob?: string }>();

  useEffect(() => {
    if (params.filledName) {
      const filled = {
        name: params.filledName ?? profile.name,
        email: params.filledEmail ?? profile.email,
        gender: params.filledGender ?? profile.gender,
        dob: params.filledDob ?? profile.dob,
      };
      setProfile(filled);
      setDraftProfile(filled);
      setIsInfoFilled(true);
    }
  }, [params.filledName]);

  const handleEditPress = () => {
    if (isEditing) {
      setProfile(draftProfile);
      setIsEditing(false);
      return;
    }

    setDraftProfile(profile);
    setIsEditing(true);
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(detailsSectionY - 18, 0),
        animated: true,
      });
    });
  };

  const handleCancel = () => {
    setDraftProfile(profile);
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Do you want to log out from your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => router.replace('/(tabs)'),
      },
    ]);
  };

  const handleOpenReschedule = (session: SessionCard) => {
    setRescheduleSession(session);
    setSelectedRescheduleDate('2026-03-11');
    setSelectedTimeSlot('10:00 AM');
  };

  const handleCloseReschedule = () => {
    setRescheduleSession(null);
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleSession) {
      return;
    }

    updateBookedSession(rescheduleSession.id, {
      date: formatSessionDate(selectedRescheduleDate),
      time: buildSessionRange(selectedTimeSlot),
      status: 'Upcoming',
      actions: true,
    });
    setRescheduleSession(null);
  };

  const handleCancelSession = () => {
    if (!rescheduleSession) {
      return;
    }

    removeBookedSession(rescheduleSession.id);
    setRescheduleSession(null);
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          stickyHeaderIndices={[2]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.heroTitleNoBack}>My Profile</Text>
            <Text style={styles.heroSubtitle}>View and manage your personal information and appointments</Text>
          </View>

          <View style={styles.sheetTop}>
            <View style={styles.avatarCard}>
              <Ionicons name="person-outline" size={28} color="#FFFFFF" />
            </View>

            <View style={styles.profileSummaryCard}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
              <View style={styles.profileBadgeRow}>
                <View style={styles.profileBadge}>
                  <Feather name="shield" size={12} color="#2F88E8" />
                  <Text style={styles.profileBadgeText}>Secure Account</Text>
                </View>
                <View style={styles.profileBadgeMuted}>
                  <Text style={styles.profileBadgeMutedText}>Member</Text>
                </View>
              </View>
            </View>

            <View onLayout={(event) => setDetailsSectionY(event.nativeEvent.layout.y)}>
              <SectionHeader title="Personal Information" />
            </View>

            <View style={styles.infoGrid}>
              {personalInfo.map((field) => (
                <InfoFieldCard
                  key={field.id}
                  field={field}
                  isEditing={isEditing}
                  value={isEditing ? draftProfile[field.id] : profile[field.id]}
                  onChange={(value) => setDraftProfile((current) => ({ ...current, [field.id]: value }))}
                />
              ))}
            </View>
          </View>
          <View style={styles.editProfile}>
  {!isInfoFilled ? (
    <TouchableOpacity
      style={styles.fillInfoAction}
      activeOpacity={0.9}
      onPress={() => router.push('/member-information-form')}
    >
      <Feather name="user-plus" size={16} color="#FFFFFF" />
      <Text style={styles.primaryActionText}>Fill Personal Information</Text>
    </TouchableOpacity>
  ) : isEditing ? (
    <View style={styles.editActions}>
      <TouchableOpacity style={styles.outlinedAction} activeOpacity={0.9} onPress={handleCancel}>
        <Text style={styles.outlinedActionText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.primaryActionCompact} activeOpacity={0.9} onPress={handleEditPress}>
        <Text style={styles.primaryActionText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <TouchableOpacity style={styles.primaryAction} activeOpacity={0.9} onPress={handleEditPress}>
      <Feather name="edit-3" size={16} color="#FFFFFF" />
      <Text style={styles.primaryActionText}>Edit Profile</Text>
    </TouchableOpacity>
  )}
</View>

          <View style={styles.stickySessionsHeader}>
            <SectionHeader
              title="Booked Sessions"
              trailing={
                <View style={styles.upcomingCountPill}>
                  <Text style={styles.upcomingCountText}>{upcomingCount} Upcoming</Text>
                </View>
              }
            />
          </View>

          <View style={styles.sheetBottom}>
            <View style={styles.sessionList}>
              {bookedSessions.map((session) => (
                <View key={session.id}>
                  <View style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionHeading}>
                        <Text style={styles.sessionDoctor}>{session.doctor}</Text>
                        <Text style={styles.sessionSpecialty}>{session.specialty}</Text>
                      </View>

                      <View
                        style={[
                          styles.statusPill,
                          session.status === 'Upcoming' ? styles.statusPillUpcoming : styles.statusPillCompleted,
                        ]}>
                        <Text
                          style={[
                            styles.statusText,
                            session.status === 'Upcoming' ? styles.statusTextUpcoming : styles.statusTextCompleted,
                          ]}>
                          {session.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sessionMetaRow}>
                      <View style={styles.sessionMetaItem}>
                        <Feather name="calendar" size={12} color="#7E8A98" />
                        <Text style={styles.sessionMetaText}>{session.date}</Text>
                      </View>
                      <View style={styles.sessionMetaItem}>
                        <Feather name="clock" size={12} color="#7E8A98" />
                        <Text style={styles.sessionMetaText}>{session.time}</Text>
                      </View>
                    </View>

                    {session.actions ? (
                      <View style={styles.sessionActions}>
                        <TouchableOpacity style={styles.joinButton} activeOpacity={0.9}>
                          <Text style={styles.joinButtonText}>Join Session</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rescheduleButton}
                          activeOpacity={0.9}
                          onPress={() => handleOpenReschedule(session)}>
                          <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.actionPanel}>
              <SectionHeader title="Account Actions" />          

              <TouchableOpacity style={styles.logoutButton} activeOpacity={0.9} onPress={handleLogout}>
                <View style={styles.logoutIconWrap}>
                  <Feather name="log-out" size={16} color="#C64545" />
                </View>
                <View style={styles.logoutTextWrap}>
                  <Text style={styles.logoutText}>Logout</Text>
                  <Text style={styles.logoutHint}>Sign out from this device securely</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#D98686" />
              </TouchableOpacity>
            </View>

            <Text style={styles.privacyText}>
              Your personal information is kept private and encrypted.{'\n'}
              We never share your data without consent.
            </Text>
          </View>
        </ScrollView>

        <RescheduleModal
          visible={Boolean(rescheduleSession)}
          session={rescheduleSession}
          selectedDate={selectedRescheduleDate}
          selectedTimeSlot={selectedTimeSlot}
          onSelectDate={setSelectedRescheduleDate}
          onSelectTimeSlot={setSelectedTimeSlot}
          onClose={handleCloseReschedule}
          onConfirm={handleConfirmReschedule}
          onCancelSession={handleCancelSession}
        />
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
  content: {
    paddingBottom: 44,
  },
  hero: {
    backgroundColor: '#2F88E8',
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 30,
    alignItems: 'center',
  },
  heroTitle: {
    marginTop: 26,
    fontFamily: 'Inter',
    fontSize: 20,
    lineHeight: 26,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  heroTitleNoBack: {
    fontFamily: 'Inter',
    fontSize: 20,
    lineHeight: 26,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 8,
    maxWidth: 290,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 16,
    color: '#D9EBFF',
    fontWeight: '400',
    textAlign: 'center',
  },
  sheetTop: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 26,
    paddingTop: 36,
    paddingBottom: 20,
  },
  stickySessionsHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 26,
    paddingTop: 8,
    paddingBottom: 10,
    zIndex: 2,
  },
  sheetBottom: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 26,
    paddingBottom: 32,
  },
  profileSummaryCard: {
    marginTop: -4,
    marginBottom: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9EEF4',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  profileName: {
    fontFamily: 'Inter',
    fontSize: 17,
    lineHeight: 22,
    color: '#151A21',
    fontWeight: '800',
  },
  profileEmail: {
    marginTop: 3,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#7F8A98',
    fontWeight: '500',
  },
  profileBadgeRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#EAF3FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  profileBadgeText: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 13,
    color: '#2F88E8',
    fontWeight: '700',
  },
  profileBadgeMuted: {
    borderRadius: 999,
    backgroundColor: '#F0F3F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  profileBadgeMutedText: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 13,
    color: '#697586',
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 2,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 4,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#2F88E8',
  },
  avatarCard: {
    alignSelf: 'center',
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -70,
    marginBottom: 26,
    shadowColor: '#2F88E8',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 19,
    color: '#151A21',
    fontWeight: '800',
  },
  infoGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  infoCard: {
    width: '47.5%',
    minHeight: 74,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  infoCardFull: {
    width: '100%',
  },
  infoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EDF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBlock: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 12,
    color: '#96A0AD',
    fontWeight: '500',
  },
  infoValue: {
    marginTop: 4,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#151A21',
    fontWeight: '700',
  },
  infoInput: {
    marginTop: 4,
    paddingVertical: 0,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#151A21',
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: '#D5E0ED',
  },
  editProfile: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal:20,
    paddingBottom: 16,
  },
  fillInfoAction: {
  marginTop: 4,
  height: 46,
  borderRadius: 12,
  backgroundColor: '#1B9C4B',  // green to distinguish from Edit
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: 8,
  shadowColor: '#1B9C4B',
  shadowOpacity: 0.18,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
},
  upcomingCountPill: {
    borderRadius: 999,
    backgroundColor: '#2F88E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  upcomingCountText: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sessionList: {
    marginTop: 6,
    gap: 12,
  },
  sessionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7ECF2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  sessionHeading: {
    flex: 1,
  },
  sessionDoctor: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 18,
    color: '#11161D',
    fontWeight: '800',
  },
  sessionSpecialty: {
    marginTop: 2,
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 14,
    color: '#8A95A3',
    fontWeight: '500',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillUpcoming: {
    backgroundColor: '#E5FAEB',
  },
  statusPillCompleted: {
    backgroundColor: '#EFF2F5',
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
  },
  statusTextUpcoming: {
    color: '#1B9C4B',
  },
  statusTextCompleted: {
    color: '#768395',
  },
  sessionMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sessionMetaText: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 13,
    color: '#7E8A98',
    fontWeight: '500',
  },
  sessionActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  joinButton: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#2F88E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rescheduleButton: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D7DEE7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescheduleButtonText: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#546273',
    fontWeight: '600',
  },
  primaryAction: {
    marginTop: 4,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2F88E8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#2F88E8',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  editActions: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 10,
  },
  outlinedAction: {
    width: 110,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E0E8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlinedActionText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#556374',
    fontWeight: '600',
  },
  primaryActionCompact: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2F88E8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2F88E8',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryActionText: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionPanel: {
    marginTop: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EDF3',
    backgroundColor: '#FCFDFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  logoutButton: {
    marginTop: 12,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0D2D2',
    backgroundColor: '#FFF7F7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  logoutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTextWrap: {
    flex: 1,
  },
  logoutText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#C64545',
    fontWeight: '700',
  },
  logoutHint: {
    marginTop: 2,
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 13,
    color: '#C48787',
    fontWeight: '500',
  },
  privacyText: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 15,
    color: '#A1A9B3',
    fontWeight: '400',
  },
});
