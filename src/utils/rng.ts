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

/**
 * Each rarity tier gets a flat bonus per stat so tiers never overlap.
 * Rarity 1 (Common):    +0
 * Rarity 2 (Uncommon):  +8
 * Rarity 3 (Rare):      +18
 * Rarity 4 (Epic):      +30
 * Rarity 5 (Legendary): +45
 *
 * On top of the flat bonus, a small random spread (0 to +5) is added.
 * The gap between tiers is always larger than the max spread, so a
 * lower rarity can never out-stat a higher rarity of the same species.
 */
const RARITY_BONUS: Record<Rarity, number> = {
  '1': 0,
  '2': 8,
  '3': 18,
  '4': 30,
  '5': 45
};

export const rollStats = (speciesId: SpeciesId, rarity: Rarity = '1'): StatBlock => {
  const species = SPECIES.find((entry) => entry.id === speciesId) ?? SPECIES[0];
  const base = species.baselineStats;
  const biasFishing = species.fishingBias;
  const biasKitchen = species.kitchenBias;
  const bonus = RARITY_BONUS[rarity];

  const applyStat = (baseValue: number) => {
    return Math.round(baseValue + bonus + rand(0, 5));
  };

  return {
    power: applyStat(base.power + biasFishing * 2),
    dexterity: applyStat(base.dexterity + biasFishing * 2),
    speed: applyStat(base.speed + biasFishing),
    luck: applyStat(base.luck + biasFishing),
    expertise: applyStat(base.expertise + biasKitchen * 2),
    charisma: applyStat(base.charisma + biasKitchen * 2)
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
