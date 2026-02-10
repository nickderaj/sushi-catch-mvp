import { MAX_LEVEL, XP_THRESHOLDS } from '../data/gameData';

export const getLevelForXp = (xp: number) => {
  for (let level = MAX_LEVEL; level >= 1; level -= 1) {
    if (xp >= XP_THRESHOLDS[level]) return level;
  }
  return 1;
};

export const getXpProgress = (xp: number) => {
  const level = getLevelForXp(xp);
  const current = XP_THRESHOLDS[level];
  const next = level >= MAX_LEVEL ? current : XP_THRESHOLDS[level + 1];
  const span = Math.max(1, next - current);
  const progress = level >= MAX_LEVEL ? 1 : Math.min(1, (xp - current) / span);
  return { level, current, next, progress };
};
