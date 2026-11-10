// Where this browser keeps each show's publishing: its hosted link (with the key) and, for a show on FreeFORM's service,
// the id and edit token. Shared by the Share dialog, Full backup, and Open from a link.
import type { CloudShow, Publishing } from '../engine/cloud';

const LINKS = 'freeform:hosted-links'; // per show id (or title, for a show from before ids)
const CLOUD = 'freeform:cloud';
const read = <T,>(k: string): Record<string, T> => { try { return JSON.parse(localStorage.getItem(k) ?? '{}') ?? {}; } catch { return {}; } };
const write = (k: string, v: Record<string, unknown>) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* not remembered */ } };

export const loadLinks = () => read<string>(LINKS);
export const saveLink = (id: string, link: string | null) => { const all = loadLinks(); if (link) all[id] = link; else delete all[id]; write(LINKS, all); };
export const loadCloud = () => read<CloudShow>(CLOUD);
export const saveCloud = (id: string, c: CloudShow | null) => { const all = loadCloud(); if (c) all[id] = { id: c.id, token: c.token }; else delete all[id]; write(CLOUD, all); };

/** This show's publishing, to carry to another device, or null if it hasn't been published from here. */
export function getPublishing(sid: string, title?: string): Publishing | null {
  const link = loadLinks()[sid] ?? (title ? loadLinks()[title] : undefined);
  if (!link) return null;
  const cloud = loadCloud()[sid];
  return { link, ...(cloud ? { cloud } : {}), show: { id: sid, title } };
}

/** Take on publishing brought from another device (a Full backup or a publishing code). */
export function setPublishing(sid: string, p: Publishing) {
  saveLink(sid, p.link);
  saveCloud(sid, p.cloud ?? null);
}
