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

export const ROLES = ['Fisher', 'Diver', 'Speedster', 'Tanker', 'Chef', 'Merchant'] as const;
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
    expertise: number;
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
      power: 52,
      dexterity: 55,
      speed: 50,
      luck: 48,
      expertise: 54,
      charisma: 50
    },
    fishingBias: 2,
    kitchenBias: 1
  },
  {
    id: 'tanuki',
    name: 'Tanuki Trickster',
    bio: 'A playful shapeshifter who loves risky trips and fast service.',
    baselineStats: {
      power: 50,
      dexterity: 52,
      speed: 56,
      luck: 54,
      expertise: 48,
      charisma: 52
    },
    fishingBias: 2,
    kitchenBias: 0
  },
  {
    id: 'axolotl',
    name: 'Axolotl Diver',
    bio: 'A deep-water explorer that specializes in rare finds.',
    baselineStats: {
      power: 54,
      dexterity: 58,
      speed: 46,
      luck: 55,
      expertise: 50,
      charisma: 45
    },
    fishingBias: 3,
    kitchenBias: 0
  },
  {
    id: 'crane',
    name: 'Crane Chef',
    bio: 'Elegant and focused, elevates sushi quality with delicate technique.',
    baselineStats: {
      power: 46,
      dexterity: 50,
      speed: 48,
      luck: 50,
      expertise: 60,
      charisma: 55
    },
    fishingBias: 0,
    kitchenBias: 3
  },
  {
    id: 'seal',
    name: 'Harbor Seal',
    bio: 'Friendly and efficient, keeps the shop running smoothly.',
    baselineStats: {
      power: 48,
      dexterity: 46,
      speed: 50,
      luck: 52,
      expertise: 55,
      charisma: 60
    },
    fishingBias: 0,
    kitchenBias: 3
  },
  {
    id: 'catfish',
    name: 'Catfish Captain',
    bio: 'A tough leader who excels at hauling big catches.',
    baselineStats: {
      power: 60,
      dexterity: 48,
      speed: 44,
      luck: 46,
      expertise: 48,
      charisma: 45
    },
    fishingBias: 3,
    kitchenBias: 0
  },
  {
    id: 'squid',
    name: 'Ink Squid',
    bio: 'Quick hands and sly tactics; great in both river and kitchen.',
    baselineStats: {
      power: 50,
      dexterity: 56,
      speed: 54,
      luck: 50,
      expertise: 52,
      charisma: 50
    },
    fishingBias: 2,
    kitchenBias: 1
  },
  {
    id: 'turtle',
    name: 'Sea Turtle',
    bio: 'Slow but dependable, adds stability to any crew.',
    baselineStats: {
      power: 52,
      dexterity: 44,
      speed: 40,
      luck: 58,
      expertise: 54,
      charisma: 48
    },
    fishingBias: 1,
    kitchenBias: 1
  }
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

export const KITCHEN_SHIFTS = [
  { id: 'short', label: '2h', seconds: 2 * 60 * 60 },
  { id: 'medium', label: '4h', seconds: 4 * 60 * 60 },
  { id: 'long', label: '8h', seconds: 8 * 60 * 60 }
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
