export const now = () => Date.now();

export const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

export const formatSeconds = (seconds: number) => {
  if (seconds <= 0) return 'Ready';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};
