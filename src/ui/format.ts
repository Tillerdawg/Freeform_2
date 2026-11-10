/** "8-to-5", "5.3-to-5", or "hold". */
export const fmtStep = (per5: number, lang: 'en' | 'es' = 'en') => {
  const n = Math.round(per5 * 10) / 10;
  if (lang === 'es') return per5 === Infinity ? 'quieto' : `${n} a 5`; // "8 a 5": a first draft, for a Spanish-speaking director to check
  return per5 === Infinity ? 'hold' : `${n}-to-5`;
};
