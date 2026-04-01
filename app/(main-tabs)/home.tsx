import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type MoodOption = {
  id: 'happy' | 'calm' | 'manic' | 'angry' | 'sad';
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  tint: string;
};

type CopingCard = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  tone: 'warm' | 'cool';
};

type ReadCard = {
  id: string;
  category: string;
  title: string;
  author: string;
  minutes: string;
  image: string;
};

const moodOptions: MoodOption[] = [
  { id: 'happy', label: 'Happy', icon: 'emoticon-happy-outline', color: '#EC4FA4', tint: '#FFE1F1' },
  { id: 'calm', label: 'Calm', icon: 'weather-night', color: '#8A88E7', tint: '#EEEAFE' },
  { id: 'manic', label: 'Manic', icon: 'weather-windy', color: '#7AD6D9', tint: '#E4FBFB' },
  { id: 'angry', label: 'Angry', icon: 'emoticon-angry-outline', color: '#F1A345', tint: '#FFF0DE' },
  { id: 'sad', label: 'Sad', icon: 'emoticon-sad-outline', color: '#A7D87D', tint: '#EFFBDF' },
];

const copingCards: CopingCard[] = [
  {
    id: '1',
    title: 'Anxiety',
    description: 'Box Breathing Technique',
    icon: 'activity',
    tone: 'warm',
  },
  {
    id: '2',
    title: 'Stress',
    description: 'Grounding Exercise',
    icon: 'eye',
    tone: 'cool',
  },
];

