import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, Image, StyleSheet, Dimensions, ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../../lib/firestore';

const DISPLAY_W = 96;
const DISPLAY_H = 120;
const WIZARD_IDLE = require('../../assets/characters/wizard_character/mage_idle.png');
const WIZARD_WALK_RIGHT = require('../../assets/characters/wizard_character/walk_right.png');
const WIZARD_WALK_LEFT = require('../../assets/characters/wizard_character/walk_left.png');
const WIZARD_ATTACK_RIGHT = require('../../assets/characters/wizard_character/attack_right.png');
const WIZARD_ATTACK_LEFT = require('../../assets/characters/wizard_character/attack_left.png');
const WITCH_IDLE = [
  require('../../assets/characters/witch/idle_00.png'),
  require('../../assets/characters/witch/idle_01.png'),
  require('../../assets/characters/witch/idle_02.png'),
  require('../../assets/characters/witch/idle_03.png'),
];
const WITCH_WALK = [
  require('../../assets/characters/witch/walk_00.png'),
  require('../../assets/characters/witch/walk_01.png'),
  require('../../assets/characters/witch/walk_02.png'),
  require('../../assets/characters/witch/walk_03.png'),
];
const WITCH_ATTACK = [
  require('../../assets/characters/witch/attack_00.png'),
  require('../../assets/characters/witch/attack_01.png'),
  require('../../assets/characters/witch/attack_02.png'),
];

const { width: screenWidth } = Dimensions.get('window');
const SCREEN_CENTER_X = screenWidth / 2;
const MIN_X = 40;
const MAX_X = screenWidth - 40;
const WALK_SPEED = 180;
const MIN_IDLE_MS = 3000;
const MAX_IDLE_MS = 6000;
const FRAME_INTERVAL_MS = 180;
const IDLE_FRAME_INTERVAL_MS = 200;
const WITCH_WALK_FRAME_INTERVAL_MS = 200;
const WITCH_IDLE_FRAME_INTERVAL_MS = 300;
const WITCH_ATTACK_FRAME_INTERVAL_MS = 120;
const BREW_MS = 2000;
const CAST_MS = 520;

type WizardState = 'IDLE' | 'WALKING' | 'BREWING';
type Direction = 1 | -1;

type SpriteConfig = {
  source?: ImageSourcePropType;
  frameSources?: ImageSourcePropType[];
  frames: number;
  mirrored: boolean;
};

