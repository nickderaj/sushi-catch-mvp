import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useGame } from '../state/GameContext';

export const DebugScreen: React.FC = () => {
  const { state, addResources, skipTrips, resetGame } = useGame();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Menu</Text>
      <Text style={styles.sub}>
        Coins: {state.coins} • Shells: {state.shells} • Fish: {state.fishCurrency}
      </Text>

      <PrimaryButton label="+100 Coins" onPress={() => addResources(100, 0, {}, 0)} />
      <PrimaryButton label="+50 Shells" onPress={() => addResources(0, 50, {}, 0)} />
      <PrimaryButton label="+10 Common Eggs" onPress={() => addResources(0, 0, { '1': 10 }, 0)} />
      <PrimaryButton label="+2 Rare Eggs" onPress={() => addResources(0, 0, { '3': 2 }, 0)} />
      <PrimaryButton label="+200 Fish Currency" onPress={() => addResources(0, 0, {}, 200)} />
      <PrimaryButton
        label="Starter Pack (+500 Coins, +100 Shells, +20 Eggs, +500 Fish)"
        onPress={() => addResources(500, 100, { '1': 20 }, 500)}
      />

      <View style={styles.section}>
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
