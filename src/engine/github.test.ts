import { describe, expect, it } from 'vitest';
import { checkRepo, fileNameFor, publishFile } from './github';

const t = { token: 'github_pat_x', repo: 'Tillerdawg/freeform-shows' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

/** A fake GitHub: records calls; `file` is the existing file's sha (or none). */
function fake(repo: object = { default_branch: 'main', private: false, permissions: { push: true } }, file?: string, putStatus = 201) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url.endsWith('/repos/Tillerdawg/freeform-shows')) return json(repo);
    if (init?.method === 'PUT') return json({}, putStatus);
    return file ? json({ sha: file }) : json({ message: 'Not Found' }, 404);
  }) as typeof fetch;
  return { f, calls };
}

describe('publishing to GitHub', () => {
  it('creates a new file and returns its raw address', async () => {
    const { f, calls } = fake();
    const url = await publishFile(t, fileNameFor('WBHS 2010: Closer!'), '{"format":"freeform-locked"}', f);
    expect(url).toBe('https://raw.githubusercontent.com/Tillerdawg/freeform-shows/main/WBHS-2010-Closer.freeform-locked');
    const put = calls.find((c) => c.init?.method === 'PUT')!;
    const body = JSON.parse(String(put.init!.body));
    expect(atob(body.content)).toBe('{"format":"freeform-locked"}');
    expect(body.sha).toBeUndefined();
    expect((put.init!.headers as Record<string, string>).Authorization).toBe('Bearer github_pat_x');
    expect(calls.every((c) => c.url.startsWith('https://api.github.com/'))).toBe(true); // the token goes only to GitHub's API
  });
  it('replaces an existing file (same address, so phones pick up the update)', async () => {
    const { f, calls } = fake(undefined, 'abc123');
    await publishFile(t, 'show.freeform-locked', 'x', f);
    expect(JSON.parse(String(calls.find((c) => c.init?.method === 'PUT')!.init!.body)).sha).toBe('abc123');
  });
  it('explains what went wrong', async () => {
    await expect(checkRepo({ ...t, repo: 'not a repo' })).rejects.toThrow(/owner\/name/);
    await expect(checkRepo(t, fake({ default_branch: 'main', private: true }).f)).rejects.toThrow(/private/);
    await expect(checkRepo(t, (async () => json({}, 401)) as typeof fetch)).rejects.toThrow(/token/);
    await expect(checkRepo(t, (async () => json({}, 404)) as typeof fetch)).rejects.toThrow(/Contents: Read and write/);
    await expect(publishFile(t, 'x', 'y', fake(undefined, undefined, 422).f)).rejects.toThrow(/too big/);
    await expect(checkRepo(t, (async () => { throw new TypeError('offline'); }) as typeof fetch)).rejects.toThrow(/connection/);
  });
});
