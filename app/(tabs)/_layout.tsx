import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1D9E75',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0.5,
          borderTopColor: '#eeeeee',
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <TabIcon symbol="🏠" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prescription"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="wound"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="checkin"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="doctor"
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22, color }}>{symbol}</Text>;
}
