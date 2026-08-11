import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Resolve host IP dynamically for physical devices on the same local network
// Resolve host IP dynamically for physical devices on the same local network
const getHostIP = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }
  // Fallback to computer's local network IP for testing standalone builds
  return '10.181.103.12';
};

// Production backend hosted on Hugging Face Spaces
const BASE_URL = "https://tharushatheekshana-mindcare-backend.hf.space";
// const BASE_URL = `http://${getHostIP()}:5000`; // Local development fallback

export type Message = {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  time: string;
};

export interface QuestionnaireAnswer {
  questionId: number;
  question: string;
  answer: string;
  score: number;
  suggestions: string[];
}

export const getChatResponse = async (
  chatMessage: string,
  questionnaireContext: QuestionnaireAnswer[],
  chatHistory: Message[]
): Promise<string> => {
  try {
    const formattedHistory = chatHistory.map(m => ({
      sender: m.sender === 'user' ? 'user' : 'bot',
      text: m.text
    }));
    
    // Add current user message
    const historySnapshot = [...formattedHistory, { sender: 'user', text: chatMessage }];

    const formattedContext = questionnaireContext.map(q => ({
      questionId: q.questionId,
      question: q.question,
      answer: q.answer,
      score: q.score,
      suggestions: q.suggestions
    }));

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: chatMessage,
        contextHistory: formattedContext,
        chatHistory: historySnapshot,
        use_local_model: false // Connect to Gemini on backend
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.reply || "තාක්ෂණික දෝෂයකි.";
  } catch (error) {
    console.error("Chat response API error:", error);
    return "ජාල දෝෂයකි. කරුණාකර නැවත උත්සාහ කරන්න.";
  }
};

export const getFinalSummary = async (
  questionnaireContext: QuestionnaireAnswer[],
  chatHistory: Message[]
): Promise<string> => {
  try {
    const formattedContext = questionnaireContext.map(q => ({
      questionId: q.questionId,
      question: q.question,
      answer: q.answer,
      score: q.score,
      suggestions: q.suggestions
    }));

    const formattedHistory = chatHistory.map(m => ({
      sender: m.sender === 'user' ? 'user' : 'bot',
      text: m.text
    }));

    const response = await fetch(`${BASE_URL}/api/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        answers: formattedContext,
        chatHistory: formattedHistory
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    let filtered: string[] = data.suggestions || [];
    
    // Add urgent hotline if score was 5 anywhere
    const maxScore = Math.max(...formattedContext.map(c => c.score), 0);
    if (maxScore === 5 && !filtered.some(s => s.includes("1926"))) {
      filtered.unshift("🚨 කරුණාකර හැකි ඉක්මනින් මනෝවිද්‍යා උපදේශකයෙකුගේ සහාය ලබා ගන්න හෝ 1926 (ජාතික මානසික සෞඛ්‍ය උපකාරක සේවය) වෙත අමතන්න.");
    }

    // Format suggestions as list
    if (filtered.length > 0) {
      return filtered.map((s, idx) => `${idx + 1}. ${s}`).join('\n\n');
    }
    
    return "යෝජනා කිසිවක් හමු නොවීය.";
  } catch (error) {
    console.error("Final summary API error:", error);
    return "සම්පූර්ණ සංවාදයට අනුව මාගේ ප්‍රධාන යෝජනා:\n\n1. දිනපතා පැය 7-8 ක නින්දක් ලබා ගැනීමට උත්සාහ කරන්න.\n2. අධික පීඩනය හෝ කලබලකාරී බවක් දැනෙන සෑම අවස්ථාවකදීම ගැඹුරු හුස්ම ගැනීමේ ව්‍යායාම කරන්න.\n3. සිතට වද දෙන සිතුවිලි ඇත්නම් එය විශ්වාසවන්ත අයෙකු සමග බෙදා ගන්න.\n4. ඔබට තවදුරටත් මෙම අපහසුතා පවතී නම් වෘත්තීය මනෝවිද්‍යා උපදේශනයක් (Counseling) ලබා ගැනීමට පසුබට නොවන්න.";
  }
};
