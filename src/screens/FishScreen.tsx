import React, { useMemo, useState, useEffect } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PrimaryButton } from '../components/PrimaryButton';
import { DURATIONS, LOCATIONS } from '../data/gameData';
import { useGame } from '../state/GameContext';
import { formatSeconds, now } from '../utils/time';
import { playReward } from '../utils/sfx';
import type { TripRewards } from '../state/gameTypes';

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
      return '#FFFFFF';
  }
};

export const FishScreen: React.FC = () => {
  const { state, startTrip, claimTrip } = useGame();
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]);
  const [locationId, setLocationId] = useState(LOCATIONS[0].id);
  const [durationSec, setDurationSec] = useState(DURATIONS[0].seconds);
  const [rewardModal, setRewardModal] = useState(false);
  const [lastRewards, setLastRewards] = useState<TripRewards | null>(null);
  const [, setTick] = useState(0);
  const hasActiveTrips = useMemo(() => {
    const nowMs = now();
    return state.trips.some((trip) => !trip.resolved && trip.endsAt > nowMs);
  }, [state.trips]);

  useEffect(() => {
    if (!hasActiveTrips) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [hasActiveTrips]);

  const toggleCrew = (id: string) => {
    setSelectedCrew((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const canStart = selectedCrew.length > 0;

  const activeTrips = useMemo(() => {
    return state.trips.slice(0, 5);
  }, [state.trips]);

  const handleClaim = (tripId: string) => {
    const rewards = claimTrip(tripId);
    if (rewards) {
      setLastRewards(rewards);
      setRewardModal(true);
      playReward().catch(() => undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Fishing Expeditions</Text>
      <Text style={styles.sub}>Fish Currency: {state.fishCurrency}</Text>

      <Text style={styles.sectionTitle}>Select Crew (1-3)</Text>
      {state.ownedCharacters.length === 0 ? (
        <Text style={styles.empty}>No characters yet. Hatch some eggs first.</Text>
      ) : (
        <View style={styles.listBox}>
          <ScrollView>
            {state.ownedCharacters.map((char) => {
              const isStaff = state.restaurantStaffIds.includes(char.id);
              return (
                <View key={char.id} style={styles.row}>
                  <Text style={styles.rowText}>
                    {char.name} • {char.role}
                  </Text>
                  <PrimaryButton
                    label={selectedCrew.includes(char.id) ? 'Remove' : 'Add'}
                    onPress={() => toggleCrew(char.id)}
                    disabled={
                      isStaff || (!selectedCrew.includes(char.id) && selectedCrew.length >= 3)
                    }
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <Text style={styles.sectionTitle}>Location</Text>
      <View style={styles.pillRow}>
        {LOCATIONS.map((loc) => (
          <PrimaryButton
            key={loc.id}
            label={loc.name}
            onPress={() => setLocationId(loc.id)}
            disabled={locationId === loc.id}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Duration</Text>
      <View style={styles.pillRow}>
        {DURATIONS.map((dur) => (
          <PrimaryButton
            key={dur.id}
            label={dur.label}
            onPress={() => setDurationSec(dur.seconds)}
            disabled={durationSec === dur.seconds}
          />
        ))}
      </View>

      <PrimaryButton
        label="Start Trip"
        onPress={() => startTrip(selectedCrew, locationId, durationSec)}
        disabled={!canStart}
      />

      <Text style={styles.sectionTitle}>Active Trips</Text>
      {activeTrips.length === 0 ? (
        <Text style={styles.empty}>No trips yet.</Text>
      ) : (
        activeTrips.map((trip) => {
          const remaining = Math.max(0, Math.ceil((trip.endsAt - now()) / 1000));
          const ready = remaining <= 0;
          return (
            <View key={trip.id} style={styles.card}>
              <Text style={styles.cardTitle}>{trip.locationId.replace('_', ' ')}</Text>
              <Text style={styles.cardMeta}>
                Crew: {trip.crewIds.length} • {formatSeconds(remaining)}
              </Text>
              {trip.resolved && trip.rewards ? (
                <Text style={styles.cardMeta}>Claimed +{trip.rewards.fishCurrency} fish</Text>
              ) : (
                <PrimaryButton
                  label={ready ? 'Claim Rewards' : 'In Progress'}
                  onPress={() => {
                    if (ready) handleClaim(trip.id);
                  }}
                  disabled={!ready}
                />
              )}
            </View>
          );
        })
      )}

      <Modal visible={rewardModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Trip Rewards</Text>
            <Text style={styles.modalMeta}>{lastRewards?.outcomeLabel}</Text>
            <Text style={styles.modalMeta}>Coins: +{lastRewards?.coins ?? 0}</Text>
            <Text style={styles.modalMeta}>Fish Currency: +{lastRewards?.fishCurrency ?? 0}</Text>
            <Text style={styles.modalMeta}>XP: +{lastRewards?.xp ?? 0}</Text>
            <Text style={styles.modalMeta}>Shells: +{lastRewards?.shells ?? 0}</Text>
            <Text style={styles.modalMeta}>Treasure: {lastRewards?.treasure ? 'Yes' : 'No'}</Text>
            <Text style={styles.sectionTitle}>Fish Caught</Text>
            <View style={styles.fishGrid}>
              {lastRewards && lastRewards.fish.length > 0 ? (
                lastRewards.fish.map((fish) => (
                  <View
                    key={fish.id}
                    style={[styles.fishCard, { borderColor: rarityBorder(fish.rarity) }]}
                  >
                    <Text style={styles.fishName}>{fish.name}</Text>
                    <Text style={styles.fishValue}>+{fish.value} fish</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.modalMeta}>No fish caught.</Text>
              )}
            </View>
            <PrimaryButton label="Close" onPress={() => setRewardModal(false)} />
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
    marginBottom: 4,
    color: '#3A2416'
  },
  sub: {
    color: '#7A5A44'
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '700'
  },
  empty: {
    color: '#8A6D5C'
  },
  row: {
    marginBottom: 8,
    backgroundColor: '#FFF1E2',
    borderRadius: 12,
    padding: 8
  },
  rowText: {
    marginBottom: 6,
    color: '#4A2E1F'
  },
  listBox: {
    maxHeight: 220
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  card: {
    backgroundColor: '#FFF1E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
  },
  cardTitle: {
    fontWeight: '700'
  },
  cardMeta: {
    color: '#7A5A44',
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
    marginBottom: 4
  },
  fishGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 12
  },
  fishCard: {
    width: '30%',
    margin: '1.5%',
    borderWidth: 2,
    borderRadius: 12,
    padding: 6,
    backgroundColor: '#FFFDF9'
  },
  fishName: {
    fontWeight: '700',
    fontSize: 12,
    color: '#3A2416'
  },
  fishValue: {
    color: '#7A5A44',
    fontSize: 11
  }
});
