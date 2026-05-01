import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Image, Animated, StyleSheet, Dimensions, ImageSourcePropType } from 'react-native';

const SHEET_W = 1024;
const SHEET_H = 1024;
const COLS = 4;
const ROWS = 3;
const FRAME_W = SHEET_W / COLS;
const FRAME_H = SHEET_H / ROWS;
const DISPLAY_W = 90;
const DISPLAY_H = 120;
const SCALE_X = DISPLAY_W / FRAME_W;
const SCALE_Y = DISPLAY_H / FRAME_H;
const WIZARD_IDLE = require('../../assets/characters/wizard_idle_new.png');
const WIZARD_WALK = require('../../assets/characters/wizard_walk_new.png');
const WIZARD_WALK_MIRRORED = require('../../assets/characters/wizard_walk_new_mirrored.png');
const WIZARD_CAST = require('../../assets/characters/wizard_fireball_cast_new.png');

const { width } = Dimensions.get('window');
const WALK_RANGE = width * 0.28;
const MIN_X = 53 - width / 2;
const MAX_X = width / 2 - 53;
const WALK_SPEED = 180; // dp per second

type AnimState = 'walk_right' | 'idle' | 'brew' | 'walk_left';

interface StateConfig {
  frames: number;
  fps: number;
  duration: number;
  flipX: boolean;
}

const STATE_CONFIG: Record<AnimState, StateConfig> = {
  walk_right: { frames: 12, fps: 8, duration: 3000, flipX: false },
  idle:       { frames: 12, fps: 5, duration: 2500, flipX: false },
  brew:       { frames: 12, fps: 6, duration: 3000, flipX: false },
  walk_left:  { frames: 12, fps: 8, duration: 3000, flipX: false },
};

const STATE_SEQUENCE: AnimState[] = ['walk_right', 'idle', 'brew', 'walk_left'];

function getSheetSource(state: AnimState): ImageSourcePropType {
  if (state === 'walk_right') return WIZARD_WALK;
  if (state === 'walk_left') return WIZARD_WALK_MIRRORED;
  if (state === 'brew') return WIZARD_CAST;
  return WIZARD_IDLE;
}

export type WizardSpriteHandle = {
  startWalking: (direction: 'left' | 'right') => void;
  stopWalking: () => void;
  getX: () => number;
};

const WizardSprite = forwardRef<WizardSpriteHandle>(function WizardSprite(_, ref) {
  const [animState, setAnimState] = useState<AnimState>('walk_right');
  const [frame, setFrame] = useState(0);

  const stateIndexRef = useRef(0);
  const frameRef = useRef(0);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualRef = useRef(false);
  const posXRef = useRef(-WALK_RANGE / 2);

  const posX = useRef(new Animated.Value(-WALK_RANGE / 2)).current;

  useEffect(() => {
    const id = posX.addListener(({ value }) => { posXRef.current = value; });
    return () => posX.removeListener(id);
  }, [posX]);

  const startFrameLoop = (state: AnimState) => {
    if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    const cfg = STATE_CONFIG[state];
    frameRef.current = 0;
    setFrame(0);
    frameTimerRef.current = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % cfg.frames;
      setFrame(frameRef.current);
    }, 1000 / cfg.fps);
  };

  const startState = (stateKey: AnimState) => {
    if (manualRef.current) return;
    const cfg = STATE_CONFIG[stateKey];
    startFrameLoop(stateKey);
    setAnimState(stateKey);

    if (stateKey === 'walk_right') {
      Animated.timing(posX, { toValue: WALK_RANGE / 2, duration: cfg.duration, useNativeDriver: true }).start();
    } else if (stateKey === 'walk_left') {
      Animated.timing(posX, { toValue: -WALK_RANGE / 2, duration: cfg.duration, useNativeDriver: true }).start();
    }

    if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
    stateTimerRef.current = setTimeout(() => {
      if (manualRef.current) return;
      stateIndexRef.current = (stateIndexRef.current + 1) % STATE_SEQUENCE.length;
      startState(STATE_SEQUENCE[stateIndexRef.current]);
    }, cfg.duration);
  };

  const startWalking = (direction: 'left' | 'right') => {
    manualRef.current = true;
    if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
    posX.stopAnimation();

    const walkState: AnimState = direction === 'right' ? 'walk_right' : 'walk_left';
    const target = direction === 'right' ? MAX_X : MIN_X;
    const distance = Math.abs(target - posXRef.current);
    const duration = (distance / WALK_SPEED) * 1000;

    startFrameLoop(walkState);
    setAnimState(walkState);

    if (duration < 20) return; // already at edge

    Animated.timing(posX, {
      toValue: target,
      duration,
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Reached the edge while still held — go idle until released
      if (finished && manualRef.current) {
        if (frameTimerRef.current) clearInterval(frameTimerRef.current);
        startFrameLoop('idle');
        setAnimState('idle');
      }
    });
  };

  const stopWalking = () => {
    posX.stopAnimation();
    manualRef.current = false;
    if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
    stateIndexRef.current = 1; // resume from idle
    startState(STATE_SEQUENCE[1]);
  };

  useImperativeHandle(ref, () => ({ startWalking, stopWalking, getX: () => posXRef.current }));

  useEffect(() => {
    startState('walk_right');
    return () => {
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
      posX.stopAnimation();
    };
  }, []);

  const cfg = STATE_CONFIG[animState];
  const col = frame % COLS;
  const row = Math.floor(frame / COLS);
  const offsetX = -col * DISPLAY_W;
  const offsetY = -row * DISPLAY_H;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { transform: [{ translateX: posX }, { scaleX: cfg.flipX ? -1 : 1 }] },
      ]}
    >
      <View style={styles.viewport}>
        <Image
          source={getSheetSource(animState)}
          style={[
            styles.sheet,
            { marginLeft: offsetX, marginTop: offsetY },
          ]}
          resizeMode="stretch"
        />
      </View>
    </Animated.View>
  );
});

export default WizardSprite;

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  viewport: { width: DISPLAY_W, height: DISPLAY_H, overflow: 'hidden' },
  sheet: { width: SHEET_W * SCALE_X, height: SHEET_H * SCALE_Y, position: 'absolute', top: 0, left: 0 },
});