function getSpriteConfig(state: WizardState, direction: Direction, isFemale: boolean): SpriteConfig {
  if (isFemale) {
    if (state === 'WALKING') {
      return {
        frameSources: WITCH_WALK,
        frames: WITCH_WALK.length,
        mirrored: direction === -1,
      };
    }

    if (state === 'BREWING') {
      return {
        frameSources: WITCH_ATTACK,
        frames: WITCH_ATTACK.length,
        mirrored: direction === -1,
      };
    }

    return {
      frameSources: WITCH_IDLE,
      frames: WITCH_IDLE.length,
      mirrored: direction === -1,
    };
  }

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
  const { user } = useAuth();
  const [wizardState, setWizardState] = useState<WizardState>('IDLE');
  const [frame, setFrame] = useState(0);
  const [direction, setDirection] = useState<Direction>(1);
  const [isFemale, setIsFemale] = useState(false);

  const positionX = useSharedValue(SCREEN_CENTER_X);
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

  const startFrameLoop = useCallback((frameCount: number, intervalMs: number) => {
    clearFrameTimer();
    setFrame(0);
    frameTimerRef.current = setInterval(() => {
      setFrame((current) => (current + 1) % frameCount);
    }, intervalMs);
  }, [clearFrameTimer]);

  useEffect(() => {
    let alive = true;

    async function loadCharacter() {
      if (!user) {
        if (alive) setIsFemale(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        if (alive) setIsFemale(profile?.character === 'female');
      } catch (error) {
        console.error(error);
        if (alive) setIsFemale(false);
      }
    }

    loadCharacter();

    return () => {
      alive = false;
    };
  }, [user]);

  const scheduleIdleDecision = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      if (manualRef.current || castRef.current) return;

      const roll = Math.random();
      if (roll < 0.6) {
        const targetX = randomBetween(MIN_X, MAX_X);
        const currentX = positionX.value;
        const nextDirection: Direction = targetX > currentX ? 1 : -1;
        const distance = Math.abs(targetX - currentX);
        const duration = Math.max(250, (distance / WALK_SPEED) * 1000);

        setDirection(nextDirection);
        setWizardState('WALKING');
        startFrameLoop(isFemale ? WITCH_WALK.length : 5, isFemale ? WITCH_WALK_FRAME_INTERVAL_MS : FRAME_INTERVAL_MS);

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
        startFrameLoop(isFemale ? WITCH_ATTACK.length : 7, isFemale ? WITCH_ATTACK_FRAME_INTERVAL_MS : FRAME_INTERVAL_MS);
        clearActionTimer();
        actionTimerRef.current = setTimeout(() => {
          returnToIdle();
        }, BREW_MS);
      } else {
        returnToIdle();
      }
    }, randomBetween(MIN_IDLE_MS, MAX_IDLE_MS));
  }, [clearActionTimer, clearIdleTimer, isFemale, startFrameLoop]);

  const returnToIdle = useCallback(() => {
    if (manualRef.current || castRef.current) return;
    cancelAnimation(positionX);
    clearActionTimer();
    setWizardState('IDLE');
    startFrameLoop(isFemale ? WITCH_IDLE.length : 7, isFemale ? WITCH_IDLE_FRAME_INTERVAL_MS : IDLE_FRAME_INTERVAL_MS);
    scheduleIdleDecision();
  }, [clearActionTimer, isFemale, positionX, scheduleIdleDecision, startFrameLoop]);

  const finishTargetedWalk = useCallback(() => {
    manualRef.current = false;
    returnToIdle();
  }, [returnToIdle]);

  const finishManualWalk = useCallback((targetX: number, shouldResumeOnArrival: boolean) => {
    if (shouldResumeOnArrival) {
      finishTargetedWalk();
      return;
    }
    if (!manualRef.current) return;
    startFrameLoop(isFemale ? WITCH_IDLE.length : 7, isFemale ? WITCH_IDLE_FRAME_INTERVAL_MS : IDLE_FRAME_INTERVAL_MS);
    setWizardState('IDLE');
  }, [finishTargetedWalk, isFemale, startFrameLoop]);

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
    const currentX = positionX.value;
    const distance = Math.abs(targetX - currentX);
    const duration = Math.max(120, (distance / WALK_SPEED) * 1000);

    setDirection(walkDirection === 'right' ? 1 : -1);
    setWizardState('WALKING');
    startFrameLoop(isFemale ? WITCH_WALK.length : 5, isFemale ? WITCH_WALK_FRAME_INTERVAL_MS : FRAME_INTERVAL_MS);

    positionX.value = withTiming(
      targetX,
      {
        duration,
        easing: Easing.inOut(Easing.ease),
      },
      (finished) => {
        if (finished) {
          runOnJS(finishManualWalk)(targetX, shouldResumeOnArrival);
        }
      }
    );
  }, [clearActionTimer, clearIdleTimer, finishManualWalk, isFemale, positionX, startFrameLoop]);

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
    startFrameLoop(isFemale ? WITCH_ATTACK.length : 7, isFemale ? WITCH_ATTACK_FRAME_INTERVAL_MS : 80);

    actionTimerRef.current = setTimeout(() => {
      castRef.current = false;
      returnToIdle();
    }, CAST_MS);
  }, [clearActionTimer, clearIdleTimer, isFemale, positionX, returnToIdle, startFrameLoop]);

  useImperativeHandle(ref, () => ({
    startWalking: startManualWalk,
    stopWalking: stopManualWalk,
    castFireball,
    getX: () => positionX.value - SCREEN_CENTER_X,
  }), [castFireball, startManualWalk, stopManualWalk]);

  useEffect(() => {
    setWizardState('IDLE');
    startFrameLoop(isFemale ? WITCH_IDLE.length : 7, isFemale ? WITCH_IDLE_FRAME_INTERVAL_MS : IDLE_FRAME_INTERVAL_MS);
    scheduleIdleDecision();

    return () => {
      clearIdleTimer();
      clearActionTimer();
      clearFrameTimer();
      cancelAnimation(positionX);
    };
  }, [clearActionTimer, clearFrameTimer, clearIdleTimer, isFemale, positionX, scheduleIdleDecision, startFrameLoop]);

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: positionX.value - SCREEN_CENTER_X },
    ],
  }));

  const sprite = getSpriteConfig(wizardState, direction, isFemale);
  const frameIndex = frame % sprite.frames;

  return (
    <Animated.View style={[styles.wrapper, wrapperStyle]}>
      <View
        style={[
          styles.viewport,
          !sprite.frameSources && styles.sheetViewport,
          { transform: [{ scaleX: sprite.mirrored ? -1 : 1 }] },
        ]}
      >
        {sprite.frameSources ? (
          <Image
            source={sprite.frameSources[frameIndex]}
            style={styles.frame}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={sprite.source}
            style={[
              styles.sheet,
              { width: DISPLAY_W * sprite.frames, marginLeft: -frameIndex * DISPLAY_W },
            ]}
            resizeMode="contain"
          />
        )}
      </View>
    </Animated.View>
  );
});

export default WizardSprite;

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', overflow: 'visible' },
  viewport: { width: DISPLAY_W, height: DISPLAY_H, overflow: 'visible' },
  sheetViewport: { overflow: 'hidden' },
  frame: { width: DISPLAY_W, height: DISPLAY_H },
  sheet: { height: DISPLAY_H, position: 'absolute', top: 0, left: 0 },
});
