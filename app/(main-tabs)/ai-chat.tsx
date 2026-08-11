import { Feather, Ionicons } from "@expo/vector-icons";
import { StatusBar, Alert } from "react-native";
import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { questions, options } from "../../constants/questions";
import dataset from "../../constants/dataset.json";
import { getChatResponse, getFinalSummary, Message, QuestionnaireAnswer } from "../../services/chatbotApi";
import { useAuthContext } from "../../components/AuthContext";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const getLocalSuggestion = (questionText: string, answerText: string): string => {
  try {
    const qMatch = dataset.questionnaire.find(q => q.question === questionText);
    if (qMatch) {
      const answerClean = answerText.split('(')[0].trim();
      const optMatch = qMatch.options.find(
        opt => opt.text.startsWith(answerClean) || answerClean.startsWith(opt.text)
      );
      if (optMatch && optMatch.suggestions && optMatch.suggestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * optMatch.suggestions.length);
        return optMatch.suggestions[randomIndex];
      }
    }
  } catch (error) {
    console.error("Error looking up suggestion locally:", error);
  }
  return "ඔබගේ පිළිතුරට අනුව, ඔබ හොඳින් විවේක ගැනීම වැදගත් බව පෙනේ.";
};

const formatCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12;
  const paddedMinutes = minutes.toString().padStart(2, "0");
  return `${normalizedHours}:${paddedMinutes} ${ampm}`;
};

