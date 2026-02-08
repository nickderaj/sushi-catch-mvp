import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MAX_LEVEL, RARITY_LABEL, SPECIES, XP_THRESHOLDS } from '../data/gameData';
import type { Character } from '../state/gameTypes';
import { rarityColor } from '../utils/rarity';
import { StatBlockView } from './StatBlock';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  character: Character | null;
  visible: boolean;
  onClose: () => void;
  onRename?: (id: string, name: string) => void;
};

export const CharacterDetailModal: React.FC<Props> = ({
  character,
  visible,
  onClose,
  onRename
}) => {
  const [draft, setDraft] = useState('');
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    if (character) setDraft(character.name);
  }, [character?.id]);

  const saveName = () => {
    if (!character || !onRename) return;
    const trimmed = draftRef.current.trim();
    if (trimmed && trimmed !== character.name) {
      onRename(character.id, trimmed);
    }
  };

  const handleClose = () => {
    saveName();
    onClose();
  };

  if (!character) return null;

  const species = SPECIES.find((s) => s.id === character.speciesId);
  const color = rarityColor(character.rarity);
  const stars = '\u2605'.repeat(Number(character.rarity));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.card, { borderColor: color }]} onPress={() => {}}>
          <Text style={styles.speciesName}>{species?.name ?? 'Unknown'}</Text>
          <Text style={styles.bio}>{species?.bio ?? ''}</Text>

          {onRename ? (
            <TextInput
              style={styles.nameInput}
              value={draft}
              onChangeText={setDraft}
              maxLength={20}
              onEndEditing={saveName}
              onSubmitEditing={saveName}
            />
          ) : (
            <Text style={styles.charName}>{character.name}</Text>
          )}

          <Text style={[styles.rarity, { color }]}>
            {RARITY_LABEL[character.rarity]} {stars}
          </Text>
          <Text style={styles.role}>{character.role}</Text>

          <View style={styles.levelRow}>
            <Text style={styles.levelText}>Lv. {character.level}</Text>
            {character.level < MAX_LEVEL ? (
              <View style={styles.xpBarOuter}>
                <View
                  style={[
                    styles.xpBarInner,
                    {
                      width: `${Math.round(((character.xp - XP_THRESHOLDS[character.level]) / (XP_THRESHOLDS[character.level + 1] - XP_THRESHOLDS[character.level])) * 100)}%`
                    }
                  ]}
                />
              </View>
            ) : (
              <Text style={styles.maxLabel}>MAX</Text>
            )}
            {character.level < MAX_LEVEL ? (
              <Text style={styles.xpText}>
                {character.xp - XP_THRESHOLDS[character.level]}/
                {XP_THRESHOLDS[character.level + 1] - XP_THRESHOLDS[character.level]}
              </Text>
            ) : null}
          </View>

          <View style={styles.statsSection}>
            <StatBlockView stats={character.stats} />
          </View>

          <PrimaryButton label="Close" onPress={handleClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    backgroundColor: '#FFF1E2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 3
  },
  speciesName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3A2416',
    marginBottom: 4
  },
  bio: {
    color: '#7A5A44',
    marginBottom: 12
  },
  charName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3A2416',
    marginBottom: 8
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3A2416',
    borderBottomWidth: 2,
    borderBottomColor: '#F47C3C',
    paddingVertical: 4,
    marginBottom: 8
  },
  rarity: {
    fontWeight: '700',
    marginBottom: 4
  },
  role: {
    color: '#7A5A44',
    marginBottom: 8
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8
  },
  levelText: {
    fontWeight: '700',
    color: '#3A2416',
    fontSize: 14
  },
  xpBarOuter: {
    flex: 1,
    height: 8,
    backgroundColor: '#E8D5C4',
    borderRadius: 4,
    overflow: 'hidden'
  },
  xpBarInner: {
    height: '100%',
    backgroundColor: '#F47C3C',
    borderRadius: 4
  },
  xpText: {
    fontSize: 12,
    color: '#7A5A44'
  },
  maxLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B'
  },
  statsSection: {
    marginBottom: 12
  }
});
