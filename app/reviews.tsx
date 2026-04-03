import React from 'react';
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const reviewsData = [
  { id: '1', name: 'Emily Rodriguez', date: 'March 2, 2026', rating: 5, initial: 'E', color: '#2F88E8', text: 'Dr. Jenkins is incredibly empathetic and helped me professional. Her CBT approach has managed my anxiety. Highly recommend!' },
  { id: '2', name: 'Michael Chen', date: 'February 28, 2026', rating: 5, initial: 'M', color: '#2F88E8', text: 'Outstanding therapist! She creates a safe space and her insights are Always valuable. I\'ve made tremendous progress in just a few months.' },
  { id: '3', name: 'Sarah Thompson', date: 'February 18, 2026', rating: 4, initial: 'S', color: '#2F88E8', text: 'Very professional and knowledgeable. The sessions are well-structured and I appreciate her evidence-based approach.' },
];

export default function ReviewsPage() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Navigation */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=100&q=80' }} 
              style={styles.headerAvatar} 
            />
            <View>
              <Text style={styles.headerName}>Dr. Jenkins</Text>
              <Text style={styles.headerSub}>Counseling</Text>
            </View>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Rating Summary Card */}
          <View style={styles.ratingHero}>
            <View style={styles.ratingLeft}>
              <Text style={styles.ratingLarge}>4.8</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4].map(s => <FontAwesome key={s} name="star" size={12} color="#FFD700" />)}
                <FontAwesome name="star-half-full" size={12} color="#FFD700" />
              </View>
              <Text style={styles.totalReviewsText}>127 reviews</Text>
            </View>
            <View style={styles.ratingBars}>
              {[108, 15, 3, 3, 0].map((val, i) => (
                <View key={i} style={styles.barRow}>
                  <Text style={styles.barLabel}>{5 - i}</Text>
                  <FontAwesome name="star" size={8} color="#A1A9B5" />
                  <View style={styles.barContainer}>
                    <View style={[styles.barFill, { width: `${(val / 127) * 100}%` }]} />
                  </View>
                  <Text style={styles.barValue}>{val}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Filter Section */}
          <View style={styles.filterSection}>
             <View style={styles.filterHeader}>
                <Feather name="filter" size={14} color="#626D7A" />
                <Text style={styles.filterLabel}>FILTER BY RATING</Text>
             </View>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                <TouchableOpacity style={[styles.chip, styles.chipActive]}><Text style={styles.chipTextActive}>All</Text></TouchableOpacity>
                {[5, 4, 3, 2, 1].map(s => (
                  <TouchableOpacity key={s} style={styles.chip}>
                    <FontAwesome name="star" size={10} color="#626D7A" />
                    <Text style={styles.chipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
             </ScrollView>
             
             <View style={styles.sortRow}>
                <MaterialCommunityIcons name="sort-variant" size={16} color="#626D7A" />
                <Text style={styles.filterLabel}>SORT BY</Text>
                <TouchableOpacity style={[styles.sortBtn, styles.sortBtnActive]}><Text style={styles.sortBtnTextActive}>Most Recent</Text></TouchableOpacity>
                <TouchableOpacity style={styles.sortBtn}><Text style={styles.sortBtnText}>Highest</Text></TouchableOpacity>
                <TouchableOpacity style={styles.sortBtn}><Text style={styles.sortBtnText}>Lowest</Text></TouchableOpacity>
             </View>
          </View>

          <Text style={styles.showingText}>Showing 12 reviews</Text>

          {/* Review List */}
          {reviewsData.map(item => (
            <View key={item.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={[styles.avatarCircle, { backgroundColor: item.color }]}>
                  <Text style={styles.avatarInitial}>{item.initial}</Text>
                </View>
                <View style={styles.reviewerInfo}>
                  <View style={styles.reviewerTop}>
                    <Text style={styles.reviewerName}>{item.name}</Text>
                    <View style={styles.starsRowSmall}>
                      {[...Array(item.rating)].map((_, i) => (
                        <FontAwesome key={i} name="star" size={10} color="#FFD700" />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>{item.date}</Text>
                </View>
              </View>
              <Text style={styles.reviewBody}>{item.text}</Text>
              <View style={styles.reviewFooter}>
                <TouchableOpacity style={styles.footerAction}>
                  <Feather name="thumbs-up" size={14} color="#626D7A" />
                  <Text style={styles.footerActionText}>Helpful (10)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerAction}>
                  <Feather name="share-2" size={14} color="#626D7A" />
                  <Text style={styles.footerActionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity 
            style={styles.backButtonLarge} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back to Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>

    
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F4F7' },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 32, height: 32, borderRadius: 16 },
  headerName: { fontSize: 15, fontWeight: '800', color: '#141B25' },
  headerSub: { fontSize: 11, color: '#7D8795' },
  content: { padding: 16, paddingBottom: 40 },
  
  ratingHero: { backgroundColor: '#2F88E8', borderRadius: 12, padding: 20, flexDirection: 'row', gap: 20, marginBottom: 20 },
  ratingLeft: { alignItems: 'center', justifyContent: 'center' },
  ratingLarge: { fontSize: 38, fontWeight: '800', color: '#FFFFFF' },
  starsRow: { flexDirection: 'row', gap: 2, marginVertical: 4 },
  totalReviewsText: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  ratingBars: { flex: 1, gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { width: 10, fontSize: 10, color: '#FFFFFF', fontWeight: '700' },
  barContainer: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#FFFFFF' },
  barValue: { width: 25, fontSize: 10, color: '#FFFFFF', textAlign: 'right' },

  filterSection: { marginBottom: 15 },
  filterHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  filterLabel: { fontSize: 10, fontWeight: '800', color: '#343D4A', letterSpacing: 0.5 },
  chipScroll: { gap: 8, paddingBottom: 15 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#DEE4EC' },
  chipActive: { backgroundColor: '#2F88E8', borderColor: '#2F88E8' },
  chipText: { fontSize: 11, fontWeight: '700', color: '#626D7A' },
  chipTextActive: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  sortBtnActive: { backgroundColor: '#2F88E8' },
  sortBtnText: { fontSize: 10, fontWeight: '700', color: '#626D7A' },
  sortBtnTextActive: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },

  showingText: { fontSize: 11, color: '#7D8795', fontWeight: '600', marginBottom: 12 },
  
  reviewCard: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EDF2F7', marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  reviewerInfo: { flex: 1 },
  reviewerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontSize: 13, fontWeight: '700', color: '#1D2531' },
  starsRowSmall: { flexDirection: 'row', gap: 1 },
  reviewDate: { fontSize: 10, color: '#7D8795', marginTop: 2 },
  reviewBody: { fontSize: 12, lineHeight: 18, color: '#4A5568' },
  reviewFooter: { flexDirection: 'row', gap: 20, marginTop: 12, borderTopWidth: 1, borderTopColor: '#F7FAFC', paddingTop: 10 },
  footerAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerActionText: { fontSize: 11, color: '#626D7A', fontWeight: '600' },

  backButtonLarge: { backgroundColor: '#2F88E8', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  backButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});