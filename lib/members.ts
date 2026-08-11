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

export type MemberProfileRecord = {
  uid: string;
  email: string;
  name: string;
  displayName?: string;
  gender: string;
  dob: string;
  profileCompleted: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type MemberProfileInput = {
  name: string;
  gender: string;
  dob: string;
};

const memberDocRef = (uid: string) => {
  if (!db) {
    throw new Error(getFirebaseConfigError() ?? "Firestore is unavailable.");
  }

  return doc(db, "members", uid);
};

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

function normalizeMemberProfile(
  data: Record<string, unknown>,
): MemberProfileRecord {
  const name =
    typeof data.name === "string" && data.name.trim()
      ? data.name.trim()
      : typeof data.displayName === "string"
        ? data.displayName.trim()
        : "";

  return {
    uid: typeof data.uid === "string" ? data.uid : "",
    email: typeof data.email === "string" ? data.email : "",
    name,
    displayName:
      typeof data.displayName === "string" ? data.displayName : undefined,
    gender: typeof data.gender === "string" ? data.gender : "",
    dob: typeof data.dob === "string" ? data.dob : "",
    profileCompleted: Boolean(data.profileCompleted),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createMemberAccount(email: string, password: string) {
  if (!auth) {
    throw new Error(
      getFirebaseConfigError() ?? "Firebase Auth is unavailable.",
    );
  }

  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInMember(email: string, password: string) {
  if (!auth) {
    throw new Error(
      getFirebaseConfigError() ?? "Firebase Auth is unavailable.",
    );
  }

  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInMemberWithGoogle(
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
  const user = userCredential.user;

  // Check if this Google account is already registered as a counselor using direct document read (permitted for self)
  if (db) {
    try {
      const counselorDoc = await getDocWithRetry(doc(db, "counselors", user.uid));
      if (counselorDoc.exists()) {
        throw new Error("This Google account is already registered as a counselor.");
      }
    } catch (error) {
      await auth.signOut();
      throw error;
    }
  }

  const existingProfile = await getMemberProfile(user.uid);
  if (!existingProfile) {
    const fallbackName = user.displayName?.trim() || "";

    await setDoc(
      memberDocRef(user.uid),
      {
        uid: user.uid,
        email: user.email ?? "",
        name: fallbackName,
        displayName: fallbackName,
        gender: "",
        dob: "",
        profileCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  return userCredential;
}

export async function getMemberProfile(uid: string) {
  const snapshot = await getDoc(memberDocRef(uid));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeMemberProfile(snapshot.data());
}

export async function upsertMemberProfile(
  uid: string,
  email: string,
  input: MemberProfileInput,
) {
  const existingProfile = await getMemberProfile(uid);
  const normalizedName = input.name.trim();

  await setDoc(
    memberDocRef(uid),
    {
      uid,
      email,
      name: normalizedName,
      displayName: normalizedName,
      gender: input.gender,
      dob: input.dob,
      profileCompleted: true,
      createdAt: existingProfile?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  if (auth?.currentUser && normalizedName) {
    await updateProfile(auth.currentUser, { displayName: normalizedName });
  }
}
