import React, { useMemo, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { LOCATIONS, DURATIONS } from '../data/gameData';
import { useGame } from '../state/GameContext';
import { formatSeconds, now } from '../utils/time';

export const FishScreen: React.FC = () => {
  const { state, startTrip, claimTrip } = useGame();
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]);
  const [locationId, setLocationId] = useState(LOCATIONS[0].id);
  const [durationSec, setDurationSec] = useState(DURATIONS[0].seconds);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Fishing Expeditions</Text>

      <Text style={styles.sectionTitle}>Select Crew (1-3)</Text>
      {state.ownedCharacters.length === 0 ? (
        <Text style={styles.empty}>No characters yet. Hatch some eggs first.</Text>
      ) : (
        state.ownedCharacters.map((char) => (
          <View key={char.id} style={styles.row}>
            <Text style={styles.rowText}>{char.name} • {char.role} • {char.rarity}★</Text>
            <PrimaryButton
              label={selectedCrew.includes(char.id) ? 'Remove' : 'Add'}
              onPress={() => toggleCrew(char.id)}
              disabled={!selectedCrew.includes(char.id) && selectedCrew.length >= 3}
            />
          </View>
        ))
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

      <PrimaryButton label="Start Trip" onPress={() => startTrip(selectedCrew, locationId, durationSec)} disabled={!canStart} />

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
              <Text style={styles.cardMeta}>Crew: {trip.crewIds.length} • {formatSeconds(remaining)}</Text>
              {trip.resolved && trip.rewards ? (
                <Text style={styles.cardMeta}>Claimed: {trip.rewards.outcomeLabel} (+{trip.rewards.coins} coins)</Text>
              ) : (
                <PrimaryButton label={ready ? 'Claim Rewards' : 'In Progress'} onPress={() => claimTrip(trip.id)} disabled={!ready} />
              )}
            </View>
          );
        })
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
  }
});
