import { AuthProvider } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { InventoryProvider } from '../src/context/InventoryContext';
import { SubscriptionProvider } from '../src/context/SubscriptionContext';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, Component, ReactNode } from 'react';
import { Stack } from 'expo-router';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

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
  const [showAppSplash, setShowAppSplash] = useState(true);
  const splashOpacity = useSharedValue(0);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      splashOpacity.value = withSequence(
        withTiming(1, { duration: 400 }),
        withDelay(
          800,
          withTiming(0, { duration: 300 }, (finished) => {
            if (finished) {
              runOnJS(setShowAppSplash)(false);
            }
          })
        )
      );
    }
  }, [fontsLoaded, splashOpacity]);

  const splashStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <InventoryProvider>
            <SubscriptionProvider>
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
                {showAppSplash && (
                  <Animated.View pointerEvents="auto" style={[styles.appSplash, splashStyle]}>
                    <Text style={styles.appSplashTitle}>GRIMOR</Text>
                  </Animated.View>
                )}
              </View>
            </SubscriptionProvider>
          </InventoryProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  appSplash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#16213e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appSplashTitle: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#c8a84b',
    fontSize: 28,
    textShadowColor: '#c8a84b',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
