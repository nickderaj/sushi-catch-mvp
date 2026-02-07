import React, { useMemo, useState, useEffect } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PrimaryButton } from '../components/PrimaryButton';
import { KITCHEN_SHIFTS } from '../data/gameData';
import { useGame } from '../state/GameContext';
import { playReward } from '../utils/sfx';
import { formatSeconds, now } from '../utils/time';
import type { KitchenRewards } from '../state/gameTypes';

export const RestaurantScreen: React.FC = () => {
  const {
    state,
    collectIdle,
    tapServe,
    autoServe,
    upgradeRestaurant,
    startKitchenShift,
    claimKitchenShift
  } = useGame();
  const [localCombo, setLocalCombo] = useState(1);
  const [lastTap, setLastTap] = useState(0);
  const [selectedFishIds, setSelectedFishIds] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [shiftDuration, setShiftDuration] = useState(KITCHEN_SHIFTS[0].seconds);
  const [lastServeSummary, setLastServeSummary] = useState<string>('');
  const [rewardModal, setRewardModal] = useState(false);
  const [lastRewards, setLastRewards] = useState<KitchenRewards | null>(null);
  const [, setTick] = useState(0);

  const hasFish = state.fishInventory.some((fish) => fish.count > 0);
  const activeShift = state.kitchenShifts.find((shift) => !shift.resolved);
  const hasActiveShift = !!activeShift && activeShift.endsAt > now();

  useEffect(() => {
    if (!hasActiveShift) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [hasActiveShift]);

  const fishOptions = useMemo(() => {
    return state.fishInventory.filter((fish) => fish.count > 0);
  }, [state.fishInventory]);

  const handleTap = () => {
    const nowMs = Date.now();
    const delta = nowMs - lastTap;
    if (delta < 2000) {
      setLocalCombo((prev) => Math.min(state.restaurant.comboMax, prev + 1));
    } else {
      setLocalCombo(1);
    }
    setLastTap(nowMs);
    const result = tapServe(selectedFishIds);
    if (result.served === 0) {
      setLastServeSummary('No fish selected to serve.');
      return;
    }
    setLastServeSummary(`Served ${result.served} fish for +${result.coins} coins.`);
  };

  const toggleStaff = (id: string) => {
    setSelectedStaff((prev) => {
      if (prev.includes(id)) return prev.filter((staffId) => staffId !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleClaimShift = (shiftId: string) => {
    const rewards = claimKitchenShift(shiftId);
    if (rewards) {
      setLastRewards(rewards);
      setRewardModal(true);
      playReward().catch(() => undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Restaurant</Text>
      <Text style={styles.balance}>Coins: {state.coins}</Text>
      <Text style={styles.sub}>Idle: {state.restaurant.coinsPerMin} coins/min (cap 8h)</Text>
      <PrimaryButton
        label="Collect Idle Earnings"
        onPress={() => {
          collectIdle();
          playReward().catch(() => undefined);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
            () => undefined
          );
        }}
      />

      <View style={styles.tapCard}>
        <Text style={styles.sectionTitle}>Serve Customers</Text>
        {!hasFish ? (
          <Text style={styles.warning}>No fish left to serve. Send a crew fishing.</Text>
        ) : (
          <Text style={styles.sub}>
            Choose fish to serve or auto-serve. Combo up to {state.restaurant.comboMax}x.
          </Text>
        )}
        {hasFish ? (
          <View style={styles.fishList}>
            {fishOptions.map((fish) => {
              const selected = selectedFishIds.includes(fish.id);
              return (
                <View key={fish.id} style={styles.fishRow}>
                  <Text style={styles.fishLabel}>
                    {fish.name} • {fish.rarity}★ • x{fish.count}
                  </Text>
                  <PrimaryButton
                    label={selected ? 'Remove' : 'Add'}
                    onPress={() => {
                      setSelectedFishIds((prev) =>
                        selected ? prev.filter((id) => id !== fish.id) : [...prev, fish.id]
                      );
                    }}
                  />
                </View>
              );
            })}
          </View>
        ) : null}
        <PrimaryButton
          label={`Tap to Serve (x${localCombo})`}
          onPress={() => {
            handleTap();
            Haptics.selectionAsync().catch(() => undefined);
          }}
          disabled={!hasFish}
        />
        <PrimaryButton
          label="Auto-Serve Any Fish"
          onPress={() => {
            const result = autoServe();
            if (result.served === 0) {
              setLastServeSummary('No fish available to auto-serve.');
              return;
            }
            setLastServeSummary(`Auto-served ${result.served} fish for +${result.coins} coins.`);
            playReward().catch(() => undefined);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
              () => undefined
            );
          }}
          disabled={!hasFish}
        />
        {lastServeSummary ? <Text style={styles.sub}>{lastServeSummary}</Text> : null}
      </View>

      <View style={styles.shiftCard}>
        <Text style={styles.sectionTitle}>Kitchen Staff</Text>
        <Text style={styles.sub}>Assign 1-3 pets to run the shop.</Text>
        {state.ownedCharacters.length === 0 ? (
          <Text style={styles.warning}>No pets yet.</Text>
        ) : (
          state.ownedCharacters.map((char) => (
            <View key={char.id} style={styles.fishRow}>
              <Text style={styles.fishLabel}>
                {char.name} • {char.role} • EXP {char.stats.expertise} • CHA {char.stats.charisma}
              </Text>
              <PrimaryButton
                label={selectedStaff.includes(char.id) ? 'Remove' : 'Add'}
                onPress={() => toggleStaff(char.id)}
                disabled={!selectedStaff.includes(char.id) && selectedStaff.length >= 3}
              />
            </View>
          ))
        )}

        <View style={styles.pillRow}>
          {KITCHEN_SHIFTS.map((shift) => (
            <PrimaryButton
              key={shift.id}
              label={shift.label}
              onPress={() => setShiftDuration(shift.seconds)}
              disabled={shiftDuration === shift.seconds}
            />
          ))}
        </View>

        <PrimaryButton
          label={hasActiveShift ? 'Shift Running' : 'Start Kitchen Shift'}
          onPress={() => startKitchenShift(selectedStaff, shiftDuration)}
          disabled={hasActiveShift || selectedStaff.length === 0}
        />

        {activeShift ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Active Shift</Text>
            <Text style={styles.cardMeta}>
              Staff: {activeShift.staffIds.length} •{' '}
              {formatSeconds(Math.max(0, Math.ceil((activeShift.endsAt - now()) / 1000)))}
            </Text>
            {activeShift.resolved && activeShift.rewards ? (
              <Text style={styles.cardMeta}>Claimed +{activeShift.rewards.coins} coins</Text>
            ) : (
              <PrimaryButton
                label={activeShift.endsAt <= now() ? 'Claim Shift Rewards' : 'In Progress'}
                onPress={() => handleClaimShift(activeShift.id)}
                disabled={activeShift.endsAt > now()}
              />
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.upgradeCard}>
        <Text style={styles.sectionTitle}>Upgrades (50 coins)</Text>
        <PrimaryButton
          label="Increase Throughput"
          onPress={() => upgradeRestaurant('throughput')}
        />
        <PrimaryButton label="Increase Customer Rate" onPress={() => upgradeRestaurant('rate')} />
      </View>

      <Modal visible={rewardModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Kitchen Shift Results</Text>
            <Text style={styles.modalMeta}>{lastRewards?.details}</Text>
            <Text style={styles.modalMeta}>Served: {lastRewards?.served ?? 0}</Text>
            <Text style={styles.modalMeta}>Bonus: +{lastRewards?.bonus ?? 0}</Text>
            <Text style={styles.modalMeta}>Coins: +{lastRewards?.coins ?? 0}</Text>
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
  tapCard: {
    marginTop: 16,
    backgroundColor: '#FFF1E2',
    padding: 12,
    borderRadius: 16
  },
  shiftCard: {
    marginTop: 16,
    backgroundColor: '#FFF1E2',
    padding: 12,
    borderRadius: 16
  },
  upgradeCard: {
    marginTop: 16,
    backgroundColor: '#FFF1E2',
    padding: 12,
    borderRadius: 16
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 6
  },
  fishList: {
    marginVertical: 8
  },
  fishRow: {
    backgroundColor: '#FFEBDC',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8
  },
  fishLabel: {
    marginBottom: 6,
    color: '#4A2E1F'
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  card: {
    backgroundColor: '#FFEBDC',
    borderRadius: 12,
    padding: 12,
    marginTop: 8
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
