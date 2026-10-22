/** "8-to-5", "5.3-to-5", or "hold". */
export const fmtStep = (per5: number) => (per5 === Infinity ? 'hold' : `${Math.round(per5 * 10) / 10}-to-5`);
