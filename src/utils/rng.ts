import { RARITY_RATES, Rarity, ROLES, CHARACTER_NAMES, FISH_TYPES } from '../data/gameData';

export type StatBlock = {
  power: number;
  dexterity: number;
  speed: number;
  luck: number;
  expertise: number;
  charisma: number;
};

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export const rollRarity = (): Rarity => {
  const total = RARITY_RATES.reduce((sum, r) => sum + r.weight, 0);
  const roll = Math.random() * total;
  let acc = 0;
  for (const r of RARITY_RATES) {
    acc += r.weight;
    if (roll <= acc) return r.rarity;
  }
  return '1';
};

export const rollStats = (): StatBlock => {
  // Baseline 50 with +/- 8% variance
  const base = 50;
  const variance = rand(-8, 8) / 100;
  const roll = (bias = 0) => Math.round(base * (1 + variance) + rand(-6, 6) + bias);
  return {
    power: roll(),
    dexterity: roll(),
    speed: roll(),
    luck: roll(),
    expertise: roll(),
    charisma: roll()
  };
};

export const randomName = () => {
  return CHARACTER_NAMES[Math.floor(Math.random() * CHARACTER_NAMES.length)];
};

export const randomRole = () => {
  return ROLES[Math.floor(Math.random() * ROLES.length)];
};

export const randomFish = () => {
  return FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)];
};
