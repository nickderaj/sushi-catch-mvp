import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PrimaryButton } from '../components/PrimaryButton';
import { EGG_TYPES, RARITY_LABEL, SPECIES } from '../data/gameData';
import { useGame } from '../state/GameContext';
import type { Character } from '../state/gameTypes';
import { playEggCrack, playReward } from '../utils/sfx';

const rarityBorder = (rarity: string) => {
  switch (rarity) {
    case '1':
      return '#3A2416';
    case '2':
      return '#22C55E';
    case '3':
      return '#3B82F6';
    case '4':
      return '#A855F7';
    case '5':
      return '#F97316';
    default:
      return '#3A2416';
  }
};

export const HatchScreen: React.FC = () => {
  const { state, hatchEggs, buyEggs } = useGame();
  const [lastPulls, setLastPulls] = useState<Character[]>([]);

  const handleHatch = async (rarity: keyof typeof state.eggsByRarity, count: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    playEggCrack().catch(() => undefined);
    const pulls = hatchEggs(rarity, count);
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
        <Text style={styles.currency}>Shells: {state.shells}</Text>
        <Text style={styles.currency}>Coins: {state.coins}</Text>
      </View>

      {EGG_TYPES.map((egg) => {
        const count = state.eggsByRarity[egg.rarity] ?? 0;
        return (
          <View key={egg.rarity} style={[styles.eggRow, { borderColor: rarityBorder(egg.rarity) }]}>
            <Text style={styles.eggLabel}>
              {egg.label} • x{count}
            </Text>
            <PrimaryButton
              label="Hatch 1"
              onPress={() => handleHatch(egg.rarity, 1)}
              disabled={count < 1}
            />
            <PrimaryButton
              label={`Buy (${egg.shellCost} shells)`}
              onPress={() => buyEggs(egg.rarity, 1)}
              disabled={state.shells < egg.shellCost}
            />
          </View>
        );
      })}

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
              Base: {char.stats.power} PWR • {char.stats.stamina} STA
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
  eggRow: {
    backgroundColor: '#FFF1E2',
    borderWidth: 2,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12
  },
  eggLabel: {
    fontWeight: '700',
    marginBottom: 8,
    color: '#3A2416'
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
