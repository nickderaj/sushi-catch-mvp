import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useGame } from '../state/GameContext';

export const DebugScreen: React.FC = () => {
  const { state, addCurrency, addFish, skipTrips, resetGame } = useGame();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Menu</Text>
      <Text style={styles.sub}>
        Coins: {state.coins} • Pearls: {state.pearls} • Eggs: {state.eggs}
      </Text>

      <PrimaryButton label="+100 Coins" onPress={() => addCurrency(100, 0, 0)} />
      <PrimaryButton label="+50 Pearls" onPress={() => addCurrency(0, 50, 0)} />
      <PrimaryButton label="+10 Eggs" onPress={() => addCurrency(0, 0, 10)} />
      <PrimaryButton
        label="Starter Pack (+500 Coins, +100 Pearls, +20 Eggs)"
        onPress={() => addCurrency(500, 100, 20)}
      />

      <View style={styles.section}>
        <PrimaryButton label="Add 5 Random Fish" onPress={() => addFish(5)} />
        <PrimaryButton label="Skip All Trip Timers" onPress={skipTrips} />
      </View>

      <View style={styles.section}>
        <PrimaryButton label="Reset Game" onPress={resetGame} />
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
    marginBottom: 6,
    color: '#3A2416'
  },
  sub: {
    color: '#7A5A44',
    marginBottom: 12
  },
  section: {
    marginTop: 16
  }
});
