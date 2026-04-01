import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function MainTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 62,
          borderTopWidth: 1,
          borderTopColor: '#ECECEC',
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 6,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          minWidth: 60,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 11,
          lineHeight: 14,
          fontWeight: '500',
          marginTop: 3,
        },
        tabBarActiveTintColor: '#30353B',
        tabBarInactiveTintColor: '#8E969F',
        sceneStyle: {
          backgroundColor: '#FFFFFF',
        },
        tabBarIcon: ({ color }) => {
          if (route.name === 'home') {
            return <Feather name="home" size={16} color={color} />;
          }
          if (route.name === 'ai-chat') {
            return <Feather name="message-square" size={16} color={color} />;
          }
          if (route.name === 'counselors') {
            return <Feather name="users" size={16} color={color} />;
          }

          return <Feather name="user" size={16} color={color} />;
        },
      })}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="ai-chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="counselors" options={{ title: 'Counselors' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
