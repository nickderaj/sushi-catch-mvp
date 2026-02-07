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
