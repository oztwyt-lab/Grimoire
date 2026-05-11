import { Stack } from 'expo-router';

export default function CookLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#16213e' },
      }}
    />
  );
}
