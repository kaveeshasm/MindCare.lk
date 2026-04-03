import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AiChatPage() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>MINDEASE ASSISTANT</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
                <Feather name="star" size={14} color="#4A5665" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
                <Feather name="phone" size={14} color="#4A5665" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.alertBar}>
            <View style={styles.alertLeft}>
              <Feather name="alert-circle" size={12} color="#D0677C" />
              <Text style={styles.alertText}>HIGH SUPPORT ACTIVE</Text>
            </View>
            <TouchableOpacity style={styles.sosButton} activeOpacity={0.85}>
              <Text style={styles.sosText}>SOS Mode</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.helperBubble}>
            <Text style={styles.helperText}>I&apos;m here to listen and help you through your day.</Text>
          </View>

          <View style={styles.messageRowLeft}>
            <View style={styles.avatarDot} />
            <View>
              <View style={styles.botBubble}>
                <Text style={styles.botText}>Hello! I&apos;m your MindEase assistant. How are you feeling today?</Text>
              </View>
              <Text style={styles.timeText}>10:00 AM</Text>
            </View>
          </View>

          <View style={styles.messageRowRight}>
            <View>
              <View style={styles.userBubble}>
                <Text style={styles.userText}>I&apos;ve been feeling a bit overwhelmed with work lately.</Text>
              </View>
              <Text style={styles.timeRight}>10:01 AM</Text>
            </View>
          </View>

          <View style={styles.messageRowLeft}>
            <View style={styles.avatarDot} />
            <View>
              <View style={styles.botBubble}>
                <Text style={styles.botText}>
                  I&apos;m sorry to hear that. It&apos;s completely normal to feel that way. Would you like to try a
                  2-minute breathing exercise or talk more about it?
                </Text>
              </View>
              <Text style={styles.timeText}>10:02 AM</Text>
            </View>
          </View>

          <View style={styles.messageRowRight}>
            <View>
              <View style={styles.userBubble}>
                <Text style={styles.userText}>Maybe a breathing exercise would help. I can&apos;t seem to focus.</Text>
              </View>
              <Text style={styles.timeRight}>10:05 AM</Text>
            </View>
          </View>

          <View style={styles.messageRowLeft}>
            <View style={styles.avatarDot} />
            <View style={styles.typingBubble}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickChip} activeOpacity={0.85}>
              <Text style={styles.quickChipText}>Deep Breath</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickChip} activeOpacity={0.85}>
              <Text style={styles.quickChipText}>Anxiety Tip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickChip} activeOpacity={0.85}>
              <Text style={styles.quickChipText}>Log Mood</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickChip} activeOpacity={0.85}>
              <Text style={styles.quickChipText}>Find Help</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.clipButton} activeOpacity={0.85}>
            <Feather name="paperclip" size={18} color="#687382" />
          </TouchableOpacity>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="How can I help you today?"
              placeholderTextColor="#8C96A3"
            />
            <Feather name="mic" size={15} color="#98A2AE" />
          </View>
          <TouchableOpacity style={styles.sendButton} activeOpacity={0.88}>
            <Ionicons name="paper-plane-outline" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F5F8',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 130,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'Inter',
    flex: 1,
    textAlign: 'center',
    marginLeft: 34,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    color: '#2F3744',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBar: {
    marginTop: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0CCD6',
    backgroundColor: '#FAEEF2',
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertText: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 12,
    color: '#D0677C',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sosButton: {
    backgroundColor: '#E47A8C',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sosText: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  helperBubble: {
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9DFE8',
    backgroundColor: '#F6F8FB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 6,
  },
  helperText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 15,
    color: '#8A95A3',
    fontStyle: 'italic',
  },
  messageRowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  messageRowRight: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  avatarDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D8E6FF',
    borderWidth: 1,
    borderColor: '#C8D8F5',
  },
  botBubble: {
    maxWidth: 240,
    borderRadius: 12,
    backgroundColor: '#DDE7F3',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  botText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 17,
    color: '#50719C',
    fontWeight: '600',
  },
  userBubble: {
    maxWidth: 225,
    borderRadius: 12,
    backgroundColor: '#2F88E8',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 17,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeText: {
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 11,
    color: '#9AA3AF',
    fontWeight: '600',
  },
  timeRight: {
    marginTop: 4,
    textAlign: 'right',
    marginRight: 4,
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 11,
    color: '#9AA3AF',
    fontWeight: '600',
  },
  typingBubble: {
    borderRadius: 12,
    backgroundColor: '#E4EAF2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9AA6B5',
  },
  quickActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7DEE7',
    backgroundColor: '#F7F9FC',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickChipText: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#5E6877',
    fontWeight: '700',
  },
  inputBar: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clipButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DCE5',
    backgroundColor: '#F4F7FB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 18,
    color: '#46505D',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
