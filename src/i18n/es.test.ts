import { describe, expect, it } from 'vitest';
import { ES } from './es';
import { tr } from './index';
import { moveWords, stepWords, yardLabel } from '../perform/neighbors';
import { fmtStep } from '../ui/format';

// Every string the code asks to translate, tr('…'), has its Spanish (so nothing turns up in English on a Spanish phone).
const code = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const asked = [...new Set(Object.values(code).flatMap((src) => [...src.matchAll(/\btr\((['"])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2].replace(/\\(['"])/g, '$1'))))];

describe('Spanish', () => {
  it('has every string the code translates', () => {
    expect(asked.length).toBeGreaterThan(50);
    expect(asked.filter((s) => !(s in ES))).toEqual([]);
  });
  it('keeps every {placeholder}', () => {
    for (const [en, es] of Object.entries(ES)) expect([...es.matchAll(/\{\w+\}/g)].map(String).sort(), en).toEqual([...en.matchAll(/\{\w+\}/g)].map(String).sort());
  });
  it('fills in placeholders, and leaves English alone', () => {
    expect(tr('Set {name}', { name: '4A' }, 'es')).toBe('Set 4A');
    expect(tr('Next: set {name} in {n} cts', { name: 3, n: 16 }, 'es')).toBe('Siguiente: set 3 en 16 tiempos');
    expect(tr('Next: set {name} in {n} cts', { name: 3, n: 16 }, 'en')).toBe('Next: set 3 in 16 cts');
    expect(tr('Not in the list yet', undefined, 'es')).toBe('Not in the list yet');
  });
  it('says steps, directions, and yard lines in Spanish', () => {
    expect(stepWords(8, 'es')).toBe('tamaño de paso normal');
    expect(moveWords({ x: 0, y: 20 }, { x: 8, y: 30 }, 'es')).toBe('moviéndote hacia atrás y a tu izquierda (mirando al frente)');
    expect(moveWords({ x: 0, y: 20 }, { x: 8, y: 30 }, 'en')).toBe('moving back and to your left (facing the front)');
    expect(yardLabel(-8, 'es')).toBe('L1 45');
    expect([fmtStep(8, 'es'), fmtStep(Infinity, 'es'), fmtStep(5.33)]).toEqual(['8 a 5', 'mantener', '5.3-to-5']);
  });
});
