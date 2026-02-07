import { Audio } from 'expo-av';

const eggCrack = require('../../assets/sfx/egg_crack.wav');
const reward = require('../../assets/sfx/reward.wav');

let isConfigured = false;

const configureAudio = async () => {
  if (isConfigured) return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true
    });
    isConfigured = true;
  } catch {
    // ignore
  }
};

const playSound = async (source: number) => {
  try {
    await configureAudio();
    const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => undefined);
      }
    });
  } catch {
    // ignore
  }
};

export const playEggCrack = async () => playSound(eggCrack);
export const playReward = async () => playSound(reward);
