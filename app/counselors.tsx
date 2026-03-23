import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

type Counselor = {
  id: string;
  name: string;
  title: string;
  tags: string[];
  years: string;
  rating: string;
  avatar: string;
  online?: boolean;
};

const counselors: Counselor[] = [
  {
    id: '1',
    name: 'Mrs. Dinithi jayawardane',
    title: 'CLINICAL PSYCHOLOGIST',
    tags: ['Anxiety', 'CBT', 'Depression'],
    years: '12 years',
    rating: '4.9',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80',
    online: true,
  },
  {
    id: '2',
    name: 'Mr. Anula Nikapitiya',
    title: 'MARRIAGE & FAMILY THERAPIST',
    tags: ['Relationships', 'Family', 'Stress'],
    years: '8 years',
    rating: '4.8',
    avatar: 'https://images.unsplash.com/photo-1614436163996-25cee5f54290?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '3',
    name: 'Ms. jayani Mendis',
    title: 'PSYCHIATRIST',
    tags: ['Medication', 'Bipolar', 'PTSD'],
    years: '15 years',
    rating: '5',
    avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '4',
    name: 'Mr. Nalaka Mendis',
    title: 'HOLISTIC COUNSELOR',
    tags: ['Mindfulness', 'Meditation', 'Grief'],
    years: '6 years',
    rating: '4.7',
    avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=300&q=80',
  },
];

export default function CounselorsPage() {
  return (
    <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.metaLeft}>4 COUNSELORS AVAILABLE</Text>
            <TouchableOpacity activeOpacity={0.85}>
              <Text style={styles.metaRight}>Clear Filters</Text>
            </TouchableOpacity>
          </View>

          {counselors.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarWrap}>
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  {item.online && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.cardMain}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.ratingTag}>
                      <Feather name="star" size={9} color="#E8A133" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.title}>{item.title}</Text>
                  <View style={styles.tagsRow}>
                    {item.tags.map((tag) => (
                      <Text key={tag} style={styles.tagText}>
                        {tag}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoPill}>
                  <Feather name="briefcase" size={10} color="#8A94A2" />
                  <Text style={styles.infoText}>{item.years}</Text>
                </View>
                <View style={styles.infoPill}>
                  <Feather name="clock" size={10} color="#8A94A2" />
                </View>
              </View>

              <TouchableOpacity
                style={styles.bookButton}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({
                    pathname: '/schedule-session',
                    params: {
                      name: item.name,
                      title: item.title
                        .toLowerCase()
                        .split(' ')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' '),
                      years: item.years,
                      avatar: item.avatar,
                      tags: item.tags.slice(0, 2).join(','),
                    },
                  })
                }>
                <Text style={styles.bookText}>Book Session</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.verifiedCard}>
            <View style={styles.verifiedIcon}>
              <Feather name="check-circle" size={14} color="#6EA8E8" />
            </View>
            <Text style={styles.verifiedTitle}>Verified Professionals</Text>
            <Text style={styles.verifiedText}>
              All MindEase counselors are licensed practitioners with vetted credentials and background checks.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/home')}>
            <Feather name="home" size={16} color="#99A2AD" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/ai-chat')}>
            <MaterialCommunityIcons name="robot-outline" size={16} color="#99A2AD" />
            <Text style={styles.navText}>AI Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85}>
            <Feather name="users" size={16} color="#2F88E8" />
            <Text style={styles.navActive}>Counselors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85}>
            <Feather name="user" size={16} color="#99A2AD" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingTop: 8,
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
    fontSize: 12,
    lineHeight: 15,
    color: '#343D4A',
    fontWeight: '800',
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
    padding: 10,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  avatarWrap: {
    width: 44,
    height: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
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
    lineHeight: 12,
    color: '#8A94A2',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  tagsRow: {
    marginTop: 2,
    flexDirection: 'row',
    gap: 12,
  },
  tagText: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 12,
    color: '#687384',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  },
  bookText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  verifiedCard: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E7EE',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  verifiedIcon: {
    width: 23,
    height: 23,
    borderRadius: 11.5,
    backgroundColor: '#EAF3FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 16,
    color: '#4A5563',
    fontWeight: '700',
  },
  verifiedText: {
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 13,
    color: '#8C96A3',
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 62,
    borderTopWidth: 1,
    borderTopColor: '#D8DFE7',
    backgroundColor: '#F4F7FB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  navItem: {
    alignItems: 'center',
    gap: 2,
  },
  navActive: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 12,
    color: '#2F88E8',
    fontWeight: '700',
  },
  navText: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 12,
    color: '#97A0AB',
    fontWeight: '600',
  },
});
