import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StatusBar, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '@/components/AuthContext';
import { addCounselorNotification } from '@/components/notification-store';
import { RescheduleModal, type RescheduleSession } from '@/components/RescheduleModal';
import { CancelSessionModal } from '@/components/CancelSessionModal';
import { isSessionNear, removeBookedSession, updateBookedSession, useBookedSessions } from '@/components/session-store';
import { getMemberProfile, upsertMemberProfile } from '@/lib/members';
import DateTimePicker from '@react-native-community/datetimepicker';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

function deriveNameFromEmail(email: string) {
  return (email.split('@')[0] ?? '')
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

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
    icon: 'users',
    fullWidth: true,
  },
  {
    id: 'dob',
    label: 'Date of Birth',
    icon: 'calendar',
    fullWidth: true,
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
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handlePress = () => {
    if (!isEditing) return;

    if (field.id === 'gender') {
      Alert.alert(
        'Select Gender',
        'Choose your gender:',
        [
          { text: 'Male', onPress: () => onChange('Male') },
          { text: 'Female', onPress: () => onChange('Female') },
          { text: 'Prefer not to say', onPress: () => onChange('Prefer not to say') },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    } else if (field.id === 'dob') {
      setShowDatePicker(true);
    }
  };

  const parseDobString = (dobStr: string): Date => {
    if (!dobStr || dobStr.startsWith('Add') || dobStr.startsWith('Select')) return new Date(2000, 0, 1);
    const parsed = new Date(dobStr);
    if (!isNaN(parsed.getTime())) return parsed;

    // Fallback manual parser for Hermes engine (e.g. "June 26, 2026" or "26 June 2026")
    try {
      const cleaned = dobStr.replace(/,/g, '').trim();
      const parts = cleaned.split(/\s+/);
      if (parts.length === 3) {
        const monthNames = [
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december'
        ];
        let monthStr = parts[0].toLowerCase();
        let month = monthNames.indexOf(monthStr);
        let day = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        if (month === -1) {
          monthStr = parts[1].toLowerCase();
          month = monthNames.indexOf(monthStr);
          day = parseInt(parts[0], 10);
        }
        if (month !== -1 && !isNaN(day) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    } catch (e) {
      // Ignored, fallback to default below
    }
    return new Date(2000, 0, 1);
  };

  const formatDob = (date: Date): string => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const isSelectableField = field.id === 'gender' || field.id === 'dob';

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
          isSelectableField ? (
            <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.selectableContainer}>
              <Text style={[styles.infoValue, { color: value.startsWith('Add') || value.startsWith('Select') ? '#AAB5C2' : '#151A21' }]}>
                {value}
              </Text>
              <Feather 
                name={field.id === 'dob' ? 'calendar' : 'chevron-down'} 
                size={14} 
                color="#7EB5F5" 
                style={{ marginLeft: 4 }} 
              />
            </TouchableOpacity>
          ) : (
            <TextInput
              value={value}
              onChangeText={onChange}
              style={styles.infoInput}
              placeholder={field.label}
              placeholderTextColor="#AAB5C2"
            />
          )
        ) : (
          <Text style={styles.infoValue}>{value}</Text>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={parseDobString(value)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onValueChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
            if (selectedDate) {
              onChange(formatDob(selectedDate));
            }
          }}
          onDismiss={() => {
            setShowDatePicker(false);
          }}
        />
      )}
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
  const { currentUser, memberProfile, setMemberProfile } = useAuthContext();
  const [profile, setProfile] = useState(memberProfile);
  const [draftProfile, setDraftProfile] = useState(memberProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [rescheduleSession, setRescheduleSession] = useState<SessionCard | null>(null);
  const [sessionToCancel, setSessionToCancel] = useState<SessionCard | null>(null);
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState('2026-03-11');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00 AM');
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [detailsSectionY, setDetailsSectionY] = useState(0);
  const bookedSessions = useBookedSessions();
  const [isInfoFilled, setIsInfoFilled] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isCounselorUser, setIsCounselorUser] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const upcomingCount = bookedSessions.filter((session) => session.status === 'Upcoming').length;

  const params = useLocalSearchParams<{ filledName?: string; filledEmail?: string; filledGender?: string; filledDob?: string }>();

  useEffect(() => {
    if (params.filledName || params.filledEmail || params.filledGender || params.filledDob) {
      const name = params.filledName ?? memberProfile.name;
      const email = params.filledEmail ?? memberProfile.email;
      const gender = params.filledGender ?? memberProfile.gender;
      const dob = params.filledDob ?? memberProfile.dob;

      if (
        name !== memberProfile.name ||
        email !== memberProfile.email ||
        gender !== memberProfile.gender ||
        dob !== memberProfile.dob
      ) {
        setMemberProfile({ name, email, gender, dob });
      }
    }
  }, [
    params.filledDob,
    params.filledEmail,
    params.filledGender,
    params.filledName,
    memberProfile.name,
    memberProfile.email,
    memberProfile.gender,
    memberProfile.dob,
    setMemberProfile,
  ]);

  useEffect(() => {
    if (!currentUser) {
      setProfile(memberProfile);
      setDraftProfile(memberProfile);
      setIsInfoFilled(Boolean(memberProfile.name || memberProfile.email || memberProfile.gender || memberProfile.dob));
      setIsLoadingProfile(false);
      setIsCounselorUser(false);
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        if (db) {
          const docRef = doc(db, 'counselors', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && isMounted) {
            setIsCounselorUser(true);
            setIsLoadingProfile(false);
            return;
          }
        }
        
        if (isMounted) {
          setIsCounselorUser(false);
        }

        const savedProfile = await getMemberProfile(currentUser.uid);
        const nextProfile = savedProfile
          ? {
              name: savedProfile.name,
              email: savedProfile.email,
              gender: savedProfile.gender,
              dob: savedProfile.dob,
            }
          : {
              name: currentUser.displayName || deriveNameFromEmail(currentUser.email ?? ''),
              email: currentUser.email || '',
              gender: '',
              dob: '',
            };

        if (!isMounted) {
          return;
        }

        setMemberProfile(nextProfile);
        setProfile(nextProfile);
        setDraftProfile(nextProfile);
        setIsInfoFilled(Boolean(nextProfile.name || nextProfile.email || nextProfile.gender || nextProfile.dob));
      } catch {
        if (!isMounted) {
          return;
        }

        const fallbackProfile = {
          name: currentUser.displayName || deriveNameFromEmail(currentUser.email ?? ''),
          email: currentUser.email || '',
          gender: '',
          dob: '',
        };

        setProfile(fallbackProfile);
        setDraftProfile(fallbackProfile);
        setIsInfoFilled(Boolean(fallbackProfile.name || fallbackProfile.email));
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid, setMemberProfile]);

  const handleEditPress = () => {
    if (isEditing) {
      if (!currentUser) {
        Alert.alert('Sign In Required', 'Please sign in to update your profile.');
        return;
      }
      void (async () => {
        try {
          await upsertMemberProfile(currentUser.uid, draftProfile.email, {
            name: draftProfile.name,
            gender: draftProfile.gender,
            dob: draftProfile.dob,
          });
          setProfile(draftProfile);
          setMemberProfile(draftProfile);
          setIsEditing(false);
        } catch (error) {
          Alert.alert('Save Failed', 'Unable to save your profile details. Please try again.');
        }
      })();
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
        onPress: async () => {
          try {
            if (auth) {
              await signOut(auth);
            }
          } catch (e) {
            // silent
          }
          router.replace('/(tabs)/role-selection');
        },
      },
    ]);
  };

  const handleOpenReschedule = (session: SessionCard) => {
    setRescheduleSession(session);
    
    // Format today as YYYY-MM-DD
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    setSelectedRescheduleDate(todayStr);
    setSelectedTimeSlot('10:00 AM');
  };

  const handleCloseReschedule = () => {
    setRescheduleSession(null);
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleSession) {
      return;
    }

    const sessionDateTime = (() => {
      const [year, month, day] = selectedRescheduleDate.split('-').map(Number);
      const result = new Date(year, month - 1, day);
      
      const match = selectedTimeSlot.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (!match) return result;

      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();

      if (ampm === 'PM' && hours < 12) {
        hours += 12;
      } else if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }

      result.setHours(hours, minutes, 0, 0);
      return result;
    })();

    const now = new Date();
    if (sessionDateTime < now) {
      Alert.alert(
        'Invalid Date/Time',
        'Rescheduling cannot be made for previous dates and times. Please select a future date and time.'
      );
      return;
    }

    const updatedDate = formatSessionDate(selectedRescheduleDate);
    const updatedTime = buildSessionRange(selectedTimeSlot);

    updateBookedSession(rescheduleSession.id, {
      date: updatedDate,
      time: updatedTime,
      status: 'Upcoming',
      actions: true,
    });

    addCounselorNotification({
      counselorName: rescheduleSession.doctor,
      type: 'reschedule',
      title: 'Session rescheduled',
      message: `A patient moved their session to ${updatedDate} at ${updatedTime}.`,
    });

    setRescheduleSession(null);
  };

  const handleCancelSession = () => {
    if (!rescheduleSession) {
      return;
    }

    setSessionToCancel(rescheduleSession);
    setRescheduleSession(null);
  };

  const handleConfirmCancelSession = () => {
    if (!sessionToCancel) {
      return;
    }

    removeBookedSession(sessionToCancel.id);
    setSessionToCancel(null);
  };


  if (isLoadingProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#2F88E8" translucent={false} />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser || isCounselorUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#2F88E8" translucent={false} />
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={[styles.content, { flexGrow: 1 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <Text style={styles.heroTitleNoBack}>My Profile</Text>
              <Text style={styles.heroSubtitle}>View and manage your personal information and appointments</Text>
            </View>

            <View style={[styles.sheetTop, { flex: 1, minHeight: 520, paddingBottom: 40 }]}>
              {/* Lock Icon Circle */}
              <View style={styles.authIconCircle}>
                <Feather name="lock" size={32} color="#2F88E8" />
              </View>

              <Text style={styles.authTitle}>Access Required</Text>
              <Text style={styles.authDesc}>
                Please log in or create a new account to view and manage your profile details.
              </Text>

              <TouchableOpacity
                style={styles.authLoginBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/member-login')}
              >
                <Text style={styles.authLoginBtnText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.authRegisterBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/member-register')}
              >
                <Text style={styles.authRegisterBtnText}>Create Free Account</Text>
              </TouchableOpacity>

              <View style={{ marginTop: 36 }}>
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
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2F88E8" translucent={false} />
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
              <Text style={styles.profileName}>
                {isLoadingProfile ? 'Loading profile...' : profile.name || 'Your name will appear here'}
              </Text>
              <Text style={styles.profileEmail}>{profile.email || 'Email not added yet'}</Text>
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
                  value={isEditing ? draftProfile[field.id] : profile[field.id] || `Add ${field.label.toLowerCase()}`}
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
      <Text style={styles.primaryActionText}>Add Personal Information</Text>
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
                          session.status === 'Upcoming'
                            ? styles.statusPillUpcoming
                            : session.status === 'Pending'
                            ? styles.statusPillPending
                            : styles.statusPillCompleted,
                        ]}>
                        <Text
                          style={[
                            styles.statusText,
                            session.status === 'Upcoming'
                              ? styles.statusTextUpcoming
                              : session.status === 'Pending'
                              ? styles.statusTextPending
                              : styles.statusTextCompleted,
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
                        {isSessionNear(session.date, session.time) ? (
                          <TouchableOpacity 
                            style={styles.joinButton} 
                            activeOpacity={0.9}
                            onPress={() => router.push({
                              pathname: '/video-call-room',
                              params: { roomId: session.id, role: 'patient' }
                            })}
                          >
                            <Text style={styles.joinButtonText}>Join Call</Text>
                          </TouchableOpacity>
                        ) : null}
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

        <CancelSessionModal
          visible={Boolean(sessionToCancel)}
          session={sessionToCancel}
          onClose={() => setSessionToCancel(null)}
          onConfirm={handleConfirmCancelSession}
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
  statusPillPending: {
    backgroundColor: '#FFEAD4',
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
  statusTextPending: {
    color: '#FF8800',
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
  authIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(47, 136, 232, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(47, 136, 232, 0.15)',
    alignSelf: 'center',
    marginTop: 12,
  },
  authTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '800',
    color: '#0C1016',
    marginBottom: 10,
    textAlign: 'center',
  },
  authDesc: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 22,
    color: '#546273',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  authLoginBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#2F88E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#2F88E8',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  authLoginBtnText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authRegisterBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2F88E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authRegisterBtnText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#2F88E8',
  },
  selectableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingVertical: 2,
  },
});
