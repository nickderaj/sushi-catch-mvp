import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PrimaryButton } from '../components/PrimaryButton';
import { RARITY_LABEL, SPECIES } from '../data/gameData';
import { useGame } from '../state/GameContext';
import type { Character } from '../state/gameTypes';
import { playEggCrack, playReward } from '../utils/sfx';

export const HatchScreen: React.FC = () => {
  const { state, hatchEggs, buyEggs } = useGame();
  const [lastPulls, setLastPulls] = useState<Character[]>([]);

  const handleHatch = async (count: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    playEggCrack().catch(() => undefined);
    const pulls = hatchEggs(count);
    setLastPulls(pulls);
    if (pulls.length > 0) {
      playReward().catch(() => undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Gacha Hatch</Text>
      <View style={styles.currencyRow}>
        <Text style={styles.currency}>Eggs: {state.eggs}</Text>
        <Text style={styles.currency}>Pearls: {state.pearls}</Text>
        <Text style={styles.currency}>Coins: {state.coins}</Text>
      </View>
      <PrimaryButton
        label="Hatch 1 (1 egg)"
        onPress={() => handleHatch(1)}
        disabled={state.eggs < 1}
      />
      <PrimaryButton
        label="Hatch 10 (10 eggs)"
        onPress={() => handleHatch(10)}
        disabled={state.eggs < 10}
      />
      <PrimaryButton
        label="Buy 1 Egg (10 pearls)"
        onPress={() => buyEggs(1)}
        disabled={state.pearls < 10}
      />
      <PrimaryButton
        label="Buy 10 Eggs (100 pearls)"
        onPress={() => buyEggs(10)}
        disabled={state.pearls < 100}
      />

      <Text style={styles.sectionTitle}>Last Pulls</Text>
      {lastPulls.length === 0 ? (
        <Text style={styles.empty}>No pulls yet.</Text>
      ) : (
        lastPulls.map((char) => (
          <View key={char.id} style={styles.card}>
            <Text style={styles.name}>{char.name}</Text>
            <Text style={styles.meta}>
              {SPECIES.find((entry) => entry.id === char.speciesId)?.name ?? 'Unknown'} •{' '}
              {char.role} • {RARITY_LABEL[char.rarity]} ({char.rarity}★)
            </Text>
            <Text style={styles.meta}>
              Base: {char.stats.power} PWR • {char.stats.expertise} EXP
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F0'
  },
  content: {
    padding: 16
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    color: '#3A2416'
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  currency: {
    color: '#7A5A44',
    fontWeight: '600'
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '700'
  },
  empty: {
    color: '#8A6D5C'
  },
  card: {
    backgroundColor: '#FFF1E2',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12
  },
  name: {
    fontSize: 18,
    fontWeight: '700'
  },
  meta: {
    color: '#7A5A44',
    marginBottom: 6
  }
});
