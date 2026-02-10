import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { SPECIES } from '../data/gameData';
import { useGame } from '../state/GameContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { StatBlockView } from '../components/StatBlock';
import { getXpProgress } from '../utils/leveling';
import type { Character } from '../state/gameTypes';

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

export const PetDetailScreen: React.FC<NativeStackScreenProps<RootStackParamList, 'PetDetail'>> = ({
  route
}) => {
  const { state, renameCharacter } = useGame();
  const speciesId = route.params.speciesId;
  const species = SPECIES.find((entry) => entry.id === speciesId);
  const [selectedPet, setSelectedPet] = useState<Character | null>(null);
  const [nameDraft, setNameDraft] = useState('');

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
            <Pressable
              key={char.id}
              style={[styles.card, { borderColor: rarityBorder(char.rarity) }]}
              onPress={() => {
                setSelectedPet(char);
                setNameDraft(char.name);
              }}
            >
              <Text style={styles.cardTitle}>
                {char.name} • {char.role} • Lv {char.level}
              </Text>
              <StatBlockView stats={char.stats} />
            </Pressable>
          ))
        )}
      </View>

      <Modal visible={!!selectedPet} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedPet?.name}</Text>
            <Text style={styles.modalMeta}>
              {selectedPet?.role} • Lv {selectedPet?.level}
            </Text>
            {selectedPet ? (
              <View style={styles.xpRow}>
                {(() => {
                  const progress = getXpProgress(selectedPet.xp ?? 0);
                  return (
                    <>
                      <View style={styles.xpBar}>
                        <View
                          style={[
                            styles.xpFill,
                            { width: `${Math.round(progress.progress * 100)}%` }
                          ]}
                        />
                      </View>
                      <Text style={styles.xpText}>
                        {selectedPet.xp ?? 0} XP • Lv {progress.level}
                      </Text>
                    </>
                  );
                })()}
              </View>
            ) : null}
            <View style={styles.renameRow}>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Rename pet"
                style={styles.input}
              />
              <Pressable
                style={styles.renameButton}
                onPress={() => {
                  if (selectedPet && nameDraft.trim()) {
                    renameCharacter(selectedPet.id, nameDraft.trim());
                    setSelectedPet({ ...selectedPet, name: nameDraft.trim() });
                  }
                }}
              >
                <Text style={styles.renameButtonText}>Save</Text>
              </Pressable>
            </View>
            {selectedPet?.stats ? <StatBlockView stats={selectedPet.stats} /> : null}
            {selectedPet ? (
              <View style={styles.statList}>
                <Text style={styles.statLine}>Fishing trips: {selectedPet.fishingTrips}</Text>
                <Text style={styles.statLine}>
                  Restaurant minutes: {selectedPet.restaurantMinutes}
                </Text>
                <Text style={styles.statLine}>
                  Coins from restaurant: {selectedPet.coinsFromRestaurant}
                </Text>
                <Text style={styles.statLine}>Fish collected: {selectedPet.fishCollected}</Text>
                <Text style={styles.statLine}>
                  Treasures found: {selectedPet.treasuresCollected}
                </Text>
              </View>
            ) : null}
            <Pressable style={styles.modalButton} onPress={() => setSelectedPet(null)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 6
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24
  },
  modalCard: {
    backgroundColor: '#FFF1E2',
    borderRadius: 16,
    padding: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6
  },
  modalMeta: {
    color: '#7A5A44',
    marginBottom: 8
  },
  xpRow: {
    marginBottom: 8
  },
  xpBar: {
    height: 10,
    backgroundColor: '#E5D7C9',
    borderRadius: 8,
    overflow: 'hidden'
  },
  xpFill: {
    height: 10,
    backgroundColor: '#F47C3C'
  },
  xpText: {
    marginTop: 4,
    color: '#7A5A44',
    fontSize: 12
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFDF9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5D7C9'
  },
  renameButton: {
    backgroundColor: '#F47C3C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  renameButtonText: {
    color: '#1F120B',
    fontWeight: '700'
  },
  statList: {
    marginTop: 10
  },
  statLine: {
    color: '#7A5A44',
    marginBottom: 4
  },
  modalButton: {
    marginTop: 12,
    backgroundColor: '#F47C3C',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center'
  },
  modalButtonText: {
    fontWeight: '700',
    color: '#1F120B'
  }
});