const reads: ReadCard[] = [
  {
    id: '1',
    category: 'Neuroscience',
    title: 'The science of gratitude: How to Rewire your Brain',
    author: 'Nilantha',
    minutes: '4 min read',
    image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '2',
    category: 'Mindfulness',
    title: 'Finding Stillness in a Chaotic Digital World',
    author: 'Uthoja Kumara',
    minutes: '6 min read',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '3',
    category: 'Wellness',
    title: 'Understanding Sleep Hygiene for Better Mental Health',
    author: 'Saman Bandara',
    minutes: '7 min read',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function HomePage() {
  const [selectedMood, setSelectedMood] = useState<MoodOption['id']>('happy');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.heroBlob} />
            <Text style={styles.heroTitle}>
              Good{'\n'}Morning !
            </Text>
          </View>

          <View style={styles.moodSection}>
            <Text style={styles.moodPrompt}>How are you feeling today?</Text>
            <View style={styles.moodRow}>
              {moodOptions.map((mood) => {
                const isSelected = mood.id === selectedMood;

                return (
                  <TouchableOpacity
                    key={mood.id}
                    style={[styles.moodItem, isSelected && styles.moodItemActive]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedMood(mood.id)}>
                    <View
                      style={[
                        styles.moodIconWrap,
                        {
                          backgroundColor: mood.tint,
                          borderColor: isSelected ? mood.color : '#FFFFFF',
                        },
                      ]}>
                      <MaterialCommunityIcons name={mood.icon} size={24} color={mood.color} />
                    </View>
                    <Text style={[styles.moodLabel, isSelected && { color: mood.color }]}>{mood.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.copingHeader}>
            <Text style={styles.sectionTitle}>Daily Copings</Text>
            <Text style={styles.sectionSubtitle}>Quick exercise for instant relief</Text>
          </View>

          <View style={styles.copingRow}>
            {copingCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[styles.copingCard, card.tone === 'warm' ? styles.copingCardWarm : styles.copingCardCool]}
                activeOpacity={0.88}>
                <View style={styles.copingIcon}>
                  <Feather name={card.icon} size={16} color="#434C58" />
                </View>
                <Text style={styles.copingTitle}>{card.title}</Text>
                <Text style={styles.copingText}>{card.description}</Text>
                <View style={styles.copingFooter}>
                  <Text style={styles.startText}>Start</Text>
                  <Feather name="chevron-right" size={12} color="#74808E" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.searchWrap}>
            <Feather name="search" size={13} color="#B1B8C2" />
            <TextInput
              placeholder="Search wellness topics..."
              placeholderTextColor="#B1B8C2"
              style={styles.searchInput}
            />
          </View>

          <Text style={styles.readsTitle}>Mindful Reads</Text>

          {reads.map((item) => (
            <View style={styles.readCard} key={item.id}>
              <View style={styles.readImageWrap}>
                <Image source={{ uri: item.image }} style={styles.readImage} />
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              </View>

              <Text style={styles.readTitle}>{item.title}</Text>

              <View style={styles.readMetaRow}>
                <View style={styles.metaGroup}>
                  <Feather name="user" size={10} color="#B1B9C4" />
                  <Text style={styles.metaText}>{item.author}</Text>
                </View>
                <View style={styles.metaGroup}>
                  <Feather name="clock" size={10} color="#B1B9C4" />
                  <Text style={styles.metaText}>{item.minutes}</Text>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.moreButton} activeOpacity={0.88}>
            <Text style={styles.moreButtonText}>Explore more articles</Text>
          </TouchableOpacity>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingBottom: 84,
  },
  hero: {
    height: 126,
    paddingHorizontal: 14,
    paddingTop: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  heroBlob: {
    position: 'absolute',
    top: -28,
    right: -14,
    width: 116,
    height: 132,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 0,
    backgroundColor: '#0E97F0',
  },
  heroTitle: {
    marginTop: 12,
    fontFamily: 'Inter',
    fontSize: 26,
    lineHeight: 28,
    color: '#171717',
    fontWeight: '800',
  },
  moodSection: {
    paddingHorizontal: 14,
    marginTop: -2,
  },
  moodPrompt: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#646B75',
    fontWeight: '500',
  },
  moodRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  moodItem: {
    alignItems: 'center',
    width: 62,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF1F5',
    shadowColor: '#93A4B8',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  moodItemActive: {
    borderColor: '#D7E7FF',
    backgroundColor: '#F7FBFF',
    shadowColor: '#6FA8FF',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  moodIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  moodLabel: {
    marginTop: 8,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#5F6975',
    fontWeight: '700',
  },
  copingHeader: {
    marginTop: 12,
    alignItems: 'center',
    gap: 2,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 22,
    color: '#1E1E1E',
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#6C7480',
    fontWeight: '500',
  },
  copingRow: {
    marginTop: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    gap: 10,
  },
  copingCard: {
    flex: 1,
    minHeight: 126,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#C9D9E4',
    shadowColor: '#90A4B8',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  copingCardWarm: {
    backgroundColor: '#EDF5FA',
  },
  copingCardCool: {
    backgroundColor: '#DCEEFA',
  },
  copingIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  copingTitle: {
    marginTop: 10,
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 18,
    color: '#1A1A1A',
    fontWeight: '800',
  },
  copingText: {
    marginTop: 6,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 17,
    color: '#505B67',
    fontWeight: '500',
  },
  copingFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 14,
    color: '#536272',
    fontWeight: '700',
  },
  searchWrap: {
    marginTop: 14,
    marginHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 16,
    color: '#4E5965',
  },
  readsTitle: {
    marginTop: 14,
    marginHorizontal: 12,
    fontFamily: 'Inter',
    fontSize: 22,
    lineHeight: 28,
    color: '#181818',
    fontWeight: '700',
  },
  readCard: {
    marginTop: 10,
    marginHorizontal: 10,
    paddingBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#A5B2C2',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  readImageWrap: {
    marginHorizontal: 8,
    marginTop: 8,
    height: 112,
    borderRadius: 10,
    overflow: 'hidden',
  },
  readImage: {
    width: '100%',
    height: '100%',
  },
  categoryTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E8F0FF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 12,
    color: '#4B79D8',
    fontWeight: '700',
  },
  readTitle: {
    marginTop: 10,
    paddingHorizontal: 10,
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 19,
    color: '#171717',
    fontWeight: '700',
  },
  readMetaRow: {
    marginTop: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#7F8A96',
    fontWeight: '500',
  },
  moreButton: {
    marginTop: 14,
    marginHorizontal: 10,
    marginBottom: 16,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7EBF0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButtonText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#707884',
    fontWeight: '600',
  },
});
