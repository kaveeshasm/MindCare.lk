import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScheduleParams = {
  name?: string | string[];
  specialty?: string | string[];
};

type Slot = {
  id: string;
  time: string;
  period: 'morning' | 'afternoon' | 'evening';
};

const DAYS = [
  { id: 'mon', label: 'MON', date: '12', hasDot: false },
  { id: 'tue', label: 'TUE', date: '13', hasDot: true },
  { id: 'wed', label: 'WED', date: '14', hasDot: false },
  { id: 'thu', label: 'THU', date: '15', hasDot: true },
  { id: 'fri', label: 'FRI', date: '16', hasDot: true },
];

const SLOTS: Slot[] = [
  { id: 'm1', time: '08:00 AM - 09:00 AM', period: 'morning' },
  { id: 'm2', time: '09:30 AM - 10:30 AM', period: 'morning' },
  { id: 'm3', time: '11:00 AM - 12:00 PM', period: 'morning' },
  { id: 'a1', time: '01:30 PM - 02:30 PM', period: 'afternoon' },
  { id: 'a2', time: '03:00 PM - 04:00 PM', period: 'afternoon' },
  { id: 'a3', time: '04:30 PM - 05:30 PM', period: 'afternoon' },
  { id: 'e1', time: '07:00 PM - 08:00 PM', period: 'evening' },
];

const PERIOD_META: Record<Slot['period'], { title: string; range: string; color: string }> = {
  morning: { title: 'Morning Sessions', range: '08:00 - 12:00', color: '#F0B06B' },
  afternoon: { title: 'Afternoon Sessions', range: '12:00 - 17:00', color: '#2F88E8' },
  evening: { title: 'Evening Sessions', range: '17:00 - 21:00', color: '#B884F8' },
};

const toSingleValue = (value: string | string[] | undefined): string =>
  typeof value === 'string' ? value : Array.isArray(value) ? value[0] ?? '' : '';

