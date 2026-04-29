import { AuthProvider } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { InventoryProvider } from '../src/context/InventoryContext';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, Component, ReactNode } from 'react';
import { Stack } from 'expo-router';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  componentDidCatch(e: Error, info: { componentStack: string }) { console.error(e, info.componentStack); }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1a1a2e', padding: 24, justifyContent: 'center' }}>
          <Text style={{ color: '#e2b96f', fontFamily: 'monospace', fontSize: 12, marginBottom: 12 }}>
            CRASH REPORT
          </Text>
          <Text style={{ color: '#c8c8e8', fontFamily: 'monospace', fontSize: 10 }}>
            {this.state.error}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <InventoryProvider>
            <View style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  contentStyle: { backgroundColor: '#1a1a2e' },
                }}
              >
                <Stack.Screen
                  name="cook"
                  options={{ headerShown: false, contentStyle: { backgroundColor: '#16213e' } }}
                />
              </Stack>
              <StatusBar style="light" />
            </View>
          </InventoryProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
