import {
  RARITY_RATES,
  Rarity,
  ROLES,
  CHARACTER_NAMES,
  FISH_TYPES,
  SPECIES,
  SpeciesId
} from '../data/gameData';

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

export const randomSpeciesId = (): SpeciesId => {
  return SPECIES[Math.floor(Math.random() * SPECIES.length)].id;
};

export const rollStats = (speciesId: SpeciesId): StatBlock => {
  const species = SPECIES.find((entry) => entry.id === speciesId) ?? SPECIES[0];
  const variance = rand(-8, 8) / 100;
  const base = species.baselineStats;
  const biasFishing = species.fishingBias;
  const biasKitchen = species.kitchenBias;

  const applyVariance = (value: number) => Math.round(value * (1 + variance) + rand(-4, 4));

  return {
    power: applyVariance(base.power + biasFishing * 2),
    dexterity: applyVariance(base.dexterity + biasFishing * 2),
    speed: applyVariance(base.speed + biasFishing),
    luck: applyVariance(base.luck + biasFishing),
    expertise: applyVariance(base.expertise + biasKitchen * 2),
    charisma: applyVariance(base.charisma + biasKitchen * 2)
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
