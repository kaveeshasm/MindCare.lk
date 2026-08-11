import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db, getFirebaseConfigError } from "@/lib/firebase";

export type CounselorProfile = {
  uid: string;
  email: string;
  salutation: string;
  fullName: string;
  displayName: string;
  specialty: string;
  qualifications: string[];
  researchStudies: string[];
  bio: string;
  role: "counselor";
  profileCompleted: boolean;
  avatarUrl?: string;
  schedules?: Record<string, any>;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type CounselorSignupInput = {
  salutation: string;
  fullName: string;
  email: string;
  password: string;
};

type CounselorProfileUpdateInput = {
  salutation: string;
  fullName: string;
  specialty: string;
  qualifications: string[];
  researchStudies: string[];
  bio: string;
  avatarUrl?: string;
};

const counselorCollection = () => {
  if (!db) {
    throw new Error(getFirebaseConfigError() ?? "Firestore is unavailable.");
  }

  return collection(db, "counselors");
};

const counselorDocRef = (uid: string) => {
  if (!db) {
    throw new Error(getFirebaseConfigError() ?? "Firestore is unavailable.");
  }

  return doc(db, "counselors", uid);
};

const buildDisplayName = (salutation: string, fullName: string) =>
  `${salutation.trim()} ${fullName.trim()}`.trim();

async function getDocWithRetry(docRef: any, maxAttempts = 3): Promise<any> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      return await getDoc(docRef);
    } catch (error) {
      const isPermissionError =
        error instanceof Error &&
        (error.message.includes("permission") ||
          error.message.includes("permission-denied") ||
          error.message.includes("PERMISSION_DENIED"));

      if (isPermissionError && attempts < maxAttempts - 1) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }
      throw error;
    }
  }
}

export async function createCounselorAccount(input: CounselorSignupInput) {
  if (!auth) {
    throw new Error(
      getFirebaseConfigError() ?? "Firebase Auth is unavailable.",
    );
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    input.email,
    input.password,
  );
  const displayName = buildDisplayName(input.salutation, input.fullName);

  await updateProfile(credential.user, { displayName });

  const counselorProfile: CounselorProfile = {
    uid: credential.user.uid,
    email: input.email,
    salutation: input.salutation,
    fullName: input.fullName,
    displayName,
    specialty: "",
    qualifications: [],
    researchStudies: [],
    bio: "",
    role: "counselor",
    profileCompleted: false,
  };

  await setDoc(counselorDocRef(credential.user.uid), {
    ...counselorProfile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return counselorProfile;
}

export async function signInCounselor(email: string, password: string) {
  if (!auth) {
    throw new Error(
      getFirebaseConfigError() ?? "Firebase Auth is unavailable.",
    );
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  const existingProfile = await getCounselorProfile(credential.user.uid);

  if (existingProfile) {
    return existingProfile;
  }

  const fallbackFullName =
    credential.user.displayName?.replace(/^(Mr|Mrs|Ms)\s+/i, "").trim() || "";
  const fallbackSalutation =
    credential.user.displayName?.match(/^(Mr|Mrs|Ms)\b/i)?.[1] ?? "Mr";
  const createdProfile: CounselorProfile = {
    uid: credential.user.uid,
    email: credential.user.email ?? email,
    salutation: fallbackSalutation,
    fullName: fallbackFullName,
    displayName:
      credential.user.displayName ??
      buildDisplayName(fallbackSalutation, fallbackFullName),
    specialty: "",
    qualifications: [],
    researchStudies: [],
    bio: "",
    role: "counselor",
    profileCompleted: false,
  };

  await setDoc(counselorDocRef(credential.user.uid), {
    ...createdProfile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return createdProfile;
}

export async function signInCounselorWithGoogle(
  idToken?: string,
  accessToken?: string,
) {
  if (!auth) {
    throw new Error(
      getFirebaseConfigError() ?? "Firebase Auth is unavailable.",
    );
  }

  if (!idToken && !accessToken) {
    throw new Error("Google sign-in did not return an identity token.");
  }

  const credential = GoogleAuthProvider.credential(
    idToken ?? null,
    accessToken,
  );
  const userCredential = await signInWithCredential(auth, credential);

  // Check if this Google account is already registered as a member using direct document read (permitted for self)
  if (db) {
    try {
      const memberDoc = await getDocWithRetry(doc(db, "members", userCredential.user.uid));
      if (memberDoc.exists()) {
        throw new Error("This Google account is already registered as a member.");
      }
    } catch (error) {
      await auth.signOut();
      throw error;
    }
  }

  const existingProfile = await getCounselorProfile(userCredential.user.uid);

  if (existingProfile) {
    return existingProfile;
  }

  const fallbackFullName = userCredential.user.displayName?.trim() || "";
  const createdProfile: CounselorProfile = {
    uid: userCredential.user.uid,
    email: userCredential.user.email ?? "",
    salutation: "Mr",
    fullName: fallbackFullName,
    displayName: fallbackFullName,
    specialty: "",
    qualifications: [],
    researchStudies: [],
    bio: "",
    role: "counselor",
    profileCompleted: false,
  };

  await setDoc(counselorDocRef(userCredential.user.uid), {
    ...createdProfile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return createdProfile;
}

export async function getCounselorProfile(uid: string) {
  const snapshot = await getDoc(counselorDocRef(uid));
  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as CounselorProfile;
}

export async function upsertCounselorProfile(
  uid: string,
  input: CounselorProfileUpdateInput,
) {
  const existingProfile = await getCounselorProfile(uid);
  const currentEmail = auth?.currentUser?.email ?? existingProfile?.email ?? "";
  const displayName = buildDisplayName(input.salutation, input.fullName);

  await setDoc(
    counselorDocRef(uid),
    {
      uid,
      email: currentEmail,
      salutation: input.salutation,
      fullName: input.fullName,
      displayName,
      specialty: input.specialty,
      qualifications: input.qualifications,
      researchStudies: input.researchStudies,
      bio: input.bio,
      role: "counselor",
      profileCompleted: true,
      avatarUrl: input.avatarUrl ?? existingProfile?.avatarUrl ?? "",
      updatedAt: serverTimestamp(),
      createdAt: existingProfile?.createdAt ?? serverTimestamp(),
    },
    { merge: true },
  );

  if (auth?.currentUser) {
    await updateProfile(auth.currentUser, { displayName });
  }

  return {
    uid,
    email: currentEmail,
    salutation: input.salutation,
    fullName: input.fullName,
    displayName,
    specialty: input.specialty,
    qualifications: input.qualifications,
    researchStudies: input.researchStudies,
    bio: input.bio,
    role: "counselor" as const,
    profileCompleted: true,
    avatarUrl: input.avatarUrl ?? existingProfile?.avatarUrl ?? "",
  };
}

export async function listCounselors() {
  const snapshot = await getDocs(counselorCollection());

  return snapshot.docs
    .map((item) => item.data() as CounselorProfile)
    .filter((item) => item.role === "counselor" && item.profileCompleted)
    .filter((item) => item.fullName.trim() && item.specialty.trim());
}
