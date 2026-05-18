import { Tabs } from 'expo-router';
import { NTabBar } from '@/components/chrome/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <NTabBar {...props} />}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="services" />
      <Tabs.Screen name="idoc" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
