import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { linkHash } from '../engine/share';

/**
 * Scan a Freeform QR code with the camera, from inside the app. On iPhone, scanning with the
 * Camera app always opens Safari, which can't hand the show to the home-screen app.
 */
export function Scanner({ onClose }: { onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [msg, setMsg] = useState('Starting the camera…');
  const close = useRef(onClose);
  close.current = onClose; // the parent passes a new function each render; don't restart the camera for it
  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const tick = () => {
      if (stopped) return;
      const v = video.current;
      if (v && v.readyState >= 2 && v.videoWidth) {
        const scale = Math.min(1, 640 / v.videoWidth); // smaller frames decode fast enough for every frame
        canvas.width = Math.round(v.videoWidth * scale);
        canvas.height = Math.round(v.videoHeight * scale);
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (code) {
          const hash = linkHash(code.data);
          if (hash) { stopped = true; location.hash = hash; close.current(); return; }
          setMsg("That QR code isn't a Freeform show link.");
        }
      }
      raf = requestAnimationFrame(tick);
    };
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        if (stopped) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        video.current!.srcObject = s;
        video.current!.play().catch(() => {});
        setMsg('Point the camera at the show’s QR code.');
        raf = requestAnimationFrame(tick);
      })
      .catch(() => setMsg('The camera isn’t available. Allow camera access for Freeform in Settings, or paste the link instead.'));
    return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label="Scan QR code"
      style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 }}>
      <video ref={video} playsInline muted style={{ maxWidth: '100%', maxHeight: '70vh', background: '#111' }} />
      <p role="status" style={{ margin: 0, textAlign: 'center', color: '#fff' }}>{msg}</p>
      <button onClick={onClose} style={{ fontSize: 16 }}>Cancel</button>
    </div>
  );
}
