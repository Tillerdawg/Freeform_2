// Renders a rehearsal track off the main thread (a few seconds for a whole show), reporting progress as it goes.
import { renderMidi } from '../engine/rehearsal';
import type { Midi } from '../engine/midi';
import { scoreMidi, type RehearsalSource } from '../engine/scoreMidi';

const post = (msg: unknown, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(msg, transfer);

self.onmessage = async (e: MessageEvent<{ bank: ArrayBuffer; source: RehearsalSource; map: Midi; marchingUrl: string }>) => {
  try {
    const { bank, source, map, marchingUrl } = e.data;
    const midi = source instanceof ArrayBuffer ? source : scoreMidi(source, map);
    const r = await renderMidi(bank, midi, (done) => post({ progress: done }), async () => {
      post({ instruments: true });
      const response = await fetch(marchingUrl).catch(() => null);
      if (!response?.ok) throw new Error("FreeFORM couldn't download the marching percussion sounds. Check that you're online and try again.");
      return response.arrayBuffer();
    });
    post({ done: r }, [r.left.buffer, r.right.buffer]);
  } catch (err) {
    post({ error: err instanceof Error ? err.message : String(err) });
  }
};
