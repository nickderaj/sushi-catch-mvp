import React, { useMemo, useState, useEffect } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PrimaryButton } from '../components/PrimaryButton';
import { CrewPicker } from '../components/CrewPicker';
import { DURATIONS, LOCATIONS } from '../data/gameData';
import { useGame } from '../state/GameContext';
import { formatSeconds, now } from '../utils/time';
import { playReward } from '../utils/sfx';
import type { TripRewards } from '../state/gameTypes';

export const FishScreen: React.FC = () => {
  const { state, startTrip, claimTrip, busyCharacterIds } = useGame();
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]);
  const [locationId, setLocationId] = useState<string>(LOCATIONS[0].id);
  const [durationSec, setDurationSec] = useState<number>(DURATIONS[0].seconds);
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

      <CrewPicker
        characters={state.ownedCharacters}
        selected={selectedCrew}
        onToggle={toggleCrew}
        max={3}
        title="Select Crew"
        disabledIds={busyCharacterIds}
      />

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
                <Text style={styles.cardMeta}>
                  Claimed: {trip.rewards.outcomeLabel} (+{trip.rewards.coins} coins)
                </Text>
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
            <Text style={styles.modalMeta}>XP: +{lastRewards?.xp ?? 0}</Text>
            <Text style={styles.modalMeta}>Mats: +{lastRewards?.mats ?? 0}</Text>
            <Text style={styles.modalMeta}>Treasure: {lastRewards?.treasure ? 'Yes' : 'No'}</Text>
            <Text style={styles.sectionTitle}>Fish</Text>
            {lastRewards && lastRewards.fish.length > 0 ? (
              lastRewards.fish.map((fish, index) => (
                <Text key={`${fish.id}-${index}`} style={styles.modalMeta}>
                  {fish.name} • {fish.rarity}★
                </Text>
              ))
            ) : (
              <Text style={styles.modalMeta}>No fish caught.</Text>
            )}
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
  }
});
