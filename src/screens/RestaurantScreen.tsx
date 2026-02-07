import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PrimaryButton } from '../components/PrimaryButton';
import { useGame } from '../state/GameContext';
import { playReward } from '../utils/sfx';

export const RestaurantScreen: React.FC = () => {
  const { state, collectIdle, tapServe, upgradeRestaurant } = useGame();
  const [localCombo, setLocalCombo] = useState(1);
  const [lastTap, setLastTap] = useState(0);

  const handleTap = () => {
    const now = Date.now();
    const delta = now - lastTap;
    if (delta < 2000) {
      setLocalCombo((prev) => Math.min(state.restaurant.comboMax, prev + 1));
    } else {
      setLocalCombo(1);
    }
    setLastTap(now);
    tapServe();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurant</Text>
      <Text style={styles.balance}>Coins: {state.coins}</Text>
      <Text style={styles.sub}>Idle: {state.restaurant.coinsPerMin} coins/min (cap 8h)</Text>
      <PrimaryButton
        label="Collect Idle Earnings"
        onPress={() => {
          collectIdle();
          playReward().catch(() => undefined);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        }}
      />

      <View style={styles.tapCard}>
        <Text style={styles.sectionTitle}>Serve Customers</Text>
        <Text style={styles.sub}>Tap for tips • Combo up to {state.restaurant.comboMax}x</Text>
        <PrimaryButton
          label={`Tap to Serve (x${localCombo})`}
          onPress={() => {
            handleTap();
            Haptics.selectionAsync().catch(() => undefined);
          }}
        />
      </View>

      <View style={styles.upgradeCard}>
        <Text style={styles.sectionTitle}>Upgrades (50 coins)</Text>
        <PrimaryButton label="Increase Throughput" onPress={() => upgradeRestaurant('throughput')} />
        <PrimaryButton label="Increase Customer Rate" onPress={() => upgradeRestaurant('rate')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F0',
    padding: 16
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    color: '#3A2416'
  },
  balance: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6
  },
  sub: {
    color: '#7A5A44'
  },
  tapCard: {
    marginTop: 16,
    backgroundColor: '#FFF1E2',
    padding: 12,
    borderRadius: 16
  },
  upgradeCard: {
    marginTop: 16,
    backgroundColor: '#FFF1E2',
    padding: 12,
    borderRadius: 16
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 6
  }
});
