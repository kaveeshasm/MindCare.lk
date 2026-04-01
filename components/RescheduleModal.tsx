import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type RescheduleSession = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed';
  actions?: boolean;
};

type CalendarCell = {
  key: string;
  isoDate: string;
  label: string;
  muted?: boolean;
};

type RescheduleModalProps = {
  visible: boolean;
  session: RescheduleSession | null;
  selectedDate: string;
  selectedTimeSlot: string;
  onSelectDate: (date: string) => void;
  onSelectTimeSlot: (slot: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  onCancelSession: () => void;
};

const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];

function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function getCalendarDays(monthDate: Date): CalendarCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayOffset = index - firstWeekday + 1;
    const cellDate = new Date(year, month, dayOffset);
    const isCurrentMonth = dayOffset >= 1 && dayOffset <= daysInMonth;

    return {
      key: `${formatIsoDate(cellDate)}-${index}`,
      isoDate: formatIsoDate(cellDate),
      label: String(cellDate.getDate()),
      muted: !isCurrentMonth,
    };
  });
}

export function RescheduleModal({
  visible,
  session,
  selectedDate,
  selectedTimeSlot,
  onSelectDate,
  onSelectTimeSlot,
  onClose,
  onConfirm,
  onCancelSession,
}: RescheduleModalProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initial = parseIsoDate(selectedDate);
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });

  useEffect(() => {
    if (!visible) {
      return;
    }

    const activeDate = parseIsoDate(selectedDate);
    setVisibleMonth(new Date(activeDate.getFullYear(), activeDate.getMonth(), 1));
  }, [selectedDate, visible]);

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);

  const handleMonthChange = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalShell}>
          <View style={styles.modalHero}>
            <TouchableOpacity style={styles.modalBackRow} activeOpacity={0.85} onPress={onClose}>
              <Feather name="chevron-left" size={14} color="#EAF3FF" />
              <Text style={styles.modalBackText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Reschedule Session</Text>
            <Text style={styles.modalSubtitle}>Choose a new date and time for your appointment.</Text>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalBody}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            {session ? (
              <>
                <Text style={styles.modalSectionTitle}>Current Appointment</Text>
                <View style={styles.currentCard}>
                  <Text style={styles.currentDoctor}>{session.doctor}</Text>
                  <Text style={styles.currentSpecialty}>{session.specialty}</Text>
                  <View style={styles.currentMetaRow}>
                    <Feather name="calendar" size={12} color="#7C8795" />
                    <Text style={styles.currentMetaText}>
                      {session.date}  {session.time}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Select New Date</Text>
                <View style={styles.calendarCard}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity style={styles.calendarChevron} activeOpacity={0.85} onPress={() => handleMonthChange(-1)}>
                      <Feather name="chevron-left" size={16} color="#BBC4D0" />
                    </TouchableOpacity>
                    <Text style={styles.calendarMonth}>{formatMonthYear(visibleMonth)}</Text>
                    <TouchableOpacity style={styles.calendarChevron} activeOpacity={0.85} onPress={() => handleMonthChange(1)}>
                      <Feather name="chevron-right" size={16} color="#BBC4D0" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.weekRow}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <Text key={day} style={styles.weekDay}>
                        {day}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.calendarGrid}>
                    {calendarDays.map((day) => {
                      const isSelected = day.isoDate === selectedDate;

                      return (
                        <TouchableOpacity
                          key={day.key}
                          style={[styles.calendarCell, isSelected && styles.calendarCellActive]}
                          activeOpacity={0.85}
                          onPress={() => onSelectDate(day.isoDate)}>
                          <Text
                            style={[
                              styles.calendarCellText,
                              day.muted && styles.calendarCellTextMuted,
                              isSelected && styles.calendarCellTextActive,
                            ]}>
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Select Time Slot</Text>
                <View style={styles.slotGrid}>
                  {timeSlots.map((slot) => {
                    const isSelected = slot === selectedTimeSlot;

                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[styles.slotButton, isSelected && styles.slotButtonActive]}
                        activeOpacity={0.9}
                        onPress={() => onSelectTimeSlot(slot)}>
                        <Text style={[styles.slotButtonText, isSelected && styles.slotButtonTextActive]}>{slot}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity style={styles.confirmRescheduleButton} activeOpacity={0.92} onPress={onConfirm}>
                  <Text style={styles.confirmRescheduleText}>Confirm Reschedule</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelSessionButton} activeOpacity={0.9} onPress={onCancelSession}>
                  <Text style={styles.cancelSessionText}>Cancel Session</Text>
                </TouchableOpacity>

                <Text style={styles.modalHint}>
                  Please reschedule at least 24 hours before your appointment to avoid cancellation fees.
                </Text>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 35, 48, 0.55)',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
    paddingTop: 110,
    paddingBottom: 92,
  },
  modalShell: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  modalHero: {
    backgroundColor: '#2F88E8',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
  },
  modalScroll: {
    flex: 1,
  },
  modalBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  modalBackText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#EAF3FF',
    fontWeight: '500',
  },
  modalTitle: {
    marginTop: 16,
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 22,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalSubtitle: {
    marginTop: 8,
    maxWidth: 280,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 17,
    color: '#DDEBFF',
    fontWeight: '400',
  },
  modalBody: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  modalSectionTitle: {
    marginTop: 10,
    marginBottom: 10,
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 18,
    color: '#1D2430',
    fontWeight: '700',
  },
  currentCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    backgroundColor: '#FBFCFE',
    padding: 14,
  },
  currentDoctor: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 20,
    color: '#141A22',
    fontWeight: '800',
  },
  currentSpecialty: {
    marginTop: 3,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#8A95A3',
    fontWeight: '500',
  },
  currentMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentMetaText: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 15,
    color: '#707B89',
    fontWeight: '500',
  },
  calendarCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarChevron: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonth: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 18,
    color: '#2A3340',
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 13,
    color: '#A0A9B5',
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCellActive: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignSelf: 'center',
    backgroundColor: 'rgba(47, 136, 232, 0.18)',
  },
  calendarCellText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#354050',
    fontWeight: '500',
  },
  calendarCellTextMuted: {
    color: '#C5CCD6',
  },
  calendarCellTextActive: {
    color: '#2F88E8',
    fontWeight: '700',
  },
  slotGrid: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    width: '31%',
    minWidth: 84,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotButtonActive: {
    borderColor: '#2F88E8',
    backgroundColor: 'rgba(47, 136, 232, 0.16)',
  },
  slotButtonText: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#495666',
    fontWeight: '600',
  },
  slotButtonTextActive: {
    color: '#2F88E8',
  },
  confirmRescheduleButton: {
    marginTop: 16,
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
  confirmRescheduleText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelSessionButton: {
    marginTop: 10,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDC9C9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSessionText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#C65A5A',
    fontWeight: '700',
  },
  modalHint: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 15,
    color: '#A2AAB4',
    fontWeight: '400',
  },
});
