// ─── src/components/WizardSprite.tsx ─────────────────────────────────────────
// Sprite-sheet based wizard character with a state machine animation loop.
// Sheet layout: 4 columns × 3 rows, each frame 125×166px (500×500 total)
//   Row 0: walk  (frames 0-3)
//   Row 1: idle  (frames 0-3)
//   Row 2: brew  (frames 0-3)

import { useEffect, useRef, useState } from 'react';
import { View, Image, Animated, StyleSheet, Dimensions } from 'react-native';

// ─── Sprite sheet constants ───────────────────────────────────────────────────
const SHEET_W = 500;
const SHEET_H = 500;
const COLS = 4;
const ROWS = 3;
const FRAME_W = SHEET_W / COLS;   // 125
const FRAME_H = SHEET_H / ROWS;   // 166.67

// ─── Display scale — adjust to taste ────────────────────────────────────────
const SCALE = 0.72;
const DISPLAY_W = FRAME_W * SCALE;  // ~90dp
const DISPLAY_H = FRAME_H * SCALE;  // ~120dp

// ─── Animation states ────────────────────────────────────────────────────────
type AnimState = 'walk_right' | 'idle' | 'brew' | 'walk_left';

interface StateConfig {
  row: number;
  frames: number;
  fps: number;
  duration: number; // ms total for this state
  flipX: boolean;
}

const STATE_CONFIG: Record<AnimState, StateConfig> = {
  walk_right: { row: 0, frames: 4, fps: 8,  duration: 3000, flipX: false },
  idle:       { row: 1, frames: 4, fps: 4,  duration: 2500, flipX: false },
  brew:       { row: 2, frames: 4, fps: 5,  duration: 3000, flipX: false },
  walk_left:  { row: 0, frames: 4, fps: 8,  duration: 3000, flipX: true  },
};

const STATE_SEQUENCE: AnimState[] = ['walk_right', 'idle', 'brew', 'walk_left'];

const { width } = Dimensions.get('window');
const WALK_RANGE = width * 0.28;

export default function WizardSprite() {
  const [animState, setAnimState] = useState<AnimState>('walk_right');
  const [frame, setFrame] = useState(0);
  const stateIndexRef = useRef(0);
  const frameRef = useRef(0);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── X position animation ────────────────────────────────────────────────
  const posX = useRef(new Animated.Value(-WALK_RANGE / 2)).current;

  // ─── Advance to next state ───────────────────────────────────────────────
  const startState = (stateKey: AnimState) => {
    const cfg = STATE_CONFIG[stateKey];

    // Reset frame counter
    frameRef.current = 0;
    setFrame(0);

    // Clear old frame timer
    if (frameTimerRef.current) clearInterval(frameTimerRef.current);

    // Tick frames at the configured fps
    const frameDuration = 1000 / cfg.fps;
    frameTimerRef.current = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % cfg.frames;
      setFrame(frameRef.current);
    }, frameDuration);

    // Animate X position for walk states
    if (stateKey === 'walk_right') {
      Animated.timing(posX, {
        toValue: WALK_RANGE / 2,
        duration: cfg.duration,
        useNativeDriver: true,
      }).start();
    } else if (stateKey === 'walk_left') {
      Animated.timing(posX, {
        toValue: -WALK_RANGE / 2,
        duration: cfg.duration,
        useNativeDriver: true,
      }).start();
    }

    // Schedule transition to next state
    if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
    stateTimerRef.current = setTimeout(() => {
      stateIndexRef.current = (stateIndexRef.current + 1) % STATE_SEQUENCE.length;
      const next = STATE_SEQUENCE[stateIndexRef.current];
      setAnimState(next);
      startState(next);
    }, cfg.duration);
  };

  // ─── Boot the state machine ──────────────────────────────────────────────
  useEffect(() => {
    startState('walk_right');
    return () => {
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
      posX.stopAnimation();
    };
  }, []);

  const cfg = STATE_CONFIG[animState];

  // ─── Compute sprite sheet offset for current frame ───────────────────────
  const col = frame % COLS;
  const offsetX = -col * FRAME_W * SCALE;
  const offsetY = -cfg.row * FRAME_H * SCALE;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [
            { translateX: posX },
            { scaleX: cfg.flipX ? -1 : 1 },
          ],
        },
      ]}
    >
      {/* Clip to single frame */}
      <View style={styles.viewport}>
        <Image
          source={require('../../assets/wizard-sprite.png')}
          style={[
            styles.sheet,
            {
              transform: [
                { translateX: offsetX },
                { translateY: offsetY },
              ],
            },
          ]}
          resizeMode="stretch"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  // Shows only one frame at a time
  viewport: {
    width: DISPLAY_W,
    height: DISPLAY_H,
    overflow: 'hidden',
  },
  // Full sprite sheet, shifted to show correct frame
  sheet: {
    width: SHEET_W * SCALE,
    height: SHEET_H * SCALE,
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
