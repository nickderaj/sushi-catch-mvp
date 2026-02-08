import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RARITY_LABEL, SPECIES } from '../data/gameData';
import type { Character } from '../state/gameTypes';
import { rarityColor } from '../utils/rarity';

type Props = {
  characters: Character[];
  selected: string[];
  onToggle: (id: string) => void;
  max: number;
  title?: string;
  disabledIds?: string[];
};

export const CrewPicker: React.FC<Props> = ({
  characters,
  selected,
  onToggle,
  max,
  title = 'Select Crew',
  disabledIds = []
}) => {
  const [expanded, setExpanded] = useState(true);

  const sorted = useMemo(() => {
    return [...characters].sort((a, b) => {
      const rarDiff = Number(b.rarity) - Number(a.rarity);
      if (rarDiff !== 0) return rarDiff;
      const sumA =
        a.stats.power +
        a.stats.dexterity +
        a.stats.speed +
        a.stats.luck +
        a.stats.expertise +
        a.stats.charisma;
      const sumB =
        b.stats.power +
        b.stats.dexterity +
        b.stats.speed +
        b.stats.luck +
        b.stats.expertise +
        b.stats.charisma;
      return sumB - sumA;
    });
  }, [characters]);

  const selectedChars = useMemo(() => {
    return characters.filter((c) => selected.includes(c.id));
  }, [characters, selected]);

  if (characters.length === 0) {
    return <Text style={styles.empty}>No characters yet. Hatch some eggs first.</Text>;
  }

  return (
    <View>
      <Pressable style={styles.header} onPress={() => setExpanded((v) => !v)}>
        <Text style={styles.headerText}>
          {title} ({selected.length}/{max})
        </Text>
        <Text style={styles.arrow}>{expanded ? '\u25B2' : '\u25BC'}</Text>
      </Pressable>

      {selectedChars.length > 0 && (
        <View style={styles.chipRow}>
          {selectedChars.map((c) => {
            const color = rarityColor(c.rarity);
            return (
              <View key={c.id} style={[styles.chip, { borderColor: color }]}>
                <Text style={styles.chipText}>{c.name}</Text>
              </View>
            );
          })}
        </View>
      )}

      {expanded &&
        sorted.map((char) => {
          const isSelected = selected.includes(char.id);
          const isBusy = disabledIds.includes(char.id);
          const color = rarityColor(char.rarity);
          const species = SPECIES.find((s) => s.id === char.speciesId);
          const atMax = selected.length >= max;
          const cantAdd = !isSelected && (atMax || isBusy);

          return (
            <View
              key={char.id}
              style={[styles.row, { borderLeftColor: color }, isBusy && styles.busyRow]}
            >
              <View style={styles.rowInfo}>
                <Text style={[styles.charName, isBusy && styles.busyText]}>
                  {char.name} <Text style={styles.levelBadge}>Lv.{char.level}</Text>
                </Text>
                <Text style={styles.charMeta}>
                  {species?.name ?? 'Unknown'} {'\u00B7'}{' '}
                  <Text style={{ color }}>{RARITY_LABEL[char.rarity]}</Text>
                  {isBusy ? <Text style={styles.busyLabel}> (Busy)</Text> : null}
                </Text>
              </View>
              <Pressable
                style={[
                  styles.toggleBtn,
                  isSelected ? styles.removeBtn : styles.addBtn,
                  cantAdd && styles.disabledBtn
                ]}
                onPress={() => onToggle(char.id)}
                disabled={cantAdd}
              >
                <Text style={styles.toggleText}>{isSelected ? '\u2212' : '+'}</Text>
              </Pressable>
            </View>
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: {
    color: '#8A6D5C'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  headerText: {
    fontWeight: '700',
    fontSize: 15
  },
  arrow: {
    fontSize: 14,
    color: '#7A5A44'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6
  },
  chip: {
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFF5EA'
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A2416'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBDC',
    borderRadius: 10,
    borderLeftWidth: 4,
    padding: 10,
    marginBottom: 8
  },
  rowInfo: {
    flex: 1
  },
  charName: {
    fontWeight: '700',
    color: '#3A2416'
  },
  charMeta: {
    color: '#7A5A44',
    fontSize: 13,
    marginTop: 2
  },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addBtn: {
    backgroundColor: '#22C55E'
  },
  removeBtn: {
    backgroundColor: '#EF4444'
  },
  disabledBtn: {
    backgroundColor: '#C8B7AC'
  },
  toggleText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20
  },
  busyRow: {
    opacity: 0.5
  },
  busyText: {
    color: '#8A6D5C'
  },
  busyLabel: {
    color: '#B45309',
    fontWeight: '600'
  },
  levelBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A5A44'
  }
});
