import { describe, expect, it } from 'vitest';
import { HASHES, frontToBack, ftlPositions, readout, sideToSide, stepSize } from './coords';

describe('readouts (IDEA.md examples)', () => {
  it('45" right of Side 2 45, 45" in front of front hash', () => {
    expect(readout({ x: 8 + 2, y: HASHES.college - 2 }, 'college')).toBe(
      '2 steps outside the Side 2 45, 2 steps in front of Front Hash',
    );
  });
  it('splitting 40 and 45 on Side 1', () => {
    expect(sideToSide(-12)).toBe('Splitting 40 and 45 on Side 1');
    expect(sideToSide(-20)).toBe('Splitting 35 and 40 on Side 1');
  });
  it('on the 50 has no side', () => expect(sideToSide(0)).toBe('On the 50'));
  it('near the 50 is always outside', () => {
    expect(sideToSide(-2)).toBe('2 steps outside the 50 on Side 1');
    expect(sideToSide(1)).toBe('1 step outside the 50 on Side 2');
  });
  it('inside / on a yard line', () => {
    expect(sideToSide(14)).toBe('2 steps inside the Side 2 40');
    expect(sideToSide(-24)).toBe('On the Side 1 35');
  });
  it('quarter-step rounding', () => expect(sideToSide(10.8)).toBe('2.75 steps outside the Side 2 45'));
  it('goal line and beyond', () => {
    expect(sideToSide(-80)).toBe('On the Side 1 Goal Line');
    expect(sideToSide(-83)).toBe('3 steps outside the Side 1 Goal Line');
  });
  it('front-to-back references', () => {
    expect(frontToBack(0, 'highSchool')).toBe('On Front Sideline');
    expect(frontToBack(5, 'highSchool')).toBe('5 steps behind Front Sideline');
    expect(frontToBack(HASHES.nfl + 3, 'nfl')).toBe('3 steps behind Front Hash');
    expect(frontToBack(85.333 - 1, 'college')).toBe('1 step in front of Back Sideline');
  });
});

describe('step size', () => {
  it('8-to-5 is ok, 6-to-5 boundary ok, smaller is yellow, below 4-to-5 red', () => {
    expect(stepSize(16, 16)).toEqual({ per5: 8, tier: 'ok' });
    expect(stepSize(16 * 8 / 6, 16).tier).toBe('ok');
    expect(stepSize(16 * 8 / 5, 16).tier).toBe('yellow');
    expect(stepSize(32, 16).tier).toBe('yellow'); // exactly 4-to-5
    expect(stepSize(40, 16).tier).toBe('red');
  });
  it('holds have no minimum', () => expect(stepSize(0, 8)).toEqual({ per5: Infinity, tier: 'ok' }));
});

describe('follow-the-leader (IDEA.md example)', () => {
  // Front hash, Side 1 40 to the 50: A on the 40, B split, C on 45, D split, E on 50. A marches 16 forward.
  const h = HASHES.highSchool;
  const starts = [-16, -12, -8, -4, 0].map((x) => ({ x, y: h }));
  const end = { x: -16, y: h - 16 };
  const near = (p: { x: number; y: number }, x: number, y: number) => {
    expect(p.x).toBeCloseTo(x);
    expect(p.y).toBeCloseTo(y);
  };
  it('ends in a line on the Side 1 40, 4 steps apart', () => {
    ftlPositions(starts, end, 1).forEach((p, i) => near(p, -16, h - 16 + 4 * i));
  });
  it('B turns at count 4: 4 left, then forward', () => {
    near(ftlPositions(starts, end, 4 / 16)[1], -16, h);
    near(ftlPositions(starts, end, 8 / 16)[1], -16, h - 4);
  });
  it('E takes 16 counts left', () => near(ftlPositions(starts, end, 8 / 16)[4], -8, h));
});
