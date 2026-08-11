import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { auth, db } from '@/lib/firebase';
import { getMemberProfile } from '@/lib/members';

export type MemberProfile = {
  name: string;
  email: string;
  gender: string;
  dob: string;
};

export type UserRole = 'member' | 'counselor' | 'admin' | null;

type AuthContextValue = {
  currentUser: User | null;
  memberProfile: MemberProfile;
  setMemberProfile: (profile: MemberProfile) => void;
  isAuthReady: boolean;
  userRole: UserRole;
};

const emptyProfile: MemberProfile = {
  name: '',
  email: '',
  gender: '',
  dob: '',
};

let expectedRole: 'member' | 'counselor' | null = null;

export function setExpectedRole(role: 'member' | 'counselor' | null) {
  expectedRole = role;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(auth?.currentUser ?? null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile>(emptyProfile);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isAuthReady, setIsAuthReady] = useState(!auth);

  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setCurrentUser(nextUser);

      if (!nextUser) {
        setMemberProfile(emptyProfile);
        setUserRole(null);
        setIsAuthReady(true);
        return;
      }

      void (async () => {
        try {
          if (db) {
            let role: UserRole = null;
            let attempts = 0;
            const maxAttempts = 5;

            while (attempts < maxAttempts) {
              // Check counselor
              const counselorRef = doc(db, 'counselors', nextUser.uid);
              const counselorSnap = await getDoc(counselorRef);
              if (counselorSnap.exists()) {
                role = 'counselor';
                break;
              }

              // Check admin
              const adminRef = doc(db, 'admins', nextUser.uid);
              let adminSnap = await getDoc(adminRef);

              const userEmail = nextUser.email?.toLowerCase();
              if (!adminSnap.exists() && (userEmail === 'admin@gmail.com' || userEmail === 'admin@mindcare.lk')) {
                try {
                  await setDoc(adminRef, {
                    email: userEmail,
                    role: 'admin',
                    createdAt: new Date().toISOString(),
                  });
                  adminSnap = await getDoc(adminRef);
                } catch (err) {
                  console.error("Error auto-creating admin doc in AuthContext:", err);
                }
              }

              if (adminSnap.exists()) {
                role = 'admin';
                break;
              }

              // Check member
              const memberRef = doc(db, 'members', nextUser.uid);
              const memberSnap = await getDoc(memberRef);
              if (memberSnap.exists()) {
                role = 'member';
                break;
              }

              // If none exist yet, it might be a new registration in progress.
              // Wait 500ms and retry to let the sign-up function finish writing to Firestore.
              attempts++;
              if (attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            }

            if (role === 'counselor') {
              if (expectedRole === 'member') {
                await auth?.signOut();
                expectedRole = null;
                return;
              }
              setMemberProfile(emptyProfile);
              setUserRole('counselor');
              setIsAuthReady(true);
              expectedRole = null;
              return;
            }

            if (role === 'admin') {
              setMemberProfile(emptyProfile);
              setUserRole('admin');
              setIsAuthReady(true);
              expectedRole = null;
              return;
            }

            if (role === 'member') {
              if (expectedRole === 'counselor') {
                await auth?.signOut();
                expectedRole = null;
                return;
              }
            }
          }
        } catch (e) {
          // Fallback to regular flow on error
        }

        if (expectedRole === 'counselor') {
          setMemberProfile(emptyProfile);
          setUserRole('counselor');
          setIsAuthReady(true);
          expectedRole = null;
          return;
        }

        setUserRole('member');
        const savedProfile = await getMemberProfile(nextUser.uid);

        setMemberProfile(
          savedProfile
            ? {
                name: savedProfile.name,
                email: savedProfile.email,
                gender: savedProfile.gender,
                dob: savedProfile.dob,
              }
            : {
                name: nextUser.displayName || '',
                email: nextUser.email || '',
                gender: '',
                dob: '',
              }
        );
        setIsAuthReady(true);
        expectedRole = null;
      })();
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      memberProfile,
      setMemberProfile,
      isAuthReady,
      userRole,
    }),
    [currentUser, isAuthReady, memberProfile, userRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}
