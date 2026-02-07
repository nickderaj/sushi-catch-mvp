import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGame } from '../state/GameContext';

export const InventoryScreen: React.FC = () => {
  const { state } = useGame();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Inventory</Text>

      <Text style={styles.sectionTitle}>Characters ({state.ownedCharacters.length})</Text>
      {state.ownedCharacters.length === 0 ? (
        <Text style={styles.empty}>No characters yet.</Text>
      ) : (
        state.ownedCharacters.map((char) => (
          <View key={char.id} style={styles.card}>
            <Text style={styles.name}>{char.name} • {char.rarity}★</Text>
            <Text style={styles.meta}>{char.role}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Fish ({state.fishInventory.length})</Text>
      {state.fishInventory.length === 0 ? (
        <Text style={styles.empty}>No fish yet.</Text>
      ) : (
        state.fishInventory.map((fish) => (
          <View key={fish.id} style={styles.card}>
            <Text style={styles.name}>{fish.name} • {fish.rarity}★</Text>
            <Text style={styles.meta}>x{fish.count}</Text>
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
  sectionTitle: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '700'
  },
  empty: {
    color: '#8A6D5C'
  },
  card: {
    backgroundColor: '#FFF1E2',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8
  },
  name: {
    fontWeight: '700'
  },
  meta: {
    color: '#7A5A44'
  }
});
