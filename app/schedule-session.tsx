import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ConsultationMode = 'video' | 'voice';

type CalendarDay = {
  key: string;
  dayNumber: number | null;
  isoDate: string | null;
  isCurrentMonth: boolean;
};

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const SLOT_LABELS = ['09:00 AM', '10:30 AM', '11:00 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM', '08:30 PM'];

function formatMonthYear(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function formatSummaryDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getCalendarDays(monthDate: Date): CalendarDay[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayOffset = index - firstWeekday + 1;

    if (dayOffset < 1 || dayOffset > daysInMonth) {
      return {
        key: `empty-${index}`,
        dayNumber: null,
        isoDate: null,
        isCurrentMonth: false,
      };
    }

    const date = new Date(year, month, dayOffset);
    return {
      key: formatIsoDate(date),
      dayNumber: dayOffset,
      isoDate: formatIsoDate(date),
      isCurrentMonth: true,
    };
  });
}

export default function ScheduleSessionPage() {
  const params = useLocalSearchParams<{
    name?: string;
    title?: string;
    years?: string;
    avatar?: string;
    tags?: string | string[];
  }>();

  const initialMonth = useMemo(() => new Date(2024, 9, 1), []);
  const initialDate = useMemo(() => new Date(2024, 9, 25), []);
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(formatIsoDate(initialDate));
  const [selectedSlot, setSelectedSlot] = useState('10:30 AM');
  const [selectedMode, setSelectedMode] = useState<ConsultationMode>('video');

  const tagsParam = Array.isArray(params.tags) ? params.tags[0] : params.tags;
  const counselorTags = (tagsParam ? tagsParam.split(',') : ['Anxiety', 'CBT']).filter(Boolean).slice(0, 2);
  const counselorName = params.name ?? 'Mrs. Dinithi Jayawardena';
  const counselorTitle = params.title ?? 'Clinical Psychologist';
  const counselorYears = params.years ?? '12 years';
  const counselorAvatar =
    params.avatar ??
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80';

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const selectedDateObject = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [selectedDate]);

  const canGoPreviousMonth =
    visibleMonth.getFullYear() > initialMonth.getFullYear() || visibleMonth.getMonth() > initialMonth.getMonth();

  const handleMonthChange = (offset: number) => {
    if (offset < 0 && !canGoPreviousMonth) {
      return;
    }

    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const handleSelectDate = (isoDate: string) => {
    setSelectedDate(isoDate);

    const [year, month] = isoDate.split('-').map(Number);
    setVisibleMonth(new Date(year, month - 1, 1));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => router.back()}>
              <Feather name="chevron-left" size={20} color="#222B38" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>SCHEDULE SESSION</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionLabel}>BOOKING WITH</Text>
            <View style={styles.counselorCard}>
              <Image source={{ uri: counselorAvatar }} style={styles.counselorAvatar} />
              <View style={styles.counselorInfo}>
                <Text style={styles.counselorName}>{counselorName}</Text>
                <Text style={styles.counselorMeta}>
                  {counselorTitle} • {counselorYears} exp.
                </Text>
                <View style={styles.counselorFooter}>
                  <View style={styles.tagRow}>
                    {counselorTags.map((tag) => (
                      <Text key={tag} style={styles.tagText}>
                        {tag}
                      </Text>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.profileButton} activeOpacity={0.85}>
                    <Text style={styles.profileButtonText}>View Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>SELECT DATE</Text>
              <Text style={styles.sectionLink}>{formatMonthYear(visibleMonth)}</Text>
            </View>

            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>{formatMonthYear(visibleMonth)}</Text>
                <View style={styles.calendarActions}>
                  <TouchableOpacity
                    style={[styles.monthButton, !canGoPreviousMonth && styles.monthButtonDisabled]}
                    activeOpacity={0.85}
                    onPress={() => handleMonthChange(-1)}
                    disabled={!canGoPreviousMonth}>
                    <Feather name="chevron-left" size={18} color={canGoPreviousMonth ? '#4B5562' : '#C4CAD2'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.monthButton} activeOpacity={0.85} onPress={() => handleMonthChange(1)}>
                    <Feather name="chevron-right" size={18} color="#4B5562" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.calendarHint}>Choose your preferred date</Text>

              <View style={styles.weekRow}>
                {WEEK_DAYS.map((day) => (
                  <Text key={day} style={styles.weekDay}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {calendarDays.map((day) => {
                  const isSelected = day.isoDate === selectedDate;
                  const isHighlighted = day.isoDate === '2024-10-24';

                  return (
                    <TouchableOpacity
                      key={day.key}
                      style={[
                        styles.dayCell,
                        !day.isCurrentMonth && styles.dayCellEmpty,
                        isHighlighted && styles.dayCellHighlighted,
                        isSelected && styles.dayCellSelected,
                      ]}
                      activeOpacity={0.85}
                      disabled={!day.isoDate}
                      onPress={() => day.isoDate && handleSelectDate(day.isoDate)}>
                      <Text
                        style={[
                          styles.dayText,
                          !day.isCurrentMonth && styles.dayTextEmpty,
                          isHighlighted && styles.dayTextHighlighted,
                          isSelected && styles.dayTextSelected,
                        ]}>
                        {day.dayNumber ?? ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>AVAILABLE SLOTS</Text>
              <View style={styles.timezoneWrap}>
                <Feather name="clock" size={12} color="#A1A9B5" />
                <Text style={styles.timezoneText}>GMT +5:30</Text>
              </View>
            </View>

            <View style={styles.slotGrid}>
              {SLOT_LABELS.map((slot) => {
                const isActive = slot === selectedSlot;

                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotButton, isActive && styles.slotButtonActive]}
                    activeOpacity={0.88}
                    onPress={() => setSelectedSlot(slot)}>
                    <Text style={[styles.slotText, isActive && styles.slotTextActive]}>{slot}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionLabel}>CONSULTATION MODE</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeCard, selectedMode === 'video' && styles.modeCardActive]}
                activeOpacity={0.88}
                onPress={() => setSelectedMode('video')}>
                <View style={[styles.modeIconWrap, selectedMode === 'video' && styles.modeIconWrapActive]}>
                  <Ionicons name="videocam-outline" size={20} color={selectedMode === 'video' ? '#FFFFFF' : '#4E5968'} />
                </View>
                <Text style={styles.modeTitle}>Video Call</Text>
                <Text style={styles.modeText}>Face-to-face secure therapy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeCard, selectedMode === 'voice' && styles.modeCardActive]}
                activeOpacity={0.88}
                onPress={() => setSelectedMode('voice')}>
                <View style={[styles.modeIconWrap, selectedMode === 'voice' && styles.modeIconWrapActive]}>
                  <Feather name="mic" size={18} color={selectedMode === 'voice' ? '#FFFFFF' : '#4E5968'} />
                </View>
                <Text style={styles.modeTitle}>Voice Only</Text>
                <Text style={styles.modeText}>For better privacy & low bandwidth</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryDate}>{formatSummaryDate(selectedDateObject)}</Text>
            <Text style={styles.summaryMeta}>
              {selectedSlot} • {selectedMode === 'video' ? 'Video' : 'Voice'}
            </Text>
          </View>

          <TouchableOpacity style={styles.confirmButton} activeOpacity={0.9}>
            <Text style={styles.confirmText}>Confirm Booking</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/home')}>
            <Feather name="home" size={18} color="#9AA3AE" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/ai-chat')}>
            <MaterialCommunityIcons name="robot-outline" size={18} color="#9AA3AE" />
            <Text style={styles.navText}>AI Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/counselors')}>
            <Feather name="users" size={18} color="#2F88E8" />
            <Text style={styles.navActive}>Counselors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85}>
            <Feather name="user" size={18} color="#9AA3AE" />
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
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 128,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    lineHeight: 28,
    color: '#141B25',
    fontWeight: '800',
  },
  headerSpacer: {
    width: 28,
  },
  sectionWrap: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 16,
    color: '#6E7886',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionLink: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 16,
    color: '#2F88E8',
    fontWeight: '600',
  },
  counselorCard: {
    borderRadius: 18,
    backgroundColor: '#F7F9FC',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  counselorAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  counselorInfo: {
    flex: 1,
    gap: 5,
  },
  counselorName: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 21,
    color: '#1D2531',
    fontWeight: '800',
  },
  counselorMeta: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#7C8694',
    fontWeight: '500',
  },
  counselorFooter: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#616C7B',
    fontWeight: '500',
  },
  profileButton: {
    minWidth: 118,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2F88E8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  profileButtonText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DEE4EC',
    backgroundColor: '#FFFFFF',
    padding: 18,
    gap: 14,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 21,
    color: '#1C2430',
    fontWeight: '800',
  },
  calendarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  monthButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  monthButtonDisabled: {
    opacity: 0.45,
  },
  calendarHint: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 18,
    color: '#8A95A3',
    fontWeight: '500',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekDay: {
    width: 36,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#8D97A5',
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellEmpty: {
    opacity: 0,
  },
  dayCellHighlighted: {
    borderRadius: 18,
    backgroundColor: '#E7F0FF',
  },
  dayCellSelected: {
    borderRadius: 18,
    backgroundColor: '#2D7BF0',
    shadowColor: '#2D7BF0',
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  dayText: {
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 22,
    color: '#46515E',
    fontWeight: '500',
  },
  dayTextEmpty: {
    color: 'transparent',
  },
  dayTextHighlighted: {
    color: '#5B76A8',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timezoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timezoneText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 15,
    color: '#9BA4B1',
    fontWeight: '500',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slotButton: {
    width: '31%',
    minWidth: 96,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F7F9FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotButtonActive: {
    backgroundColor: '#2D7BF0',
    shadowColor: '#2D7BF0',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  slotText: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 18,
    color: '#525D6B',
    fontWeight: '500',
  },
  slotTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 14,
  },
  modeCard: {
    flex: 1,
    minHeight: 170,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DEE4EC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 10,
  },
  modeCardActive: {
    borderColor: '#2D7BF0',
    backgroundColor: '#EFF5FF',
  },
  modeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconWrapActive: {
    backgroundColor: '#2D7BF0',
  },
  modeTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 20,
    color: '#1F2733',
    fontWeight: '800',
  },
  modeText: {
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    color: '#7C8694',
    fontWeight: '500',
  },
  summaryCard: {
    borderRadius: 18,
    backgroundColor: '#F7F9FC',
    paddingVertical: 20,
    paddingHorizontal: 18,
    gap: 8,
    alignItems: 'center',
  },
  summaryDate: {
    fontFamily: 'Inter',
    fontSize: 22,
    lineHeight: 28,
    color: '#2D7BF0',
    fontWeight: '800',
  },
  summaryMeta: {
    fontFamily: 'Inter',
    fontSize: 17,
    lineHeight: 22,
    color: '#5B6472',
    fontWeight: '500',
  },
  confirmButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#235FEA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#235FEA',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  confirmText: {
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 22,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 66,
    borderTopWidth: 1,
    borderTopColor: '#E2E7EE',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navActive: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#2F88E8',
    fontWeight: '700',
  },
  navText: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#97A0AB',
    fontWeight: '600',
  },
});
