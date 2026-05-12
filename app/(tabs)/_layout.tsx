import { Tabs } from 'expo-router';
import { Image } from 'react-native';

const TAB_ICON_SIZE = 24;
const TAB_ACTIVE_COLOR = '#c8a84b';
const TAB_INACTIVE_COLOR = '#8888aa';

const TAB_ICONS = {
  grimoire: require('../../assets/icons/ui/book.png'),
  inventory: require('../../assets/icons/ui/bag.png'),
  character: require('../../assets/icons/ui/hat.png'),
  nutrition: require('../../assets/candidates/openart/discovered/food_icons/food_apple.png'),
};

function TabIcon({ source, color }: { source: number; color: string }) {
  return (
    <Image
      source={source}
      style={{ width: TAB_ICON_SIZE, height: TAB_ICON_SIZE, tintColor: color }}
      resizeMode="contain"
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        animation: 'fade',
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="inventory"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon source={TAB_ICONS.inventory} color={focused ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR} />
          ),
        }}
      />
      <Tabs.Screen
        name="character"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon source={TAB_ICONS.character} color={focused ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon source={TAB_ICONS.nutrition} color={focused ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR} />
          ),
        }}
      />
    </Tabs>
  );
}
