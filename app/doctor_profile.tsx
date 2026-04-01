import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DoctorProfilePage() {
  const params = useLocalSearchParams<{
    name?: string;
    title?: string;
    years?: string;
    avatar?: string;
  }>();

  // Fallback values if params are not passed
  const name = params.name ?? 'Mrs. Dinithi Jayawardena';
  const title = params.title ?? 'Clinical Psychologist';
  const years = params.years ?? '12 years';
  const avatar = params.avatar ?? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={20} color="#222B38" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>DOCTOR PROFILE</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Blue Hero Profile Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <Image source={{ uri: avatar }} style={styles.heroAvatar} />
              <View style={styles.heroInfo}>
                <Text style={styles.heroName}>{name}</Text>
                <Text style={styles.heroSubtitle}>{title}</Text>
                <View style={styles.experienceRow}>
                  <Feather name="briefcase" size={12} color="#FFFFFF" />
                  <Text style={styles.experienceText}>{years} experience</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.ratingRow}>
              <View>
                <View style={styles.starsContainer}>
                  <Text style={styles.ratingScore}>4.8</Text>
                  {[1, 2, 3, 4].map((s) => (
                    <FontAwesome key={s} name="star" size={14} color="#FFD700" style={styles.star} />
                  ))}
                  <FontAwesome name="star-half-full" size={14} color="#FFD700" style={styles.star} />
                </View>
                <Text style={styles.basedOn}>Based on 127 reviews</Text>
              </View>
              <View style={styles.topRatedBadge}>
                <Text style={styles.topRatedText}>Top Rated</Text>
              </View>
            </View>
          </View>

          {/* Professional Bio */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>PROFESSIONAL BIO</Text>
            </View>
            <Text style={styles.bioText}>
              Dr. Sarah Jenkins is a licensed clinical psychologist with over 12 years of experience specializing in cognitive behavioral therapy (CBT). She has helped hundreds of patients overcome anxiety, depression, and trauma.
            </Text>
          </View>

          {/* Specializations */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>SPECIALIZATIONS</Text>
            </View>
            <View style={styles.tagGrid}>
              {['Cognitive Behavioral Therapy (CBT)', 'Anxiety Disorders', 'Depression Treatment', 'Stress Management', 'Trauma Recovery'].map((tag, i) => (
                <View key={i} style={styles.specTag}>
                  <Text style={styles.specTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Qualifications */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>QUALIFICATIONS</Text>
            </View>
            <QualificationItem title="Ph.D. in Clinical Psychology" school="Stanford University" year="2014" />
            <QualificationItem title="M.A. in Counseling Psychology" school="Columbia University" year="2010" />
          </View>

          {/* Patient Feedback */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>PATIENT FEEDBACK</Text>
            </View>
            <FeedbackItem name="Emily Rodriguez" date="March 2, 2026" text="Dr. Jenkins is incredibly empathetic and professional. Her approach helped me significantly." />
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Reviews (127)</Text>
            </TouchableOpacity>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity 
            style={styles.bookButton} 
            onPress={() => router.push('/counselors')} // Logic to go back to scheduling
          >
            <Text style={styles.bookButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Integrated Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/home')}>
            <Feather name="home" size={16} color="#8E969F" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/ai-chat')}>
            <Feather name="message-square" size={16} color="#8E969F" />
            <Text style={styles.navText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/counselors')}>
            <Feather name="users" size={16} color="#30353B" />
            <Text style={styles.navActive}>Counselors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('./profile')}>
            <Feather name="user" size={16} color="#8E969F" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Sub-components for cleaner structure
const QualificationItem = ({ title, school, year }: any) => (
  <View style={styles.qualCard}>
    <View style={styles.qualIconWrap}>
      <Ionicons name="school-outline" size={18} color="#2D7BF0" />
    </View>
    <View>
      <Text style={styles.qualTitle}>{title}</Text>
      <Text style={styles.qualSchool}>{school}</Text>
      <Text style={styles.qualYear}>{year}</Text>
    </View>
  </View>
);

const FeedbackItem = ({ name, date, text }: any) => (
  <View style={styles.feedbackCard}>
    <View style={styles.feedbackHeader}>
      <Text style={styles.feedbackName}>{name}</Text>
      <View style={styles.feedbackStars}>
        {[1, 2, 3, 4, 5].map((s) => <FontAwesome key={s} name="star" size={10} color="#FFD700" />)}
      </View>
    </View>
    <Text style={styles.feedbackDate}>{date}</Text>
    <Text style={styles.feedbackText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter', fontSize: 13, color: '#141B25', fontWeight: '800' },
  content: { padding: 16, paddingBottom: 100 },
  
  heroCard: { backgroundColor: '#007BFF', borderRadius: 20, padding: 20, marginBottom: 25 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  heroAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  heroInfo: { marginLeft: 15 },
  heroName: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  heroSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  experienceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  experienceText: { fontSize: 10, color: '#FFFFFF' },
  
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  starsContainer: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingScore: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginRight: 8 },
  star: { marginRight: 2 },
  basedOn: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  topRatedBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  topRatedText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  section: { marginBottom: 25 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionIndicator: { width: 4, height: 16, backgroundColor: '#2F88E8', marginRight: 10, borderRadius: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#343D4A' },
  bioText: { fontSize: 13, lineHeight: 20, color: '#626D7A' },

  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specTag: { backgroundColor: '#F0F7FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D0E6FF' },
  specTagText: { color: '#2F88E8', fontSize: 11, fontWeight: '600' },

  qualCard: { flexDirection: 'row', gap: 15, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#EDF2F7' },
  qualIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E1EFFF', justifyContent: 'center', alignItems: 'center' },
  qualTitle: { fontSize: 13, fontWeight: '700', color: '#2D3748' },
  qualSchool: { fontSize: 11, color: '#718096' },
  qualYear: { fontSize: 10, color: '#A0AEC0' },

  feedbackCard: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#EDF2F7' },
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  feedbackName: { fontSize: 13, fontWeight: '700', color: '#2D3748' },
  feedbackStars: { flexDirection: 'row', gap: 2 },
  feedbackDate: { fontSize: 10, color: '#A0AEC0', marginBottom: 8 },
  feedbackText: { fontSize: 12, lineHeight: 18, color: '#4A5568' },
  viewAllButton: { width: '100%', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  viewAllText: { fontSize: 11, fontWeight: '700', color: '#2F88E8' },

  bookButton: { height: 50, borderRadius: 12, backgroundColor: '#2D7BF0', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  bookButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 62, borderTopWidth: 1, borderTopColor: '#ECECEC', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6 },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 60 },
  navActive: { fontFamily: 'Inter', fontSize: 11, lineHeight: 14, color: '#30353B', fontWeight: '700' },
  navText: { fontFamily: 'Inter', fontSize: 11, lineHeight: 14, color: '#8E969F', fontWeight: '500' },
});
