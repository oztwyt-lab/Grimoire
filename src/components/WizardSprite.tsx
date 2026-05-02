import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, Image, StyleSheet, Dimensions, ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const DISPLAY_W = 92;
const DISPLAY_H = 92;
const WIZARD_IDLE = require('../../assets/characters/wizard_character/mage_idle.png');
const WIZARD_WALK_RIGHT = require('../../assets/characters/wizard_character/walk_right.png');
const WIZARD_WALK_LEFT = require('../../assets/characters/wizard_character/walk_left.png');
const WIZARD_ATTACK_RIGHT = require('../../assets/characters/wizard_character/attack_right.png');
const WIZARD_ATTACK_LEFT = require('../../assets/characters/wizard_character/attack_left.png');

const { width: screenWidth } = Dimensions.get('window');
const SCREEN_CENTER_X = screenWidth / 2;
const MIN_X = 40;
const MAX_X = screenWidth - 40;
const WALK_SPEED = 180;
const MIN_IDLE_MS = 3000;
const MAX_IDLE_MS = 6000;
const FRAME_INTERVAL_MS = 250;
const IDLE_FRAME_INTERVAL_MS = 320;
const BREW_MS = 2000;
const CAST_MS = 520;

type WizardState = 'IDLE' | 'WALKING' | 'BREWING';
type Direction = 1 | -1;

type SpriteConfig = {
  source: ImageSourcePropType;
  frames: number;
  mirrored: boolean;
};

