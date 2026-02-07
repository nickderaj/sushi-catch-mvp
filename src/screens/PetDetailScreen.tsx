import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SPECIES } from '../data/gameData';
import { useGame } from '../state/GameContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { StatBlockView } from '../components/StatBlock';

export const PetDetailScreen: React.FC<NativeStackScreenProps<RootStackParamList, 'PetDetail'>> = ({
  route
}) => {
  const { state } = useGame();
  const speciesId = route.params.speciesId;
  const species = SPECIES.find((entry) => entry.id === speciesId);

  const owned = useMemo(() => {
    return state.ownedCharacters.filter((char) => char.speciesId === speciesId);
  }, [state.ownedCharacters, speciesId]);

  if (!species) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Unknown Creature</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{owned.length > 0 ? species.name : 'Unknown Creature'}</Text>
      <Text style={styles.subtitle}>
        {owned.length > 0 ? species.bio : 'Collect one to unlock.'}
      </Text>

      {owned.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Baseline Stats</Text>
          <StatBlockView stats={species.baselineStats} />
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Collected ({owned.length})</Text>
        {owned.length === 0 ? (
          <Text style={styles.empty}>No creatures collected yet.</Text>
        ) : (
          owned.map((char) => (
            <View key={char.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {char.name} • {char.rarity}★ • {char.role}
              </Text>
              <StatBlockView stats={char.stats} />
            </View>
          ))
        )}
      </View>
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
    color: '#3A2416'
  },
  subtitle: {
    marginTop: 6,
    color: '#7A5A44'
  },
  section: {
    marginTop: 16
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8
  },
  empty: {
    color: '#8A6D5C'
  },
  card: {
    backgroundColor: '#FFF1E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 6
  }
});
