import AsyncStorage from '@react-native-async-storage/async-storage';

export type SFXName =
  | 'fireball_shoot'
  | 'fireball_hit'
  | 'recipe_click'
  | 'button_click'
  | 'grimor_click'
  | 'footstep';

export type MusicName = 'login_music' | 'main_music' | 'boss_music';

const SFX_ENABLED_KEY = '@grimor_sfx';
const MUSIC_ENABLED_KEY = '@grimor_music';
const MASTER_VOLUME_KEY = '@grimor_volume';
const MUSIC_VOLUME_KEY = '@grimor_music_volume';

const SFX_SOURCES: Record<SFXName, number> = {
  fireball_shoot: require('../../assets/sounds/fireball_shoot.wav'),
  fireball_hit: require('../../assets/sounds/fireball_hit.wav'),
  recipe_click: require('../../assets/sounds/recipe_click.wav'),
  button_click: require('../../assets/sounds/button_click.wav'),
  grimor_click: require('../../assets/sounds/grimor_click.wav'),
  footstep: require('../../assets/sounds/footstep.wav'),
};

const MUSIC_SOURCES: Record<MusicName, number> = {
  login_music: require('../../assets/sounds/login_music.wav'),
  main_music: require('../../assets/sounds/main_music.wav'),
  boss_music: require('../../assets/sounds/boss_music.wav'),
};

type AudioSound = {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => Promise<void>;
  remove: () => void;
  loop: boolean;
  volume: number;
  playing?: boolean;
  isLoaded?: boolean;
};

type AudioModule = {
  setAudioModeAsync: (mode: Record<string, unknown>) => Promise<unknown>;
  setIsAudioActiveAsync?: (active: boolean) => Promise<void>;
  createAudioPlayer: (source?: number | string | null, options?: Record<string, unknown>) => AudioSound;
};

const sfxCache = new Map<SFXName, AudioSound>();
let currentMusic: AudioSound | null = null;
let currentMusicName: MusicName | null = null;
let initPromise: Promise<void> | null = null;
let audioModule: AudioModule | null = null;
let audioUnavailable = false;

let sfxEnabled = true;
let musicEnabled = true;
let masterVolume = 1;
let musicVolume = 0.7;

function clampVolume(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function getAudioModule(): AudioModule | null {
  if (audioModule || audioUnavailable) return audioModule;

  try {
    audioModule = require('expo-audio') as AudioModule;
    audioUnavailable = !audioModule;
  } catch (error) {
    audioUnavailable = true;
    console.warn('Audio native module is unavailable. Rebuild the dev client to enable sounds.', error);
  }

  return audioModule;
}

async function initAudio() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const Audio = getAudioModule();
        if (!Audio) return;

        await Audio.setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          interruptionMode: 'duckOthers',
        });
        await Audio.setIsAudioActiveAsync?.(true);

        const [storedSfx, storedMusic, storedVolume, storedMusicVolume] = await Promise.all([
          AsyncStorage.getItem(SFX_ENABLED_KEY),
          AsyncStorage.getItem(MUSIC_ENABLED_KEY),
          AsyncStorage.getItem(MASTER_VOLUME_KEY),
          AsyncStorage.getItem(MUSIC_VOLUME_KEY),
        ]);

        sfxEnabled = storedSfx === null ? true : storedSfx === 'true';
        musicEnabled = storedMusic === null ? true : storedMusic === 'true';
        masterVolume = storedVolume === null ? 1 : clampVolume(Number(storedVolume));
        musicVolume = storedMusicVolume === null ? 0.7 : clampVolume(Number(storedMusicVolume));
      } catch (error) {
        console.warn('Unable to initialize audio', error);
      }
    })();
  }

  return initPromise;
}

async function getSFXSound(name: SFXName) {
  const cached = sfxCache.get(name);
  if (cached) return cached;

  try {
    const Audio = getAudioModule();
    if (!Audio) return null;

    const sound = Audio.createAudioPlayer(SFX_SOURCES[name], {
      keepAudioSessionActive: true,
      downloadFirst: true,
    });
    sound.volume = masterVolume;
    sfxCache.set(name, sound);
    return sound;
  } catch (error) {
    console.warn(`Unable to load sound effect: ${name}`, error);
    return null;
  }
}

export async function playSFX(name: SFXName): Promise<void> {
  try {
    await initAudio();
    if (!sfxEnabled || masterVolume <= 0) return;

    const sound = await getSFXSound(name);
    if (!sound) return;

    sound.volume = masterVolume;
    await sound.seekTo(0);
    sound.play();
  } catch (error) {
    console.warn(`Unable to play sound effect: ${name}`, error);
  }
}

export async function playMusic(name: MusicName, loop = true): Promise<void> {
  try {
    await initAudio();
    if (!musicEnabled || musicVolume <= 0) return;

    if (currentMusic && currentMusicName === name) {
      currentMusic.loop = loop;
      currentMusic.volume = musicVolume;
      if (!currentMusic.playing) currentMusic.play();
      return;
    }

    await stopMusic();
    const Audio = getAudioModule();
    if (!Audio) return;

    const sound = Audio.createAudioPlayer(MUSIC_SOURCES[name], {
      keepAudioSessionActive: true,
      downloadFirst: true,
    });
    sound.loop = loop;
    sound.volume = musicVolume;
    sound.play();
    currentMusic = sound;
    currentMusicName = name;
  } catch (error) {
    console.warn(`Unable to play music: ${name}`, error);
  }
}

export async function stopMusic(): Promise<void> {
  try {
    if (!currentMusic) return;
    const sound = currentMusic;
    currentMusic = null;
    currentMusicName = null;
    sound.pause();
    sound.remove();
  } catch (error) {
    console.warn('Unable to stop music', error);
  }
}

export async function stopAllSounds(): Promise<void> {
  try {
    await stopMusic();
    await Promise.all(Array.from(sfxCache.values()).map(async (sound) => {
      try {
        sound.pause();
        sound.remove();
      } catch (error) {
        console.warn('Unable to stop sound effect', error);
      }
    }));
  } catch (error) {
    console.warn('Unable to stop all sounds', error);
  }
}

export function setMasterVolume(v: number): void {
  masterVolume = clampVolume(v);
  AsyncStorage.setItem(MASTER_VOLUME_KEY, String(masterVolume)).catch(console.warn);
  sfxCache.forEach((sound) => { sound.volume = masterVolume; });
}

export function setMusicVolume(v: number): void {
  musicVolume = clampVolume(v);
  AsyncStorage.setItem(MUSIC_VOLUME_KEY, String(musicVolume)).catch(console.warn);
  if (currentMusic) currentMusic.volume = musicVolume;
}

export function setSFXEnabled(b: boolean): void {
  sfxEnabled = b;
  AsyncStorage.setItem(SFX_ENABLED_KEY, String(b)).catch(console.warn);
}

export function setMusicEnabled(b: boolean): void {
  musicEnabled = b;
  AsyncStorage.setItem(MUSIC_ENABLED_KEY, String(b)).catch(console.warn);
  if (!b) stopMusic().catch(console.warn);
}

export function isSFXEnabled(): boolean {
  initAudio().catch(console.warn);
  return sfxEnabled;
}

export function isMusicEnabled(): boolean {
  initAudio().catch(console.warn);
  return musicEnabled;
}

export function getMasterVolume(): number {
  initAudio().catch(console.warn);
  return masterVolume;
}

export function getMusicVolume(): number {
  initAudio().catch(console.warn);
  return musicVolume;
}
