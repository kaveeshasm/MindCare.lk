import { useSyncExternalStore } from 'react';

export type BookedSession = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed';
  actions?: boolean;
};

const initialSessions: BookedSession[] = [
  {
    id: 'sarah',
    doctor: 'Dr. Sarah Johnson',
    specialty: 'Cognitive Behavioral Therapy',
    date: 'March 15, 2026',
    time: '2:00 PM - 3:00 PM',
    status: 'Upcoming',
    actions: true,
  },
  {
    id: 'michael',
    doctor: 'Dr. Michael Chen',
    specialty: 'General Consultation',
    date: 'March 12, 2026',
    time: '10:00 AM - 11:00 AM',
    status: 'Completed',
  },
  {
    id: 'emily',
    doctor: 'Dr. Emily Williams',
    specialty: 'Anxiety Management',
    date: 'March 22, 2026',
    time: '4:00 PM - 5:00 PM',
    status: 'Upcoming',
    actions: true,
  },
];

let sessions = initialSessions;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return sessions;
}

export function useBookedSessions() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function addBookedSession(session: BookedSession) {
  sessions = [session, ...sessions];
  emitChange();
}

export function updateBookedSession(sessionId: string, patch: Partial<BookedSession>) {
  sessions = sessions.map((session) => (session.id === sessionId ? { ...session, ...patch } : session));
  emitChange();
}

export function removeBookedSession(sessionId: string) {
  sessions = sessions.filter((session) => session.id !== sessionId);
  emitChange();
}
