// Automatic count finding: a first draft of the taps, from the recording itself. Clean-room, after the published
// method (Ellis 2007, "Beat tracking by dynamic programming"): find where the sound hits, find the pulse those hits
// repeat at, then choose the beat times that best fit both. A drill writer then fixes the spots it got wrong.

const HOP = 256 / 22050; // seconds between analysis frames (~11.6 ms)

/** Mono samples at `rate` → the times (seconds) of every beat it hears. */
export function findBeats(samples: Float32Array, rate: number, opts: { bpm?: [number, number] } = {}): { beats: number[]; bpm: number } {
  const env = onsetStrength(samples, rate);
  const [lo, hi] = opts.bpm ?? [60, 200];
  const period = localPeriods(env, lo, hi); // frames per beat, frame by frame (follows tempo changes)
  const beats = track(env, period).map((f) => f * HOP);
  const gaps = beats.slice(1).map((b, i) => b - beats[i]).sort((a, b) => a - b);
  return { beats, bpm: gaps.length ? 60 / gaps[gaps.length >> 1] : 0 };
}

/** How strongly new sound starts in each frame (spectral flux on a log-compressed spectrum), normalized. */
export function onsetStrength(samples: Float32Array, rate: number): Float32Array {
  const x = rate === 22050 ? samples : resample(samples, rate, 22050);
  const N = 1024, hop = 256, frames = Math.max(0, Math.floor((x.length - N) / hop) + 1);
  const win = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
  const re = new Float32Array(N), im = new Float32Array(N);
  let prev = new Float32Array(N / 2), cur = new Float32Array(N / 2);
  const flux = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < N; i++) { re[i] = x[f * hop + i] * win[i]; im[i] = 0; }
    fft(re, im);
    for (let k = 0; k < N / 2; k++) cur[k] = Math.log1p(100 * Math.hypot(re[k], im[k]));
    let s = 0;
    if (f) for (let k = 1; k < N / 2; k++) { const d = cur[k] - prev[k]; if (d > 0) s += d; }
    flux[f] = s;
    [prev, cur] = [cur, prev];
  }
  // Remove the slow swell (loud vs. soft passages) so a soft section's attacks still count, then normalize.
  const w = Math.round(1 / HOP), out = new Float32Array(frames);
  let sum = 0;
  for (let f = 0; f < frames; f++) {
    sum += flux[f] - (f >= w ? flux[f - w] : 0);
    out[f] = Math.max(0, flux[f] - sum / Math.min(f + 1, w));
  }
  const sd = Math.sqrt(out.reduce((s, v) => s + v * v, 0) / Math.max(1, frames)) || 1;
  return out.map((v) => v / sd);
}

/**
 * Beat length (frames) around each frame: autocorrelation over a sliding ~8 s window, biased toward a moderate
 * tempo (~120) and toward the previous window's answer, so it follows real tempo changes without jumping octaves.
 */
export function localPeriods(env: Float32Array, loBpm: number, hiBpm: number): Float32Array {
  const fps = 1 / HOP, minLag = Math.round((60 / hiBpm) * fps), maxLag = Math.round((60 / loBpm) * fps);
  const win = Math.round(8 * fps), step = Math.round(1 * fps);
  const centers: number[] = [], lags: number[] = [];
  let last = 0;
  for (let c = 0; c < env.length; c += step) {
    const a = Math.max(0, c - (win >> 1)), b = Math.min(env.length, c + (win >> 1)); // whole frames: a fraction indexes nothing
    let best = 0, bestLag = last || Math.round(0.5 * fps);
    for (let lag = minLag; lag <= maxLag; lag++) {
      let s = 0;
      for (let i = a; i + lag < b; i++) s += env[i] * env[i + lag];
      s /= Math.max(1, b - a - lag);
      const prior = Math.exp(-0.5 * (Math.log2((60 * fps) / lag / 120) / 0.9) ** 2); // ~120 bpm, wide
      const keep = last ? Math.exp(-0.5 * (Math.log2(lag / last) / 0.35) ** 2) * 0.3 + 0.7 : 1; // lean toward the last answer
      if (s * prior * keep > best) { best = s * prior * keep; bestLag = lag; }
    }
    centers.push(c); lags.push(bestLag); last = bestLag;
  }
  const out = new Float32Array(env.length);
  for (let f = 0, j = 0; f < env.length; f++) {
    while (j + 1 < centers.length && centers[j + 1] <= f) j++;
    out[f] = lags[j];
  }
  return out;
}

/** Dynamic programming: beats on strong onsets, spaced close to the local beat length. Returns frame numbers. */
function track(env: Float32Array, period: Float32Array, tightness = 400): number[] {
  const n = env.length, score = new Float32Array(n), from = new Int32Array(n).fill(-1);
  for (let t = 0; t < n; t++) {
    const p = period[t];
    let best = 0, arg = -1;
    for (let q = Math.max(0, t - Math.round(2 * p)); q <= t - Math.round(p / 2); q++) {
      const v = score[q] - tightness * Math.log((t - q) / p) ** 2;
      if (arg < 0 || v > best) { best = v; arg = q; }
    }
    score[t] = env[t] + (arg >= 0 ? Math.max(0, best) : 0);
    from[t] = arg >= 0 && best > 0 ? arg : -1;
  }
  // End on the best-scoring frame within the last beat, then follow the chain back.
  let t = n - 1;
  for (let q = Math.max(0, n - Math.round(period[n - 1] || 1)); q < n; q++) if (score[q] > score[t]) t = q;
  const beats: number[] = [];
  for (; t >= 0; t = from[t]) beats.push(t);
  return beats.reverse();
}

/** In-place radix-2 FFT (length must be a power of two). */
function fft(re: Float32Array, im: Float32Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
}

/** Linear-interpolation resampling (good enough for finding attacks). */
function resample(x: Float32Array, from: number, to: number): Float32Array {
  const out = new Float32Array(Math.floor((x.length * to) / from));
  for (let i = 0; i < out.length; i++) {
    const p = (i * from) / to, k = Math.floor(p), f = p - k;
    out[i] = x[k] * (1 - f) + (x[k + 1] ?? x[k]) * f;
  }
  return out;
}
