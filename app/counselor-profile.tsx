import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCounselorProfile, upsertCounselorProfile } from "@/lib/counselors";
import { auth, storage } from "@/lib/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

const MAX_BIO_LENGTH = 500;

const SPECIALTY_OPTIONS = [
  "Clinical Psychology",
  "Counseling Psychology",
  "Child and Adolescent Therapy",
  "Marriage and Family Therapy",
  "Trauma Therapy",
  "Addiction Counseling",
];

const COMMON_QUALIFICATIONS = [
  "PhD Psychology",
  "MSc Clinical Psychology",
  "MA Counseling Psychology",
  "Licensed Clinical Social Worker",
  "Licensed Professional Counselor",
  "Certified CBT Therapist",
];

const COMMON_RESEARCH_STUDIES = [
  "Counselling for Stress and Anxiety in Young Adults",
  "Reducing Stress and Anxiety through Counselling",
  "Effectiveness of CBT for Depression",
  "Mindfulness-Based Therapy for Chronic Stress",
  "Trauma Recovery Outcomes in Adolescents",
];

const SALUTATIONS = ["Mr", "Mrs", "Ms"] as const;

const normalizeSalutation = (value: string): string => {
  const compactValue = value.replace(/\./g, "").trim().toLowerCase();
  const match = SALUTATIONS.find((item) => item.toLowerCase() === compactValue);
  return match ?? "";
};

const splitDisplayName = (
  value: string,
): { salutation: string; name: string } => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return { salutation: "", name: "" };

  const match = trimmedValue.match(/^(mr|mrs|ms)\.?\s+(.+)$/i);
  if (!match) return { salutation: "", name: trimmedValue };

  const parsedSalutation = normalizeSalutation(match[1] ?? "");
  const parsedName = (match[2] ?? "").trim();
  return { salutation: parsedSalutation, name: parsedName };
};

const deriveNameFromEmail = (email: string) => {
  const localPart = email.split("@")[0] ?? "";
  if (!localPart) return "";
  return localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
};

