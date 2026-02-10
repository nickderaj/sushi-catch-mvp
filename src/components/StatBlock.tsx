import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StatBlock } from '../utils/rng';

const STAT_CONFIG: Array<{ key: keyof StatBlock; color: string; label: string }> = [
  { key: 'power', color: '#EF4444', label: 'PWR' },
  { key: 'dexterity', color: '#22C55E', label: 'DEX' },
  { key: 'speed', color: '#38BDF8', label: 'SPD' },
  { key: 'luck', color: '#F59E0B', label: 'LCK' },
  { key: 'stamina', color: '#A855F7', label: 'STA' },
  { key: 'charisma', color: '#EC4899', label: 'CHA' }
];

export const StatBlockView: React.FC<{ stats: StatBlock }> = ({ stats }) => {
  return (
    <View style={styles.container}>
      {STAT_CONFIG.map((stat) => (
        <View key={stat.key} style={styles.row}>
          <View style={[styles.icon, { backgroundColor: stat.color }]} />
          <Text style={styles.label}>{stat.label}</Text>
          <Text style={styles.value}>{stats[stat.key]}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5EA',
    padding: 8,
    borderRadius: 10
  },
  row: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  icon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6
  },
  label: {
    fontWeight: '700',
    fontSize: 12,
    marginRight: 6,
    color: '#3A2416'
  },
  value: {
    fontWeight: '600'
  }
});
