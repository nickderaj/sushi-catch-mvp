import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SPECIES } from '../data/gameData';
import { useGame } from '../state/GameContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { rarityColor } from '../utils/rarity';

export const PetsScreen: React.FC = () => {
  const { state } = useGame();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const speciesData = useMemo(() => {
    return SPECIES.map((species) => {
      const owned = state.ownedCharacters.filter((c) => c.speciesId === species.id);
      const count = owned.length;
      const highest = owned.reduce<string | null>((acc, char) => {
        if (!acc) return char.rarity;
        return Number(char.rarity) > Number(acc) ? char.rarity : acc;
      }, null);
      return {
        species,
        count,
        highest
      };
    });
  }, [state.ownedCharacters]);

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={speciesData}
      numColumns={2}
      keyExtractor={(item) => item.species.id}
      renderItem={({ item }) => {
        const isCollected = item.count > 0;
        const borderColor = rarityColor(item.highest);
        return (
          <Pressable
            style={[styles.card, { borderColor }, !isCollected && styles.cardLocked]}
            onPress={() => navigation.navigate('PetDetail', { speciesId: item.species.id })}
          >
            <View style={styles.cardInner}>
              <Text style={styles.name}>{isCollected ? item.species.name : '???'}</Text>
              {isCollected && item.count > 1 ? (
                <Text style={styles.count}>x{item.count}</Text>
              ) : null}
              {!isCollected ? <Text style={styles.locked}>Uncollected</Text> : null}
            </View>
          </Pressable>
        );
      }}
      ListHeaderComponent={<Text style={styles.title}>Creatures</Text>}
    />
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    backgroundColor: '#FDF7F0'
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    color: '#3A2416'
  },
  card: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 3,
    borderRadius: 16,
    margin: 6,
    backgroundColor: '#FFF1E2'
  },
  cardLocked: {
    opacity: 0.5
  },
  cardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  name: {
    fontWeight: '700',
    color: '#3A2416'
  },
  count: {
    marginTop: 6,
    fontWeight: '700',
    color: '#4A2E1F'
  },
  locked: {
    marginTop: 6,
    color: '#7A5A44'
  }
});
