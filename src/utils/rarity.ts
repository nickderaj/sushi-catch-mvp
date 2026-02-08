import type { Rarity } from '../data/gameData';

export const RARITY_COLOR: Record<Rarity, string> = {
  '1': '#FFFFFF',
  '2': '#22C55E',
  '3': '#3B82F6',
  '4': '#A855F7',
  '5': '#F59E0B'
};

export const rarityColor = (rarity: string | null): string => {
  if (!rarity) return '#A3A3A3';
  return RARITY_COLOR[rarity as Rarity] ?? '#FFFFFF';
};
