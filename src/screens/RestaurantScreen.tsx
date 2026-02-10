import React, { useMemo, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PrimaryButton } from '../components/PrimaryButton';
import { useGame } from '../state/GameContext';
import { playReward } from '../utils/sfx';

export const RestaurantScreen: React.FC = () => {
  const {
    state,
    collectIdle,
    setRestaurantStaff,
    upgradeRestaurant,
    getIdlePreview,
    getFishConsumedPerMin
  } = useGame();
  const [selectedStaff, setSelectedStaff] = useState<string[]>(state.restaurantStaffIds);
  const [xpModal, setXpModal] = useState(false);
  const [xpSummary, setXpSummary] = useState<Array<{ id: string; xp: number }>>([]);

  useEffect(() => {
    setSelectedStaff(state.restaurantStaffIds);
  }, [state.restaurantStaffIds]);

  const staff = useMemo(() => {
    return state.ownedCharacters.filter((char) => selectedStaff.includes(char.id));
  }, [state.ownedCharacters, selectedStaff]);

  const idleRate = useMemo(() => {
    const charismaSum = staff.reduce((sum, char) => sum + char.stats.charisma, 0);
    const multiplier = 1 + charismaSum / 40;
    const base = Math.max(2, state.restaurant.coinsPerMin);
    return Math.max(1, Math.round(base * multiplier));
  }, [staff, state.restaurant.coinsPerMin]);

  const idleCap = useMemo(() => {
    const staminaSum = staff.reduce((sum, char) => sum + char.stats.stamina, 0);
    return 8 * 60 + Math.floor(staminaSum / 2);
  }, [staff]);

  const idlePreview = getIdlePreview();
  const fishPerMin = getFishConsumedPerMin();

  const toggleStaff = (id: string) => {
    setSelectedStaff((prev) => {
      if (prev.includes(id)) return prev.filter((staffId) => staffId !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const applyStaff = () => {
    setRestaurantStaff(selectedStaff);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Restaurant</Text>
      <Text style={styles.balance}>Coins: {state.coins}</Text>
      <Text style={styles.sub}>Fish Currency: {state.fishCurrency}</Text>
      <Text style={styles.sub}>Idle Rate: {idleRate} coins/min</Text>
      <Text style={styles.sub}>Fish Consumed: {fishPerMin} / min</Text>
      <Text style={styles.sub}>Idle Cap: {idleCap} min</Text>
      <Text style={styles.sub}>Idle Earnings Ready: +{idlePreview.coins} coins</Text>
      <PrimaryButton
        label="Collect Idle Earnings"
        onPress={() => {
          const summary = collectIdle();
          setXpSummary(summary.staffXp);
          setXpModal(true);
          playReward().catch(() => undefined);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
            () => undefined
          );
        }}
      />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Kitchen Staff (Pick up to 3)</Text>
        {state.ownedCharacters.length === 0 ? (
          <Text style={styles.warning}>No pets yet.</Text>
        ) : (
          <View style={styles.listBox}>
            <ScrollView>
              {state.ownedCharacters.map((char) => {
                const isOnTrip = state.trips.some(
                  (trip) =>
                    !trip.resolved && trip.endsAt > Date.now() && trip.crewIds.includes(char.id)
                );
                return (
                  <View key={char.id} style={styles.row}>
                    <Text style={styles.rowText}>
                      {char.name} • {char.role} • STA {char.stats.stamina} • CHA{' '}
                      {char.stats.charisma}
                    </Text>
                    <PrimaryButton
                      label={selectedStaff.includes(char.id) ? 'Remove' : 'Add'}
                      onPress={() => toggleStaff(char.id)}
                      disabled={
                        isOnTrip || (!selectedStaff.includes(char.id) && selectedStaff.length >= 3)
                      }
                    />
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
        <PrimaryButton label="Apply Staff" onPress={applyStaff} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Upgrades (50 coins)</Text>
        <PrimaryButton
          label="Increase Throughput"
          onPress={() => upgradeRestaurant('throughput')}
        />
        <PrimaryButton label="Increase Customer Rate" onPress={() => upgradeRestaurant('rate')} />
      </View>

      {xpModal ? (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Kitchen XP Earned</Text>
            {xpSummary.length === 0 ? (
              <Text style={styles.modalMeta}>No staff assigned.</Text>
            ) : (
              xpSummary.map((entry) => {
                const name = state.ownedCharacters.find((c) => c.id === entry.id)?.name ?? 'Staff';
                return (
                  <Text key={entry.id} style={styles.modalMeta}>
                    {name}: +{entry.xp} XP
                  </Text>
                );
              })
            )}
            <PrimaryButton label="Close" onPress={() => setXpModal(false)} />
          </View>
        </View>
      ) : null}
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
  balance: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6
  },
  sub: {
    color: '#7A5A44'
  },
  warning: {
    color: '#B45309',
    fontWeight: '600',
    marginBottom: 6
  },
  card: {
    marginTop: 16,
    backgroundColor: '#FFF1E2',
    padding: 12,
    borderRadius: 16
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 6
  },
  row: {
    backgroundColor: '#FFEBDC',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8
  },
  rowText: {
    marginBottom: 6,
    color: '#4A2E1F'
  },
  listBox: {
    maxHeight: 220
  },
  modalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8
  },
  modalMeta: {
    color: '#7A5A44',
    marginBottom: 4
  }
});