export default function CounselorScheduleScreen() {
  const params = useLocalSearchParams<ScheduleParams>();
  const counselorName = toSingleValue(params.name);
  const specialty = toSingleValue(params.specialty);

  const [selectedDay, setSelectedDay] = useState(DAYS[0].id);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({
    m1: true,
    m2: true,
    m3: false,
    a1: true,
    a2: true,
    a3: false,
    e1: false,
  });

  const openSlots = useMemo(
    () => SLOTS.filter((slot) => availabilityMap[slot.id]).length,
    [availabilityMap],
  );

  const toggleSlot = (id: string) => {
    setAvailabilityMap((current) => ({ ...current, [id]: !current[id] }));
    void Haptics.selectionAsync();
  };

  const goOverview = () => {
    router.replace({
      pathname: '/counselor-dashboard',
      params: { name: counselorName, specialty },
    });
  };

  const goProfile = () => {
    router.replace({
      pathname: '/counselor-profile',
      params: { name: counselorName, specialty },
    });
  };

  const handleSave = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', `Availability updated. ${openSlots} slots are open.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} activeOpacity={0.85} onPress={goOverview}>
            <Feather name="chevron-left" size={28} color="#1B2536" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SET AVAILABILITY</Text>
          <TouchableOpacity style={styles.headerIcon} activeOpacity={0.85}>
            <Feather name="more-horizontal" size={24} color="#1B2536" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerDivider} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>SELECT DAY</Text>
            <Text style={styles.nextWeekText}>Next Week</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
            {DAYS.map((day) => {
              const isActive = day.id === selectedDay;
              return (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayCard, isActive && styles.dayCardActive]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedDay(day.id);
                    void Haptics.selectionAsync();
                  }}>
                  <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>{day.label}</Text>
                  <Text style={[styles.dayDate, isActive && styles.dayDateActive]}>{day.date}</Text>
                  {day.hasDot && !isActive ? <View style={styles.dayDot} /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.infoCard}>
            <Feather name="info" size={22} color="#2F88E8" />
            <Text style={styles.infoText}>
              Tap the slots below to toggle your availability. Patients can only book sessions in available slots.
            </Text>
          </View>

          {(['morning', 'afternoon', 'evening'] as const).map((period) => {
            const groupSlots = SLOTS.filter((slot) => slot.period === period);
            const meta = PERIOD_META[period];

            return (
              <View key={period} style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleWrap}>
                    <View style={[styles.sectionDot, { backgroundColor: meta.color }]} />
                    <Text style={styles.sectionTitle}>{meta.title}</Text>
                  </View>
                  <Text style={styles.sectionRange}>{meta.range}</Text>
                </View>

                {groupSlots.map((slot) => {
                  const isOn = availabilityMap[slot.id];
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[styles.slotCard, !isOn && styles.slotCardOff]}
                      activeOpacity={0.9}
                      onPress={() => toggleSlot(slot.id)}>
                      <View style={[styles.slotIconWrap, !isOn && styles.slotIconWrapOff]}>
                        <Feather name="clock" size={24} color={isOn ? '#2F88E8' : '#8E95A3'} />
                      </View>

                      <View style={styles.slotInfo}>
                        <Text style={[styles.slotTime, !isOn && styles.slotTimeOff]}>{slot.time}</Text>
                        <Text style={styles.slotDuration}>60 MINUTE SESSION</Text>
                      </View>

                      <View style={styles.slotStatusWrap}>
                        <View style={[styles.statusPill, isOn ? styles.statusPillOn : styles.statusPillOff]}>
                          <Text style={[styles.statusText, isOn ? styles.statusTextOn : styles.statusTextOff]}>
                            {isOn ? 'AVAILABLE' : 'OFF'}
                          </Text>
                        </View>
                        <View style={[styles.toggleCircle, isOn && styles.toggleCircleOn]}>
                          {isOn ? <Feather name="check" size={18} color="#FFFFFF" /> : null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.bottomPanel}>
          <View style={styles.capacityWrap}>
            <Text style={styles.capacityLabel}>TOTAL CAPACITY</Text>
            <Text style={styles.capacityValue}>{openSlots} Slots Open</Text>
          </View>
          <TouchableOpacity style={styles.saveButton} activeOpacity={0.88} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={goOverview}>
            <Feather name="grid" size={24} color="#7F8695" />
            <Text style={styles.navText}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85}>
            <Feather name="calendar" size={24} color="#2F88E8" />
            <Text style={styles.navActive}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={goProfile}>
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
    backgroundColor: '#F4F6F8',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  header: {
    height: 68,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    lineHeight: 26,
    color: '#111B2E',
    fontWeight: '800',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#DEE2E9',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 180,
    gap: 14,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayHeaderText: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 18,
    color: '#727D8E',
    fontWeight: '800',
  },
  nextWeekText: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 19,
    color: '#2F88E8',
    fontWeight: '700',
  },
  dayRow: {
    gap: 10,
    paddingRight: 10,
  },
  dayCard: {
    width: 108,
    minHeight: 128,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7DDE7',
    backgroundColor: '#F7F9FB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dayCardActive: {
    backgroundColor: '#2F88E8',
    borderColor: '#2F88E8',
    shadowColor: '#2F88E8',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dayLabel: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 18,
    color: '#6E7788',
    fontWeight: '800',
  },
  dayLabelActive: {
    color: '#FFFFFF',
  },
  dayDate: {
    fontFamily: 'Inter',
    fontSize: 46,
    lineHeight: 52,
    color: '#111B2E',
    fontWeight: '800',
  },
  dayDateActive: {
    color: '#FFFFFF',
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2F88E8',
    marginTop: 4,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C9DEFA',
    backgroundColor: '#EAF3FF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 22,
    color: '#244CAD',
    fontWeight: '500',
  },
  sectionWrap: {
    gap: 10,
  },
  sectionHeader: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    lineHeight: 28,
    color: '#1A2231',
    fontWeight: '800',
  },
  sectionRange: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 18,
    color: '#70798A',
    fontWeight: '700',
  },
  slotCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CFE0F8',
    backgroundColor: '#FFFFFF',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotCardOff: {
    borderColor: '#E2E6ED',
    backgroundColor: '#F6F8FB',
  },
  slotIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 12,
    backgroundColor: '#EEF4FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotIconWrapOff: {
    backgroundColor: '#F0F2F5',
  },
  slotInfo: {
    flex: 1,
    gap: 2,
  },
  slotTime: {
    fontFamily: 'Inter',
    fontSize: 20,
    lineHeight: 24,
    color: '#1A2231',
    fontWeight: '800',
  },
  slotTimeOff: {
    color: '#3F4653',
  },
  slotDuration: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    color: '#70798A',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  slotStatusWrap: {
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusPillOn: {
    backgroundColor: '#E7F1FE',
  },
  statusPillOff: {
    backgroundColor: '#ECEFF4',
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  statusTextOn: {
    color: '#2F88E8',
  },
  statusTextOff: {
    color: '#8A93A3',
  },
  toggleCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: '#C9CFDA',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
  },
  toggleCircleOn: {
    backgroundColor: '#2F88E8',
    borderColor: '#2F88E8',
  },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 78,
    borderTopWidth: 1,
    borderTopColor: '#DEE2E9',
    backgroundColor: '#F4F6F8',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityWrap: {
    gap: 4,
  },
  capacityLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#6D7686',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  capacityValue: {
    fontFamily: 'Inter',
    fontSize: 20,
    lineHeight: 24,
    color: '#151D2C',
    fontWeight: '800',
  },
  saveButton: {
    height: 62,
    borderRadius: 31,
    paddingHorizontal: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2F88E8',
    shadowColor: '#2F88E8',
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  saveButtonText: {
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
