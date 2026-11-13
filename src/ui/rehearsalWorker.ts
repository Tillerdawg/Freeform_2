// Renders a rehearsal track off the main thread (a few seconds for a whole show), reporting progress as it goes.
import { renderMidi } from '../engine/rehearsal';

const post = (msg: unknown, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(msg, transfer);

self.onmessage = async (e: MessageEvent<{ bank: ArrayBuffer; midi: ArrayBuffer }>) => {
  try {
    const r = await renderMidi(e.data.bank, e.data.midi, (done) => post({ progress: done }));
    post({ done: r }, [r.left.buffer, r.right.buffer]);
  } catch (err) {
    post({ error: err instanceof Error ? err.message : String(err) });
  }
};