export default function CounselorProfileScreen() {
  const currentUser = auth?.currentUser;
  const fallbackName = deriveNameFromEmail(currentUser?.email ?? "");
  const initialNameParts = splitDisplayName(currentUser?.displayName ?? fallbackName);
  const initialName = initialNameParts.name;
  const initialSalutation = initialNameParts.salutation || "Mr";

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [salutation, setSalutation] = useState(initialSalutation);
  const [showSalutations, setShowSalutations] = useState(false);

  const [fullName, setFullName] = useState(initialName);
  const [specialty, setSpecialty] = useState("");
  const [showSpecialties, setShowSpecialties] = useState(false);

  const [qualifications, setQualifications] = useState<string[]>([]);
  const [qualificationInputVisible, setQualificationInputVisible] =
    useState(false);
  const [qualificationDraft, setQualificationDraft] = useState("");

  const [researchStudies, setResearchStudies] = useState<string[]>([]);
  const [researchInputVisible, setResearchInputVisible] = useState(false);
  const [researchDraft, setResearchDraft] = useState("");

  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState({
    salutation: initialSalutation,
    fullName: initialName,
    specialty: "",
    qualifications: [] as string[],
    researchStudies: [] as string[],
    bio: "",
    avatarUrl: "",
  });

  useEffect(() => {
    if (!currentUser) {
      router.replace("/counselor-login");
      return;
    }

    const hydrateProfile = async () => {
      const profile = await getCounselorProfile(currentUser.uid);
      if (!profile) {
        return;
      }

      setSalutation(profile.salutation || initialSalutation);
      setFullName(profile.fullName || initialName);
      setSpecialty(profile.specialty || "");
      setQualifications(profile.qualifications || []);
      setResearchStudies(profile.researchStudies || []);
      setBio(profile.bio || "");
      if (profile.avatarUrl) {
        setAvatarUri(profile.avatarUrl);
      }
      setInitialSnapshot({
        salutation: profile.salutation || initialSalutation,
        fullName: profile.fullName || initialName,
        specialty: profile.specialty || "",
        qualifications: profile.qualifications || [],
        researchStudies: profile.researchStudies || [],
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || "",
      });
    };

    void hydrateProfile();
  }, [currentUser, initialName, initialSalutation]);

  const qualificationSuggestions = useMemo(() => {
    const normalizedDraft = qualificationDraft.trim().toLowerCase();
    return COMMON_QUALIFICATIONS.filter((item) => {
      const notAdded = !qualifications.includes(item);
      const matches =
        !normalizedDraft || item.toLowerCase().includes(normalizedDraft);
      return notAdded && matches;
    }).slice(0, 4);
  }, [qualificationDraft, qualifications]);

  const researchSuggestions = useMemo(() => {
    const normalizedDraft = researchDraft.trim().toLowerCase();
    return COMMON_RESEARCH_STUDIES.filter((item) => {
      const notAdded = !researchStudies.includes(item);
      const matches =
        !normalizedDraft || item.toLowerCase().includes(normalizedDraft);
      return notAdded && matches;
    }).slice(0, 4);
  }, [researchDraft, researchStudies]);

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Needed",
        "Please allow photo library access to select an image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
      if (result.assets[0].base64) {
        setAvatarBase64(result.assets[0].base64);
      }
      void Haptics.selectionAsync();
    }
  };

  const capturePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Needed",
        "Please allow camera access to take a photo.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
      if (result.assets[0].base64) {
        setAvatarBase64(result.assets[0].base64);
      }
      void Haptics.selectionAsync();
    }
  };

  const handlePhotoAction = () => {
    Alert.alert("Profile Photo", "Choose an option", [
      { text: "Take Photo", onPress: () => void capturePhoto() },
      { text: "Choose from Device", onPress: () => void pickFromGallery() },
      ...(avatarUri
        ? [
            {
              text: "Remove Photo",
              style: "destructive" as const,
              onPress: () => {
                setAvatarUri(null);
                setAvatarBase64(null);
                void Haptics.selectionAsync();
              },
            },
          ]
        : []),
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const addQualification = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || qualifications.includes(trimmed)) return;
    setQualifications((current) => [...current, trimmed]);
    setQualificationDraft("");
    void Haptics.selectionAsync();
  };

  const addResearchStudy = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || researchStudies.includes(trimmed)) return;
    setResearchStudies((current) => [...current, trimmed]);
    setResearchDraft("");
    void Haptics.selectionAsync();
  };

  const removeQualification = (value: string) => {
    setQualifications((current) => current.filter((item) => item !== value));
    void Haptics.selectionAsync();
  };

  const removeResearchStudy = (value: string) => {
    setResearchStudies((current) => current.filter((item) => item !== value));
    void Haptics.selectionAsync();
  };

  const saveProfile = async (navigateToDashboard: boolean) => {
    const parsedName = splitDisplayName(fullName);
    const normalizedName = parsedName.name.trim();

    if (!normalizeSalutation(salutation)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Missing Title", "Please select Mr/Mrs/Ms before your name.");
      return;
    }
    if (!normalizedName) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Missing Name", "Please enter your full name.");
      return;
    }
    if (!specialty.trim()) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Select Specialty", "Please select your specialty.");
      return;
    }

    if (!currentUser) {
      Alert.alert("Session Expired", "Please sign in again.");
      router.replace("/counselor-login");
      return;
    }

    try {
      setIsSaving(true);

      let uploadedAvatarUrl = avatarUri || "";

      if (avatarBase64) {
        uploadedAvatarUrl = `data:image/jpeg;base64,${avatarBase64}`;
        setAvatarBase64(null); // Reset base64 after successful save
      }

      const savedProfile = await upsertCounselorProfile(currentUser.uid, {
        salutation: normalizeSalutation(salutation) || "Mr",
        fullName: normalizedName,
        specialty: specialty.trim(),
        qualifications,
        researchStudies,
        bio: bio.trim(),
        avatarUrl: uploadedAvatarUrl,
      });

      if (savedProfile.avatarUrl) {
        setAvatarUri(savedProfile.avatarUrl);
      }

      setFullName(savedProfile.fullName);
      setInitialSnapshot({
        salutation: savedProfile.salutation,
        fullName: savedProfile.fullName,
        specialty: savedProfile.specialty,
        qualifications: savedProfile.qualifications,
        researchStudies: savedProfile.researchStudies,
        bio: savedProfile.bio,
        avatarUrl: savedProfile.avatarUrl || "",
      });

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (navigateToDashboard) {
        router.replace("/(counselor-tabs)/overview");
        return;
      }

      Alert.alert("Profile Saved", "Your counselor profile was saved to Firebase.");
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Save Failed",
        error instanceof Error && error.message
          ? error.message
          : "Unable to save your profile right now."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    void saveProfile(false);
  };

  const handleUpdateProfile = () => {
    void saveProfile(true);
  };

  const clearAllDetails = () => {
    setAvatarUri(initialSnapshot.avatarUrl || null);
    setAvatarBase64(null);
    setSalutation(initialSnapshot.salutation);
    setShowSalutations(false);
    setFullName(initialSnapshot.fullName);
    setSpecialty(initialSnapshot.specialty);
    setShowSpecialties(false);
    setQualifications(initialSnapshot.qualifications);
    setQualificationDraft("");
    setQualificationInputVisible(false);
    setResearchStudies(initialSnapshot.researchStudies);
    setResearchDraft("");
    setResearchInputVisible(false);
    setBio(initialSnapshot.bio);
  };

  const handleDiscardChanges = () => {
    Alert.alert(
      "Discard Changes?",
      "This will remove all entered details. Do you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            clearAllDetails();
            void Haptics.selectionAsync();
            Alert.alert("Discarded", "All entered details were removed.");
          },
        },
      ],
    );
  };

  const bioCharacterCount = bio.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>EDIT PROFILE</Text>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabledAction]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Ionicons name="save" size={22} color="#111B2E" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerDivider} />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
              <TouchableOpacity
                style={styles.cameraBadge}
                activeOpacity={0.85}
                onPress={handlePhotoAction}
              >
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.fieldLabel}>
            <Feather name="user" size={18} color="#7A8393" /> Full Name
          </Text>
          <View style={styles.nameCard}>
            <TouchableOpacity
              style={styles.salutationPill}
              activeOpacity={0.85}
              onPress={() => {
                setShowSalutations((prev) => !prev);
                void Haptics.selectionAsync();
              }}
            >
              <Text style={styles.salutationText}>{salutation}</Text>
              <Feather name="chevron-down" size={14} color="#6F7784" />
            </TouchableOpacity>
            <TextInput
              style={styles.nameInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="#7E8797"
            />
          </View>

          <Text style={styles.fieldLabel}>
            <Feather name="briefcase" size={18} color="#7A8393" /> Specialty
          </Text>
          <TouchableOpacity
            style={styles.selectCard}
            activeOpacity={0.85}
            onPress={() => {
              setShowSalutations(false);
              setShowSpecialties((prev) => !prev);
              void Haptics.selectionAsync();
            }}
          >
            <View style={styles.selectLeft}>
              <Ionicons
                name={
                  specialty ? "checkmark-circle-outline" : "ellipse-outline"
                }
                size={24}
                color={specialty ? "#2F88E8" : "#8A93A3"}
              />
              <Text
                style={[
                  styles.selectText,
                  !specialty && styles.selectPlaceholder,
                ]}
              >
                {specialty || "Select specialty"}
              </Text>
            </View>
            <Feather name="chevron-down" size={24} color="#6F7784" />
          </TouchableOpacity>
          {showSpecialties && (
            <View style={styles.dropdownPanel}>
              {SPECIALTY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownItem}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSpecialty(option);
                    setShowSpecialties(false);
                    void Haptics.selectionAsync();
                  }}
                >
                  <Text style={styles.dropdownItemText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.fieldLabel}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#7A8393"
            />{" "}
            Qualifications
          </Text>
          {qualifications.length > 0 && (
            <View style={styles.chipsWrap}>
              {qualifications.map((item) => (
                <View key={item} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => removeQualification(item)}
                  >
                    <Feather name="x" size={18} color="#1D4E89" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.addCard}
            activeOpacity={0.85}
            onPress={() => {
              setQualificationInputVisible(true);
              void Haptics.selectionAsync();
            }}
          >
            <Feather name="plus" size={22} color="#747E8C" />
            <Text style={styles.addText}>Add a certification...</Text>
          </TouchableOpacity>
          {qualificationInputVisible && (
            <View style={styles.entryPanel}>
              <View style={styles.entryInputRow}>
                <TextInput
                  style={styles.entryInput}
                  value={qualificationDraft}
                  onChangeText={setQualificationDraft}
                  placeholder="Type a certification"
                  placeholderTextColor="#8A93A3"
                  onSubmitEditing={() => addQualification(qualificationDraft)}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.entryAddButton}
                  activeOpacity={0.85}
                  onPress={() => addQualification(qualificationDraft)}
                >
                  <Text style={styles.entryAddText}>Add</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.suggestionWrap}>
                {qualificationSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.suggestionChip}
                    activeOpacity={0.85}
                    onPress={() => addQualification(item)}
                  >
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.fieldLabel}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#7A8393"
            />{" "}
            Research Studies
          </Text>
          {researchStudies.length > 0 && (
            <View style={styles.chipsWrap}>
              {researchStudies.map((item) => (
                <View key={item} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => removeResearchStudy(item)}
                  >
                    <Feather name="x" size={18} color="#1D4E89" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.addCard}
            activeOpacity={0.85}
            onPress={() => {
              setResearchInputVisible(true);
              void Haptics.selectionAsync();
            }}
          >
            <Feather name="plus" size={22} color="#747E8C" />
            <Text style={styles.addText}>Add a Research Study...</Text>
          </TouchableOpacity>
          {researchInputVisible && (
            <View style={styles.entryPanel}>
              <View style={styles.entryInputRow}>
                <TextInput
                  style={styles.entryInput}
                  value={researchDraft}
                  onChangeText={setResearchDraft}
                  placeholder="Type a research study"
                  placeholderTextColor="#8A93A3"
                  onSubmitEditing={() => addResearchStudy(researchDraft)}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.entryAddButton}
                  activeOpacity={0.85}
                  onPress={() => addResearchStudy(researchDraft)}
                >
                  <Text style={styles.entryAddText}>Add</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.suggestionWrap}>
                {researchSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.suggestionChip}
                    activeOpacity={0.85}
                    onPress={() => addResearchStudy(item)}
                  >
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.fieldLabel}>
            <Ionicons name="document-text-outline" size={18} color="#7A8393" />{" "}
            Professional Bio
          </Text>
          <View style={styles.bioCard}>
            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={(value) => setBio(value.slice(0, MAX_BIO_LENGTH))}
              multiline
              textAlignVertical="top"
              placeholder="Write your professional bio..."
              placeholderTextColor="#8A93A3"
            />
            <Text style={styles.bioCounter}>
              {bioCharacterCount} / {MAX_BIO_LENGTH}
            </Text>
          </View>
          <Text style={styles.bioNote}>
            This bio will be visible to potential patients in the directory.
          </Text>

          <TouchableOpacity
            style={[styles.updateButton, isSaving && styles.disabledAction]}
            activeOpacity={0.9}
            onPress={handleUpdateProfile}
            disabled={isSaving}
          >
            <Text style={styles.updateText}>
              {isSaving ? "Saving..." : "Update Profile"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.discardButton}
            activeOpacity={0.85}
            onPress={handleDiscardChanges}
          >
            <Text style={styles.discardText}>Discard Changes</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={showSalutations}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSalutations(false)}
        >
          <Pressable
            style={styles.salutationModalBackdrop}
            onPress={() => setShowSalutations(false)}
          >
            <Pressable style={styles.salutationModalCard} onPress={() => {}}>
              <Text style={styles.salutationModalTitle}>Select Title</Text>
              <Text style={styles.salutationModalSubtitle}>
                Choose your title
              </Text>

              {SALUTATIONS.map((item) => {
                const isSelected = salutation === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={styles.salutationModalOption}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSalutation(item);
                      setShowSalutations(false);
                      void Haptics.selectionAsync();
                    }}
                  >
                    <Text
                      style={[
                        styles.salutationModalOptionText,
                        isSelected && styles.salutationModalOptionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.salutationModalCancel}
                activeOpacity={0.85}
                onPress={() => setShowSalutations(false)}
              >
                <Text style={styles.salutationModalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F5F8",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F3F5F8",
  },
  header: {
    paddingHorizontal: 18,
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSpacer: {
    width: 28,
  },
  headerTitle: {
    fontFamily: "Inter",
    fontSize: 18,
    lineHeight: 22,
    color: "#131A2C",
    fontWeight: "800",
  },
  saveButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledAction: {
    opacity: 0.6,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#DEE2E9",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 120,
    gap: 14,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  avatarWrap: {
    width: 170,
    height: 170,
  },
  avatar: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 3,
    borderColor: "#F4F6FA",
  },
  avatarPlaceholder: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: "#D6DBE4",
    backgroundColor: "#F3F5F8",
  },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 10,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#3A83EC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#F3F5F8",
  },
  fieldLabel: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 19,
    color: "#6E7788",
    fontWeight: "600",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameCard: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D6DBE4",
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  salutationPill: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D0D8E4",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  salutationText: {
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 16,
    color: "#354052",
    fontWeight: "700",
  },
  nameInput: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 16,
    lineHeight: 22,
    color: "#1F2735",
    fontWeight: "600",
  },
  selectCard: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D6DBE4",
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectText: {
    fontFamily: "Inter",
    fontSize: 16,
    lineHeight: 22,
    color: "#1F2735",
    fontWeight: "600",
  },
  selectPlaceholder: {
    color: "#8A93A3",
    fontWeight: "500",
  },
  dropdownPanel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D6DBE4",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  salutationModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 27, 46, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  salutationModalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },
  salutationModalTitle: {
    fontFamily: "Inter",
    fontSize: 18,
    lineHeight: 22,
    color: "#1A2231",
    fontWeight: "800",
  },
  salutationModalSubtitle: {
    marginTop: 4,
    marginBottom: 12,
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 18,
    color: "#6E7788",
    fontWeight: "500",
  },
  salutationModalOption: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  salutationModalOptionText: {
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 20,
    color: "#354052",
    fontWeight: "600",
  },
  salutationModalOptionTextSelected: {
    color: "#2F88E8",
  },
  salutationModalCancel: {
    marginTop: 8,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D6DBE4",
    justifyContent: "center",
    alignItems: "center",
  },
  salutationModalCancelText: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 18,
    color: "#5E6777",
    fontWeight: "600",
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },
  dropdownItemText: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 18,
    color: "#354052",
    fontWeight: "500",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: "#E7F1FE",
    borderWidth: 1,
    borderColor: "#CFE2FB",
    paddingHorizontal: 18,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipText: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 18,
    color: "#1D4E89",
    fontWeight: "500",
  },
  addCard: {
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#CBD2DD",
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F4F6F9",
  },
  addText: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 18,
    color: "#6F7785",
    fontWeight: "500",
  },
  entryPanel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7DEE8",
    backgroundColor: "#FFFFFF",
    padding: 10,
    gap: 10,
  },
  entryInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  entryInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: "#D7DEE8",
    borderRadius: 12,
    paddingHorizontal: 12,
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 18,
    color: "#2D3748",
  },
  entryAddButton: {
    height: 42,
    borderRadius: 12,
    backgroundColor: "#2F88E8",
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  entryAddText: {
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 16,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  suggestionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BDD8FA",
    backgroundColor: "#F1F7FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionText: {
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 15,
    color: "#2B6CB0",
    fontWeight: "600",
  },
  bioCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D6DBE4",
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    minHeight: 170,
  },
  bioInput: {
    minHeight: 116,
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 22,
    color: "#252D3A",
    fontWeight: "400",
  },
  bioCounter: {
    alignSelf: "flex-end",
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 16,
    color: "#758091",
    fontWeight: "500",
  },
  bioNote: {
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 18,
    color: "#8A93A3",
    fontWeight: "500",
  },
  updateButton: {
    marginTop: 6,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#2F88E8",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2F88E8",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  updateText: {
    fontFamily: "Inter",
    fontSize: 16,
    lineHeight: 20,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  discardButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    marginBottom: 8,
  },
  discardText: {
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 19,
    color: "#E34B4B",
    fontWeight: "500",
  },
});
