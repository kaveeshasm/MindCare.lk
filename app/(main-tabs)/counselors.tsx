import { Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'react-native';

import { CounselorProfile, listCounselors } from '@/lib/counselors';
import { useAuthContext } from '@/components/AuthContext';
import AuthRequiredModal from '@/components/AuthRequiredModal';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const DEFAULT_AVATAR = '';

export default function CounselorsPage() {
  const { userRole } = useAuthContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [counselors, setCounselors] = useState<CounselorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    const q = query(
      collection(db, 'counselors'),
      where('role', '==', 'counselor'),
      where('profileCompleted', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map((docSnap) => docSnap.data() as CounselorProfile)
        .filter((item) => item.fullName?.trim() && item.specialty?.trim());
      setCounselors(list);
      setIsLoading(false);
    }, (err) => {
      console.error("Error listening to counselors list:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F1F4F7" translucent={false} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>FIND A COUNSELOR</Text>
            <TouchableOpacity style={styles.headerFilter} activeOpacity={0.85}>
              <Feather name="filter" size={14} color="#626D7A" />
            </TouchableOpacity>
          </View>

          <Text style={styles.pageTitle}>Expert Care</Text>
          <Text style={styles.pageSubtitle}>Professional support for your mental wellness journey.</Text>

          <View style={styles.searchWrap}>
            <Feather name="search" size={14} color="#A1A9B5" />
            <Text style={styles.searchPlaceholder}>Search by name, specialty, or focus</Text>
            <MaterialCommunityIcons name="tune-variant" size={14} color="#A1A9B5" />
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLeft}>{isLoading ? 'LOADING COUNSELORS' : `${counselors.length} COUNSELORS AVAILABLE`}</Text>
            <TouchableOpacity activeOpacity={0.85}>
              <Text style={styles.metaRight}>Clear Filters</Text>
            </TouchableOpacity>
          </View>

          {!isLoading && counselors.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No counselors available yet</Text>
              <Text style={styles.emptyText}>Completed counselor profiles saved in Firebase will appear here.</Text>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2F88E8" />
              <Text style={styles.loadingText}>Fetching counselors...</Text>
            </View>
          ) : (
            counselors.map((item) => (
            <View key={item.uid} style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  router.push({
                    pathname: '/doctor_profile',
                    params: {
                      uid: item.uid,
                      name: item.displayName || item.fullName,
                      title: item.specialty,
                      years: `${Math.max(item.qualifications.length, 1)} credentials`,
                      avatar: item.avatarUrl || '',
                      tags: (item.qualifications.length ? item.qualifications : [item.specialty]).slice(0, 2).join(','),
                    },
                  });
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatarWrap}>
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <FontAwesome5 name="user-md" size={24} color="#2F88E8" />
                      </View>
                    )}
                    <View style={styles.onlineDot} />
                  </View>
                  <View style={styles.cardMain}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{item.displayName || item.fullName}</Text>
                    </View>
                    <Text style={styles.title}>{item.specialty.toUpperCase()}</Text>
                    <View style={styles.tagsRow}>
                      {(item.qualifications.length ? item.qualifications : ['Verified', 'Available']).slice(0, 2).map((tag) => (
                        <Text key={tag} style={styles.tagText}>
                          {tag}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
                <View style={{ borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 10, marginLeft: 60, }} />

                <View style={styles.infoRow}>
                  <View style={styles.infoPill}>
                    <MaterialCommunityIcons name="license" size={15} color="#6B7280" />
                    <Text style={styles.infoText}>{item.qualifications.length || 1} credentials</Text>
                  </View>
                  <View style={styles.infoPill}>
                    <Feather name="clock" size={15} color="#6B7280" />
                    <Text style={styles.infoText}>{item.bio ? 'Bio added' : 'Profile ready'}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bookButton}
                activeOpacity={0.88}
                onPress={() => {
                  if (userRole !== 'member') {
                    setShowAuthModal(true);
                    return;
                  }
                  router.push({
                    pathname: '/schedule-session',
                    params: {
                      uid: item.uid,
                      name: item.displayName || item.fullName,
                      title: item.specialty,
                      years: `${Math.max(item.qualifications.length, 1)} credentials`,
                      avatar: item.avatarUrl || '',
                      tags: (item.qualifications.length ? item.qualifications : [item.specialty]).slice(0, 2).join(','),
                    },
                  });
                }}>
                <Text style={styles.bookText}>Book Session</Text>
              </TouchableOpacity>
            </View>
          )))}

          <View style={styles.verifiedCard}>
            <View style={styles.verifiedIcon}>
              <FontAwesome5 name="check-circle" size={24} color="#0098FF" />
            </View>
            <Text style={styles.verifiedTitle}>Verified Professionals</Text>
            <Text style={styles.verifiedText}>
              All Mindcare counselors are licensed practitioners with vetted credentials and background checks.
            </Text>
          </View>
        </ScrollView>

      </View>

      <AuthRequiredModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={() => {
          setShowAuthModal(false);
          router.push('/member-login');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F4F7',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 86,
    gap: 10,
  },
  headerRow: {
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 18,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 15,
    color: '#343D4A',
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  headerFilter: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    marginTop: 4,
    fontFamily: 'Inter',
    fontSize: 26,
    lineHeight: 30,
    color: '#202A36',
    fontWeight: '800',
  },
  pageSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#7D8795',
    fontWeight: '500',
  },
  searchWrap: {
    marginTop: 4,
    height: 35,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DEE4EC',
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#95A0AD',
  },
  metaRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLeft: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 12,
    color: '#7E8896',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaRight: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 12,
    color: '#2F88E8',
    fontWeight: '700',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE4EC',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  avatarWrap: {
    width: 56,
    height: 56,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DEE4EC',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2DCB69',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cardMain: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
  },
  name: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 19,
    color: '#2A3340',
    fontWeight: '700',
  },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    backgroundColor: '#EFF4FA',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 11,
    color: '#7A8796',
    fontWeight: '700',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 10,
    marginLeft: 10,
    lineHeight: 12,
    color: '#8A94A2',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  tagsRow: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 12,
    marginLeft: 10, 
  },
  tagText: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 12,
    color: '#000000',
    fontWeight: '600',
    backgroundColor: '#D9D9D9',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 60,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 70,
  },
  infoText: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 12,
    color: '#7A8494',
    fontWeight: '600',
  },
  bookButton: {
    height: 32,
    borderRadius: 9,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  bookText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  verifiedCard: {
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E7EE',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 25,
    gap: 6,
  },
  verifiedIcon: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: '#0099ff3c',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  verifiedTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 16,
    color: '#4A5563',
    fontWeight: '700',
    marginBottom: 4,
  },
  verifiedText: {
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 13,
    color: '#000000',
    fontWeight: '500',
    marginBottom: 5,
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE4EC',
    backgroundColor: '#FFFFFF',
    padding: 18,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 20,
    color: '#2A3340',
    fontWeight: '700',
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    color: '#7A8494',
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#7A8494',
    fontWeight: '500',
  },
});
