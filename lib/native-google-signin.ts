type NativeGoogleTokens = {
  idToken?: string;
  accessToken?: string;
};

let isConfigured = false;
let googleSigninModulePromise: Promise<
  typeof import("@react-native-google-signin/google-signin")
> | null = null;

async function loadGoogleSigninModule() {
  if (!googleSigninModulePromise) {
    googleSigninModulePromise =
      import("@react-native-google-signin/google-signin");
  }

  return googleSigninModulePromise;
}

async function configureGoogleSignIn() {
  if (isConfigured) {
    return;
  }

  const { GoogleSignin } = await loadGoogleSigninModule();

  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
  });

  isConfigured = true;
}

export async function signInWithNativeGoogle(): Promise<NativeGoogleTokens | null> {
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } =
    await loadGoogleSigninModule();

  await configureGoogleSignIn();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Force showing account chooser prompt by signing out the cached Google session first
    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore if user was not already signed in
    }

    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return null;
    }

    const fromProfileIdToken = response.data.idToken ?? undefined;
    let accessToken: string | undefined;
    let tokensIdToken: string | undefined;

    try {
      const tokens = await GoogleSignin.getTokens();
      accessToken = tokens.accessToken;
      tokensIdToken = tokens.idToken;
    } catch {
      // If token fetch fails, continue with any idToken returned from signIn.
    }

    const idToken = fromProfileIdToken ?? tokensIdToken;

    if (!idToken && !accessToken) {
      throw new Error("Google sign-in did not return authentication tokens.");
    }

    return { idToken, accessToken };
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return null;
      }

      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error(
          "Google Play Services is unavailable or outdated on this device.",
        );
      }

      if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error("Google sign-in is already in progress.");
      }
    }

    if (error instanceof Error && error.message) {
      throw error;
    }

    throw new Error("Unable to sign in with Google right now.");
  }
}
