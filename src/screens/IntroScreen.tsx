import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatBlockView } from '../components/StatBlock';
import { useGame } from '../state/GameContext';
import type { Character } from '../state/gameTypes';
import type { RootStackParamList } from '../types/navigation';
import { playEggCrack } from '../utils/sfx';

export const IntroScreen: React.FC<NativeStackScreenProps<RootStackParamList, 'Intro'>> = ({
  navigation
}) => {
  const { hatchEggs, completeIntro } = useGame();
  const [hatched, setHatched] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);

  const handleCrack = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    playEggCrack().catch(() => undefined);
    const pulls = hatchEggs(1);
    if (pulls.length > 0) {
      setCharacter(pulls[0]);
      setHatched(true);
      completeIntro();
    }
  };

  const handleContinue = () => {
    navigation.replace('Game');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crack your first egg</Text>
      <View style={styles.egg} />
      {!hatched ? (
        <PrimaryButton label="Crack Egg" onPress={handleCrack} />
      ) : (
        <View style={styles.card}>
          <Text style={styles.name}>{character?.name}</Text>
          <Text style={styles.meta}>
            {character?.role} • {character?.rarity}★
          </Text>
          {character?.stats ? <StatBlockView stats={character.stats} /> : null}
          <PrimaryButton label="Continue" onPress={handleContinue} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#3A2416'
  },
  egg: {
    width: 140,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFE9D2',
    borderWidth: 3,
    borderColor: '#F3C5A1',
    marginBottom: 24
  },
  card: {
    width: '100%',
    backgroundColor: '#FFF1E2',
    borderRadius: 16,
    padding: 16
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E1B11'
  },
  meta: {
    marginBottom: 8,
    color: '#7A5A44'
  }
});
