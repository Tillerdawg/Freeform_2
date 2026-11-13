// MS Basic's drum programs (zero-based). The older bass and tenor kits use
// different keys, so keep their presets for scores written with those maps.
export const MARCHING_PROGRAMS: readonly number[] = [56, 57, 58, 59, 95, 96];
export const MARCHING_BANK = 1;
export const MARCHING_SOUNDFONT = 'MS-Basic-Marching.sf3';

export const MARCHING_DEFAULT_KEYS: Readonly<Record<number, number>> = { 56: 50, 57: 50, 58: 72, 59: 61, 95: 72, 96: 60 };

export function marchingProgram(name: string): number | undefined {
  if (/\bbattery\s+snare\b/i.test(name)) return 56;
  if (!/\bmarching\b/i.test(name)) return;
  if (/snare/i.test(name)) return 56;
  if (/cymbal/i.test(name)) return 58;
  if (/bass/i.test(name)) return 59;
  if (/tenor|quads|quints/i.test(name)) return 96;
}
