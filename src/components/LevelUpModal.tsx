import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Modal } from 'react-native';
import { CharacterRank } from '../data/character';
import * as Haptics from 'expo-haptics';
import RankIcon from './RankIcon';

type Props = {
  visible: boolean;
  rank: CharacterRank;
  onDismiss: () => void;
};

export default function LevelUpModal({ visible, rank, onDismiss }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Fade in overlay, then spring-pop the rank mark.
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <View style={styles.card}>
          {/* ── Flash label ─────────────────────────────────── */}
          <Text style={styles.flashLabel}>✦ LEVEL UP ✦</Text>

          {/* ── Rank emoji (spring animated) ─────────────────── */}
          <Animated.View style={[styles.rankMark, { transform: [{ scale }] }]}>
            <RankIcon rank={rank} size={76} />
          </Animated.View>

          {/* ── Rank info ────────────────────────────────────── */}
          <Text style={styles.levelLabel}>LEVEL {rank.level}</Text>
          <Text style={styles.rankTitle}>{rank.title}</Text>
          <Text style={styles.flavorText}>{rank.flavorText}</Text>

          {/* ── Divider ──────────────────────────────────────── */}
          <View style={styles.divider} />

          {/* ── CTA ──────────────────────────────────────────── */}
          <Pressable
            style={({ pressed }) => [styles.button, pressed && { backgroundColor: '#2d2d4e' }]}
            onPress={onDismiss}
          >
            <Text style={styles.buttonText}>CONTINUE  ▶</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 20, 0.92)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 32,
  },
  card: {
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#e2b96f',
    padding: 32,
    alignItems: 'center' as const,
    width: '100%' as const,
  },
  flashLabel: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#e2b96f',
    fontSize: 11,
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  rankMark: {
    marginBottom: 24,
  },
  levelLabel: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 8,
    marginBottom: 8,
  },
  rankTitle: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#e2b96f',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  flavorText: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#c8c8e8',
    fontSize: 8,
    textAlign: 'center' as const,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#2d2d4e',
    width: '100%' as const,
    marginVertical: 24,
  },
  button: {
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#e2b96f',
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center' as const,
    width: '100%' as const,
  },
  buttonText: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#e2b96f',
    fontSize: 10,
  },
};