export default function AiChatPage() {
  const { currentUser } = useAuthContext();
  const [loadingSession, setLoadingSession] = useState(true);
  const [step, setStep] = useState<'welcome' | 'questionnaire' | 'chat' | 'summary'>('welcome');

  // Questionnaire States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answersContext, setAnswersContext] = useState<QuestionnaireAnswer[]>([]);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);

  // Chat States
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "ඔබට තවදුරටත් කතා කිරීමට අවශ්‍ය වෙනත් යමක් තිබේද? (ඔබට අවශ්‍ය නැතිනම් පහළ ඇති බොත්තම ඔබා අවසන් යෝජනා ලබා ගන්න)",
      time: formatCurrentTime(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Summary States
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const currentQuestion = questions[currentQuestionIndex];

  // Load chat session from Firestore (chatbot_sessions collection)
  useEffect(() => {
    async function loadSession() {
      if (!currentUser || !db) {
        setLoadingSession(false);
        return;
      }
      try {
        const sessionRef = doc(db, "chatbot_sessions", currentUser.uid);
        const docSnap = await getDoc(sessionRef);
        if (docSnap.exists()) {
          const session = docSnap.data();
          if (session.step) setStep(session.step);
          if (session.currentQuestionIndex !== undefined) setCurrentQuestionIndex(session.currentQuestionIndex);
          if (session.answersContext) setAnswersContext(session.answersContext);
          if (session.messages) setMessages(session.messages);
          if (session.summary !== undefined) setSummary(session.summary);
        }
      } catch (error) {
        console.error("Failed to load chat session from Firestore:", error);
      } finally {
        setLoadingSession(false);
      }
    }
    loadSession();
  }, [currentUser]);

  // Helper to save chat session to Firestore (chatbot_sessions collection)
  const saveSession = async (updates: {
    step?: 'welcome' | 'questionnaire' | 'chat' | 'summary';
    currentQuestionIndex?: number;
    answersContext?: QuestionnaireAnswer[];
    messages?: Message[];
    summary?: string | null;
  }) => {
    if (!currentUser || !db) return;
    try {
      const sessionRef = doc(db, "chatbot_sessions", currentUser.uid);
      await setDoc(sessionRef, updates, { merge: true });
    } catch (error) {
      console.error("Failed to save chat session to Firestore:", error);
    }
  };

  // Starts the assessment
  const handleStart = () => {
    setCurrentQuestionIndex(0);
    setAnswersContext([]);
    setCurrentSuggestion(null);
    setSelectedOptionId(null);
    const initialMessages: Message[] = [
      {
        id: "welcome",
        sender: "assistant",
        text: "ඔබට තවදුරටත් කතා කිරීමට අවශ්‍ය වෙනත් යමක් තිබේද? (ඔබට අවශ්‍ය නැතිනම් පහළ ඇති බොත්තම ඔබා අවසන් යෝජනා ලබා ගන්න)",
        time: formatCurrentTime(),
      },
    ];
    setMessages(initialMessages);
    setStep('questionnaire');

    void saveSession({
      step: 'questionnaire',
      currentQuestionIndex: 0,
      answersContext: [],
      messages: initialMessages,
      summary: null,
    });
  };

  // Handles questionnaire option click
  const handleOptionSelect = (option: typeof options[0]) => {
    setSelectedOptionId(option.id);
    setLoadingSuggestion(true);
    setCurrentSuggestion(null);

    // Simulate AI generation lag
    setTimeout(() => {
      const suggestion = getLocalSuggestion(currentQuestion.text, option.text);
      setCurrentSuggestion(suggestion);

      const newAnswer: QuestionnaireAnswer = {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer: option.text,
        score: option.id, // option.id is 1 to 5
        suggestions: [suggestion],
      };

      setAnswersContext(prev => {
        // Prevent duplicate answers if they click multiple options before clicking next
        const filtered = prev.filter(ans => ans.questionId !== currentQuestion.id);
        const updated = [...filtered, newAnswer];
        void saveSession({ answersContext: updated });
        return updated;
      });
      setLoadingSuggestion(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }, 600);
  };

  // Navigates to next question or chat
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentSuggestion(null);
      setSelectedOptionId(null);
      void saveSession({ currentQuestionIndex: nextIndex });
      setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true }), 50);
    } else {
      setStep('chat');
      void saveSession({ step: 'chat' });
    }
  };

  // Sends chat message to backend
  const handleSend = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput || isSending) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmedInput,
      time: formatCurrentTime(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");
    setIsSending(true);
    void saveSession({ messages: updatedMessages });
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const responseText = await getChatResponse(trimmedInput, answersContext, updatedMessages);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        time: formatCurrentTime(),
      };
      setMessages(prev => {
        const finalMessages = [...prev, botMsg];
        void saveSession({ messages: finalMessages });
        return finalMessages;
      });
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: `bot-err-${Date.now()}`,
        sender: 'assistant',
        text: "කණගාටුයි, පිළිතුර ලබාගැනීමේදී ගැටලුවක් ඇතිවිය. කරුණාකර පසුව නැවත උත්සාහ කරන්න.",
        time: formatCurrentTime(),
      };
      setMessages(prev => {
        const finalMessages = [...prev, errorMsg];
        void saveSession({ messages: finalMessages });
        return finalMessages;
      });
    } finally {
      setIsSending(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // Triggers recommendations compilation
  const handleFinishChat = async () => {
    setStep('summary');
    setLoadingSummary(true);
    void saveSession({ step: 'summary' });
    try {
      const result = await getFinalSummary(answersContext, messages);
      setSummary(result);
      void saveSession({ summary: result });
    } catch (error) {
      const errorResult = "සාරාංශය ලබාගැනීමේදී දෝෂයක් ඇතිවිය. කරුණාකර නැවත උත්සාහ කරන්න.";
      setSummary(errorResult);
      void saveSession({ summary: errorResult });
    } finally {
      setLoadingSummary(false);
    }
  };

  // Handles starting over / resetting the assessment
  const handleResetAssessment = () => {
    Alert.alert(
      "ඇගයීම නැවත ආරම්භ කරන්නද?",
      "ඔබ දැනට ලබා දී ඇති සියලුම පිළිතුරු සහ චැට් ඉතිහාසය මකා දැමෙනු ඇත.",
      [
        { text: "අවලංගු කරන්න", style: "cancel" },
        { 
          text: "ඔව්, නැවත ආරම්භ කරන්න", 
          style: "destructive",
          onPress: () => {
            setStep('welcome');
            setCurrentQuestionIndex(0);
            setAnswersContext([]);
            setCurrentSuggestion(null);
            setSelectedOptionId(null);
            const initialMessages = [
              {
                id: "welcome",
                sender: "assistant",
                text: "ඔබට තවදුරටත් කතා කිරීමට අවශ්‍ය වෙනත් යමක් තිබේද? (ඔබට අවශ්‍ය නැතිනම් පහළ ඇති බොත්තම ඔබා අවසන් යෝජනා ලබා ගන්න)",
                time: formatCurrentTime(),
              },
            ];
            setMessages(initialMessages);
            setSummary(null);
            void saveSession({
              step: 'welcome',
              currentQuestionIndex: 0,
              answersContext: [],
              messages: initialMessages,
              summary: null,
            });
          }
        }
      ]
    );
  };

  if (loadingSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F2F5F8" translucent={false} />
        <View style={[styles.container, styles.centerWrapper]}>
          <ActivityIndicator size="large" color="#2F88E8" />
          <Text style={{ marginTop: 12, color: "#677489", fontFamily: "Inter", fontSize: 14 }}>
            සංවාදය සකස් කරමින්...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F5F8" translucent={false} />
      <View style={styles.container}>
        
        {/* Header Section */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerLabel}>MINDCARE ASSISTANT</Text>
            <Text style={styles.subHeader}>
              Smart emotional support, tailored to your needs.
            </Text>
          </View>
          <View style={styles.headerActions}>
            {step !== 'welcome' && (
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.8} onPress={handleResetAssessment}>
                <Feather name="rotate-ccw" size={16} color="#E53E3E" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
              <Feather name="star" size={16} color="#4A5665" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
              <Feather name="info" size={16} color="#4A5665" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Screen */}
        {step === 'welcome' && (
          <View style={styles.centerWrapper}>
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeIconWrap}>
                <Ionicons name="chatbubbles-outline" size={48} color="#2F88E8" />
              </View>
              <Text style={styles.welcomeTitle}>ඔබේ මානසික සුවතා සහායක</Text>
              <Text style={styles.welcomeSubtitle}>
                ප්‍රශ්න 10 කින් යුත් සරල මානසික ඇගයීමෙන් අප ආරම්භ කරමු. ඔබ ලබාදෙන සියලුම පිළිතුරු රහසිගතව සුරැකේ.
              </Text>
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleStart}>
                <Text style={styles.primaryButtonText}>ආරම්භ කරන්න (Start)</Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Questionnaire Screen */}
        {step === 'questionnaire' && (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>මානසික සුවතා ඇගයීම</Text>
              <Text style={styles.progressNum}>ප්‍රශ්නය {currentQuestionIndex + 1} / 10</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${((currentQuestionIndex + 1) / 10) * 100}%` }]} />
            </View>

            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{currentQuestion.text}</Text>
            </View>

            <Text style={styles.optionSectionTitle}>ඔබට වඩාත්ම ගැලපෙන පිළිතුර තෝරන්න:</Text>
            <View style={styles.optionsCol}>
              {options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionCard, isSelected && styles.optionCardActive]}
                    activeOpacity={0.85}
                    onPress={() => handleOptionSelect(option)}
                  >
                    <View style={[styles.optionRadio, isSelected && styles.optionRadioActive]}>
                      {isSelected && <View style={styles.optionRadioInner} />}
                    </View>
                    <Text style={[styles.optionCardText, isSelected && styles.optionTextActive]}>
                      {option.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {loadingSuggestion && (
              <View style={styles.suggestionLoadingWrap}>
                <ActivityIndicator size="small" color="#2F88E8" />
                <Text style={styles.suggestionLoadingText}>යෝජනා සකස් කරමින්...</Text>
              </View>
            )}

            {currentSuggestion && !loadingSuggestion && (
              <View style={styles.suggestionBox}>
                <View style={styles.suggestionHeader}>
                  <Feather name="smile" size={14} color="#2F88E8" />
                  <Text style={styles.suggestionTitle}>AI ක්ෂණික උපදෙස (Instant Tip)</Text>
                </View>
                <Text style={styles.suggestionBodyText}>{currentSuggestion}</Text>
                
                <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleNextQuestion}>
                  <Text style={styles.primaryButtonText}>
                    {currentQuestionIndex < questions.length - 1 ? "මීළඟ ප්‍රශ්නය" : "සාකච්ඡාවට යන්න (Chat)"}
                  </Text>
                  <Feather name="chevron-right" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {/* Chat Screen */}
        {step === 'chat' && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          >
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.chatScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.infoAlert}>
                <Feather name="info" size={14} color="#3B5F88" />
                <Text style={styles.infoAlertText}>
                  ඔබට හැඟෙන දේ නිදහසේ ලියා එවන්න. ඔබ සූදානම් වූ පසු පහත බොත්තම ඔබා අවසන් යෝජනා ලබාගන්න.
                </Text>
              </View>

              {messages.map((message) => {
                const isBot = message.sender === 'assistant';
                return (
                  <View key={message.id} style={isBot ? styles.messageRowLeft : styles.messageRowRight}>
                    {isBot && <View style={styles.avatarDot} />}
                    <View style={isBot ? styles.botBubble : styles.userBubble}>
                      <Text style={isBot ? styles.botText : styles.userText}>{message.text}</Text>
                      <Text style={isBot ? styles.timeTextLeft : styles.timeTextRight}>{message.time}</Text>
                    </View>
                  </View>
                );
              })}

              {isTypingIndicatorVisible()}
            </ScrollView>

            <View style={styles.chatInputBar}>
              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.input, { maxHeight: 80 }]}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="ඔබට දැනෙන දේ මෙහි ලියන්න..."
                  placeholderTextColor="#8C96A3"
                  multiline
                  returnKeyType="default"
                />
                <TouchableOpacity
                  style={[styles.sendIconButton, !inputText.trim() && styles.sendIconButtonDisabled]}
                  disabled={!inputText.trim() || isSending}
                  activeOpacity={0.8}
                  onPress={handleSend}
                >
                  <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.finishChatButton} activeOpacity={0.88} onPress={handleFinishChat}>
              <Text style={styles.finishChatButtonText}>සාකච්ඡාව අවසන් කර සම්පූර්ණ යෝජනා ලබා ගන්න</Text>
              <Feather name="check-circle" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        )}

        {/* Summary Screen */}
        {step === 'summary' && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.summaryTitleRow}>
              <Ionicons name="ribbon-outline" size={24} color="#2F88E8" />
              <Text style={styles.summaryHeading}>ඔබේ අවසාන යෝජනා (Top Suggestions)</Text>
            </View>

            <View style={styles.summaryCard}>
              {loadingSummary ? (
                <View style={styles.summaryLoadingWrap}>
                  <ActivityIndicator size="large" color="#2F88E8" />
                  <Text style={styles.summaryLoadingText}>අවසාන යෝජනා සාරාංශය සකස් කරමින්...</Text>
                </View>
              ) : (
                <Text style={styles.summaryBodyText}>{summary}</Text>
              )}
            </View>

            {!loadingSummary && (
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() => {
                  setStep('welcome');
                  void saveSession({
                    step: 'welcome',
                    currentQuestionIndex: 0,
                    answersContext: [],
                    messages: [
                      {
                        id: "welcome",
                        sender: "assistant",
                        text: "ඔබට තවදුරටත් කතා කිරීමට අවශ්‍ය වෙනත් යමක් තිබේද? (ඔබට අවශ්‍ය නැතිනම් පහළ ඇති බොත්තම ඔබා අවසන් යෝජනා ලබා ගන්න)",
                        time: formatCurrentTime(),
                      },
                    ],
                    summary: null,
                  });
                }}
              >
                <Feather name="home" size={16} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>මුල් පිටුවට යන්න</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

      </View>
    </SafeAreaView>
  );

  function isTypingIndicatorVisible() {
    if (isSending) {
      return (
        <View style={styles.messageRowLeft}>
          <View style={styles.avatarDot} />
          <View style={[styles.botBubble, styles.typingBubble]}>
            <ActivityIndicator size="small" color="#3B5F88" />
            <Text style={styles.typingIndicatorText}>Bot සිතමින් පවතී...</Text>
          </View>
        </View>
      );
    }
    return null;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F2F5F8",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLabel: {
    fontFamily: "Inter",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
    color: "#2F3744",
  },
  subHeader: {
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 14,
    color: "#677489",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6EAF0",
  },
  centerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
    shadowColor: "#93A4B8",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  welcomeIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EAF1FB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  welcomeTitle: {
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "800",
    color: "#2F3744",
    textAlign: "center",
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 20,
    color: "#677489",
    textAlign: "center",
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#2F88E8",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  primaryButtonText: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    flexShrink: 1,
    textAlign: "center",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "700",
    color: "#677489",
  },
  progressNum: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "800",
    color: "#2F88E8",
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E2E7ED",
    width: "100%",
    marginBottom: 20,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#2F88E8",
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E6EAF0",
  },
  questionText: {
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 24,
    color: "#2F3744",
    fontWeight: "600",
  },
  optionSectionTitle: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "700",
    color: "#677489",
    marginBottom: 10,
  },
  optionsCol: {
    gap: 8,
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E6EAF0",
  },
  optionCardActive: {
    borderColor: "#D7E7FF",
    backgroundColor: "#F7FBFF",
  },
  optionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#B1B9C4",
    alignItems: "center",
    justifyContent: "center",
  },
  optionRadioActive: {
    borderColor: "#2F88E8",
  },
  optionRadioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#2F88E8",
  },
  optionCardText: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#4A5665",
    fontWeight: "500",
    flex: 1,
  },
  optionTextActive: {
    color: "#2F88E8",
    fontWeight: "700",
  },
  suggestionLoadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  suggestionLoadingText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#677489",
  },
  suggestionBox: {
    backgroundColor: "#EDF5FA",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#C9D9E4",
    gap: 12,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  suggestionTitle: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "700",
    color: "#3B5F88",
  },
  suggestionBodyText: {
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 20,
    color: "#434C58",
    fontWeight: "500",
  },
  keyboardView: {
    flex: 1,
  },
  chatScrollContent: {
    paddingBottom: 24,
    gap: 12,
  },
  infoAlert: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#EAF1FB",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D3E3F8",
    alignItems: "flex-start",
  },
  infoAlertText: {
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 16,
    color: "#3B5F88",
    fontWeight: "500",
    flex: 1,
  },
  messageRowLeft: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginVertical: 4,
    paddingRight: 40,
  },
  messageRowRight: {
    flexDirection: "row",
    alignSelf: "flex-end",
    marginVertical: 4,
    paddingLeft: 40,
  },
  avatarDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#D8E6FF",
    borderWidth: 1,
    borderColor: "#C8D8F5",
  },
  botBubble: {
    backgroundColor: "#EAF1FB",
    borderRadius: 14,
    borderBottomLeftRadius: 2,
    padding: 12,
    maxWidth: "100%",
  },
  botText: {
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: "#3B5F88",
  },
  userBubble: {
    backgroundColor: "#2F88E8",
    borderRadius: 14,
    borderBottomRightRadius: 2,
    padding: 12,
    maxWidth: "100%",
  },
  userText: {
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: "#FFFFFF",
  },
  timeTextLeft: {
    fontFamily: "Inter",
    fontSize: 9,
    color: "#9AA3AF",
    marginTop: 4,
    fontWeight: "500",
  },
  timeTextRight: {
    fontFamily: "Inter",
    fontSize: 9,
    color: "#E2E7ED",
    marginTop: 4,
    fontWeight: "500",
    textAlign: "right",
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typingIndicatorText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#677489",
  },
  chatInputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 10,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D5DCE5",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#2F3744",
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  sendIconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#2F88E8",
    justifyContent: "center",
    alignItems: "center",
  },
  sendIconButtonDisabled: {
    backgroundColor: "#B1B9C4",
  },
  finishChatButton: {
    backgroundColor: "#1ABC9C",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
    width: "100%",
  },
  finishChatButtonText: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    flexShrink: 1,
    textAlign: "center",
  },
  summaryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  summaryHeading: {
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "800",
    color: "#2F3744",
    flex: 1,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    marginBottom: 20,
    minHeight: 160,
  },
  summaryBodyText: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 22,
    color: "#4A5665",
  },
  summaryLoadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
  },
  summaryLoadingText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#677489",
  },
});
