export type Rarity = '1' | '2' | '3' | '4' | '5';

export const RARITY_LABEL: Record<Rarity, string> = {
  '1': 'Common',
  '2': 'Uncommon',
  '3': 'Rare',
  '4': 'Epic',
  '5': 'Legendary'
};

export const RARITY_RATES: { rarity: Rarity; weight: number }[] = [
  { rarity: '1', weight: 51.2 },
  { rarity: '2', weight: 30 },
  { rarity: '3', weight: 15 },
  { rarity: '4', weight: 3 },
  { rarity: '5', weight: 0.8 }
];

export const ROLES = ['Fisher', 'Diver', 'Speedster', 'Blessed', 'Chef', 'Merchant'] as const;
export type Role = (typeof ROLES)[number];

export type SpeciesId =
  | 'koi'
  | 'tanuki'
  | 'axolotl'
  | 'crane'
  | 'seal'
  | 'catfish'
  | 'squid'
  | 'turtle';

export type Species = {
  id: SpeciesId;
  name: string;
  bio: string;
  baselineStats: {
    power: number;
    dexterity: number;
    speed: number;
    luck: number;
    stamina: number;
    charisma: number;
  };
  fishingBias: number;
  kitchenBias: number;
};

export const SPECIES: Species[] = [
  {
    id: 'koi',
    name: 'Koi Sprite',
    bio: 'A calm river guardian with steady hands and a taste for precision.',
    baselineStats: {
      power: 2,
      dexterity: 4,
      speed: 1,
      luck: 1,
      stamina: 3,
      charisma: 2
    },
    fishingBias: 2,
    kitchenBias: 1
  },
  {
    id: 'tanuki',
    name: 'Tanuki Trickster',
    bio: 'A playful shapeshifter who loves risky trips and fast service.',
    baselineStats: {
      power: 1,
      dexterity: 2,
      speed: 4,
      luck: 3,
      stamina: 1,
      charisma: 2
    },
    fishingBias: 2,
    kitchenBias: 0
  },
  {
    id: 'axolotl',
    name: 'Axolotl Diver',
    bio: 'A deep-water explorer that specializes in rare finds.',
    baselineStats: {
      power: 3,
      dexterity: 4,
      speed: 1,
      luck: 4,
      stamina: 1,
      charisma: 0
    },
    fishingBias: 3,
    kitchenBias: 0
  },
  {
    id: 'crane',
    name: 'Crane Chef',
    bio: 'Elegant and focused, elevates sushi quality with delicate technique.',
    baselineStats: {
      power: 0,
      dexterity: 2,
      speed: 1,
      luck: 1,
      stamina: 4,
      charisma: 3
    },
    fishingBias: 0,
    kitchenBias: 3
  },
  {
    id: 'seal',
    name: 'Harbor Seal',
    bio: 'Friendly and efficient, keeps the shop running smoothly.',
    baselineStats: {
      power: 1,
      dexterity: 1,
      speed: 2,
      luck: 2,
      stamina: 3,
      charisma: 4
    },
    fishingBias: 0,
    kitchenBias: 3
  },
  {
    id: 'catfish',
    name: 'Catfish Captain',
    bio: 'A tough leader who excels at hauling big catches.',
    baselineStats: {
      power: 5,
      dexterity: 1,
      speed: 0,
      luck: 1,
      stamina: 1,
      charisma: 1
    },
    fishingBias: 3,
    kitchenBias: 0
  },
  {
    id: 'squid',
    name: 'Ink Squid',
    bio: 'Quick hands and sly tactics; great in both river and kitchen.',
    baselineStats: {
      power: 1,
      dexterity: 3,
      speed: 4,
      luck: 1,
      stamina: 1,
      charisma: 2
    },
    fishingBias: 2,
    kitchenBias: 1
  },
  {
    id: 'turtle',
    name: 'Sea Turtle',
    bio: 'Slow but dependable, adds stability to any crew.',
    baselineStats: {
      power: 2,
      dexterity: 1,
      speed: 0,
      luck: 4,
      stamina: 3,
      charisma: 1
    },
    fishingBias: 1,
    kitchenBias: 1
  }
];

export const EGG_TYPES: Array<{ rarity: Rarity; label: string; shellCost: number }> = [
  { rarity: '1', label: 'Common Egg', shellCost: 10 },
  { rarity: '2', label: 'Uncommon Egg', shellCost: 25 },
  { rarity: '3', label: 'Rare Egg', shellCost: 60 },
  { rarity: '4', label: 'Epic Egg', shellCost: 120 },
  { rarity: '5', label: 'Legendary Egg', shellCost: 250 }
];

export const LOCATIONS = [
  { id: 'shallow_bay', name: 'Shallow Bay' },
  { id: 'coral_reef', name: 'Coral Reef' },
  { id: 'deep_ocean', name: 'Deep Ocean' },
  { id: 'midnight_trench', name: 'Midnight Trench' }
] as const;

export const DURATIONS = [
  { id: 'short', label: '10s', seconds: 10 },
  { id: 'medium', label: '30s', seconds: 30 },
  { id: 'long', label: '60s', seconds: 60 }
] as const;

export const CHARACTER_NAMES = [
  'Maki',
  'Sora',
  'Kibo',
  'Yuzu',
  'Tama',
  'Rin',
  'Nori',
  'Bento',
  'Kai',
  'Sumi',
  'Tofu',
  'Goma',
  'Miso',
  'Kuro',
  'Aki',
  'Saba'
];

export const FISH_TYPES = [
  'Salmon',
  'Tuna',
  'Mackerel',
  'Eel',
  'Shrimp',
  'Octopus',
  'Crab',
  'Yellowtail',
  'Snapper',
  'Sardine',
  'Halibut',
  'Clam',
  'Scallop',
  'Squid',
  'Sea Urchin',
  'Trout',
  'Herring',
  'Cod',
  'Marlin',
  'Swordfish',
  'Lobster',
  'Seabass',
  'Kelp Carp',
  'Moonfish'
];

export const MAX_LEVEL = 20;

const generateXpThresholds = () => {
  const levels = MAX_LEVEL;
  const start = 10;
  const end = 18000;
  const thresholds: number[] = Array.from({ length: levels + 1 }, () => 0);
  for (let level = 2; level <= levels; level += 1) {
    const t = (level - 2) / (levels - 2);
    const xp = Math.round(start * Math.pow(end / start, t));
    thresholds[level] = xp;
  }
  return thresholds;
};

export const XP_THRESHOLDS = generateXpThresholds();
