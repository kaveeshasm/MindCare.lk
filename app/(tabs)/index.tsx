import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type JoinCard = {
  id: 'member' | 'counselor';
  title: string;
  subtitle: string;
  icon: string;
};

const joinCards: JoinCard[] = [
  {
    id: 'member',
    title: 'Member',
    subtitle: 'Seeking support & wellness',
    icon: 'heart',
  },
  {
    id: 'counselor',
    title: 'Counselor',
    subtitle: 'Providing expert care',
    icon: 'stethoscope',
  },
];

export default function RoleSelectionScreen() {
  const handlePressCard = (id: JoinCard['id']) => {
    void Haptics.selectionAsync();
    if (id === 'counselor') {
      router.push('/counselor-register');
      return;
    }
    router.replace('/home');
  };

  const handleSignIn = () => {
    void Haptics.selectionAsync();
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to MindCare</Text>
        <Text style={styles.subtitle}>Your journey to mental wellness starts here</Text>
        <Text style={styles.joinPrompt}>I want to join as a</Text>

        {joinCards.map((card) => (
          <TouchableOpacity key={card.id} style={styles.card} activeOpacity={0.9} onPress={() => handlePressCard(card.id)}>
            <View style={styles.iconWrap}>
              {card.id === 'member' ? (
                <Ionicons name={card.icon as 'heart'} size={42} color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons
                  name={card.icon as 'stethoscope'}
                  size={44}
                  color="#FFFFFF"
                />
              )}
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Already have an account?</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={handleSignIn}>
            <Text style={styles.bottomLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2F88E8',
  },
  container: {
    flex: 1,
    backgroundColor: '#2F88E8',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 30,
  },
  title: {
    fontFamily: 'Inter',
    textAlign: 'center',
    fontSize: 54,
    lineHeight: 62,
    color: '#FFFFFF',
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.20)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  subtitle: {
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#E5EEFB',
    fontWeight: '500',
  },
  joinPrompt: {
    marginTop: 20,
    marginBottom: 18,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 20,
    lineHeight: 26,
    color: '#FFFFFF',
    fontStyle: 'italic',
    fontWeight: '700',
  },
  card: {
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#123D6A',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 22,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'Inter',
    fontSize: 24,
    lineHeight: 30,
    color: '#0D1116',
    fontWeight: '800',
  },
  cardSubtitle: {
    marginTop: 8,
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 19,
    color: '#7D7D7D',
    fontWeight: '500',
  },
  bottomRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  bottomText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    color: '#E9F1FD',
    fontWeight: '500',
  },
  bottomLink: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