function getSpriteConfig(state: WizardState, direction: Direction): SpriteConfig {
  if (state === 'WALKING') {
    return {
      source: direction === 1 ? WIZARD_WALK_RIGHT : WIZARD_WALK_LEFT,
      frames: 5,
      mirrored: false,
    };
  }

  if (state === 'BREWING') {
    return {
      source: direction === 1 ? WIZARD_ATTACK_RIGHT : WIZARD_ATTACK_LEFT,
      frames: 7,
      mirrored: false,
    };
  }

  return {
    source: WIZARD_IDLE,
    frames: 7,
    mirrored: direction === -1,
  };
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clampPosition(value: number) {
  return Math.min(MAX_X, Math.max(MIN_X, value));
}

export type WizardSpriteHandle = {
  startWalking: (direction: 'left' | 'right', targetScreenX?: number) => void;
  stopWalking: () => void;
  castFireball: () => void;
  getX: () => number;
};

const WizardSprite = forwardRef<WizardSpriteHandle>(function WizardSprite(_, ref) {
  const [wizardState, setWizardState] = useState<WizardState>('IDLE');
  const [frame, setFrame] = useState(0);
  const [direction, setDirection] = useState<Direction>(1);

  const positionX = useSharedValue(SCREEN_CENTER_X);
  const positionXRef = useRef(SCREEN_CENTER_X);
  const manualRef = useRef(false);
  const castRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const clearActionTimer = useCallback(() => {
    if (actionTimerRef.current) {
      clearTimeout(actionTimerRef.current);
      actionTimerRef.current = null;
    }
  }, []);

  const clearFrameTimer = useCallback(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
  }, []);

  const updatePositionRef = useCallback((value: number) => {
    positionXRef.current = value;
  }, []);

  useAnimatedReaction(
    () => positionX.value,
    (value) => {
      runOnJS(updatePositionRef)(value);
    },
    [updatePositionRef]
  );

  const startFrameLoop = useCallback((frameCount: number, intervalMs: number) => {
    clearFrameTimer();
    setFrame(0);
    frameTimerRef.current = setInterval(() => {
      setFrame((current) => (current + 1) % frameCount);
    }, intervalMs);
  }, [clearFrameTimer]);

  const scheduleIdleDecision = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      if (manualRef.current || castRef.current) return;

      const roll = Math.random();
      if (roll < 0.6) {
        const targetX = randomBetween(MIN_X, MAX_X);
        const currentX = positionXRef.current;
        const nextDirection: Direction = targetX > currentX ? 1 : -1;
        const distance = Math.abs(targetX - currentX);
        const duration = Math.max(250, (distance / WALK_SPEED) * 1000);

        setDirection(nextDirection);
        setWizardState('WALKING');
        startFrameLoop(5, FRAME_INTERVAL_MS);

        positionX.value = withTiming(
          targetX,
          {
            duration,
            easing: Easing.inOut(Easing.ease),
          },
          (finished) => {
            if (finished) {
              runOnJS(returnToIdle)();
            }
          }
        );
      } else if (roll < 0.85) {
        setWizardState('BREWING');
        startFrameLoop(7, FRAME_INTERVAL_MS);
        clearActionTimer();
        actionTimerRef.current = setTimeout(() => {
          returnToIdle();
        }, BREW_MS);
      } else {
        returnToIdle();
      }
    }, randomBetween(MIN_IDLE_MS, MAX_IDLE_MS));
  }, [clearActionTimer, clearIdleTimer, startFrameLoop]);

  const returnToIdle = useCallback(() => {
    if (manualRef.current || castRef.current) return;
    cancelAnimation(positionX);
    clearActionTimer();
    setWizardState('IDLE');
    startFrameLoop(7, IDLE_FRAME_INTERVAL_MS);
    scheduleIdleDecision();
  }, [clearActionTimer, positionX, scheduleIdleDecision, startFrameLoop]);

  const finishTargetedWalk = useCallback(() => {
    manualRef.current = false;
    returnToIdle();
  }, [returnToIdle]);

  const startManualWalk = useCallback((walkDirection: 'left' | 'right', targetScreenX?: number) => {
    manualRef.current = true;
    castRef.current = false;
    clearIdleTimer();
    clearActionTimer();
    cancelAnimation(positionX);

    const targetX = typeof targetScreenX === 'number'
      ? clampPosition(targetScreenX)
      : walkDirection === 'right' ? MAX_X : MIN_X;
    const shouldResumeOnArrival = typeof targetScreenX === 'number';
    const currentX = positionXRef.current;
    const distance = Math.abs(targetX - currentX);
    const duration = Math.max(250, (distance / WALK_SPEED) * 1000);

    setDirection(walkDirection === 'right' ? 1 : -1);
    setWizardState('WALKING');
    startFrameLoop(5, FRAME_INTERVAL_MS);

    positionX.value = withTiming(
      targetX,
      {
        duration,
        easing: Easing.inOut(Easing.ease),
      },
      (finished) => {
        if (finished) {
          if (shouldResumeOnArrival) {
            runOnJS(finishTargetedWalk)();
          } else if (manualRef.current) {
            runOnJS(startFrameLoop)(7, IDLE_FRAME_INTERVAL_MS);
            runOnJS(setWizardState)('IDLE');
          }
        }
      }
    );
  }, [clearActionTimer, clearIdleTimer, finishTargetedWalk, positionX, startFrameLoop]);

  const stopManualWalk = useCallback(() => {
    manualRef.current = false;
    cancelAnimation(positionX);
    returnToIdle();
  }, [positionX, returnToIdle]);

  const castFireball = useCallback(() => {
    castRef.current = true;
    manualRef.current = false;
    clearIdleTimer();
    clearActionTimer();
    cancelAnimation(positionX);
    setWizardState('BREWING');
    startFrameLoop(7, 80);

    actionTimerRef.current = setTimeout(() => {
      castRef.current = false;
      returnToIdle();
    }, CAST_MS);
  }, [clearActionTimer, clearIdleTimer, positionX, returnToIdle, startFrameLoop]);

  useImperativeHandle(ref, () => ({
    startWalking: startManualWalk,
    stopWalking: stopManualWalk,
    castFireball,
    getX: () => positionXRef.current - SCREEN_CENTER_X,
  }), [castFireball, startManualWalk, stopManualWalk]);

  useEffect(() => {
    setWizardState('IDLE');
    startFrameLoop(7, IDLE_FRAME_INTERVAL_MS);
    scheduleIdleDecision();

    return () => {
      clearIdleTimer();
      clearActionTimer();
      clearFrameTimer();
      cancelAnimation(positionX);
    };
  }, [clearActionTimer, clearFrameTimer, clearIdleTimer, positionX, scheduleIdleDecision, startFrameLoop]);

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: positionX.value - SCREEN_CENTER_X },
    ],
  }));

  const sprite = getSpriteConfig(wizardState, direction);
  const frameIndex = frame % sprite.frames;
  const offsetX = -frameIndex * DISPLAY_W;

  return (
    <Animated.View style={[styles.wrapper, wrapperStyle]}>
      <View style={[styles.viewport, { transform: [{ scaleX: sprite.mirrored ? -1 : 1 }] }]}>
        <Image
          source={sprite.source}
          style={[
            styles.sheet,
            { width: DISPLAY_W * sprite.frames, marginLeft: offsetX },
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
  sheet: { height: DISPLAY_H, position: 'absolute', top: 0, left: 0 },
});
