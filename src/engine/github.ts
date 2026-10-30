// Publish a locked show file to the director's own GitHub repository, so sharing is one click: no download, no manual
// upload. The token is the director's (a fine-grained token that can write only to that repository); it's sent only to
// api.github.com. Phones then read the file from raw.githubusercontent.com, which lets other sites read public files.

export interface GitHubTarget { token: string; repo: string } // repo: "owner/name"

export const REPO_RE = /^[\w.-]{1,100}\/[\w.-]{1,100}$/;
const API = 'https://api.github.com';

/** A file name for a show: its title, made safe for an address. */
export const fileNameFor = (title: string) => `${title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'show'}.freeform-locked`;

const b64 = (text: string) => {
  const b = new TextEncoder().encode(text);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
};

async function call(t: GitHubTarget, path: string, fetcher: typeof fetch, init?: RequestInit): Promise<Response> {
  try {
    return await fetcher(API + path, { ...init, headers: { Authorization: `Bearer ${t.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...init?.headers } });
  } catch {
    throw new Error("Couldn't reach GitHub. Check your connection.");
  }
}

const why = (r: Response, repo: string) =>
  r.status === 401 ? 'GitHub didn\'t accept the token (it may have expired). Make a new one and connect again.'
  : r.status === 403 || r.status === 404 ? `The token can't write to ${repo}. Check the repository name, and that the token has "Contents: Read and write" for that repository.`
  : r.status === 422 || r.status === 413 ? 'GitHub turned the file down (it may be too big).'
  : `GitHub said ${r.status}.`;

/** Check the token and repository; returns the branch files go on. */
export async function checkRepo(t: GitHubTarget, fetcher: typeof fetch = fetch): Promise<string> {
  if (!REPO_RE.test(t.repo)) throw new Error('The repository should look like owner/name, e.g. Tillerdawg/freeform-shows.');
  const r = await call(t, `/repos/${t.repo}`, fetcher);
  if (!r.ok) throw new Error(why(r, t.repo));
  const j = await r.json();
  if (j.private) throw new Error(`${t.repo} is private, so phones can't download from it. Make it public (the show files are encrypted).`);
  if (j.permissions && !j.permissions.push) throw new Error(`The token can't write to ${t.repo}.`);
  return typeof j.default_branch === 'string' ? j.default_branch : 'main';
}

/** Create or replace `name` in the repository with `content`; returns the address phones download it from. */
export async function publishFile(t: GitHubTarget, name: string, content: string, fetcher: typeof fetch = fetch): Promise<string> {
  const branch = await checkRepo(t, fetcher);
  const path = `/repos/${t.repo}/contents/${encodeURIComponent(name)}`;
  const old = await call(t, `${path}?ref=${encodeURIComponent(branch)}`, fetcher);
  if (!old.ok && old.status !== 404) throw new Error(why(old, t.repo));
  const sha = old.ok ? (await old.json()).sha : undefined; // replacing a file needs its current version
  const put = await call(t, path, fetcher, { method: 'PUT', body: JSON.stringify({ message: `Publish ${name}`, content: b64(content), branch, ...(sha ? { sha } : {}) }) });
  if (!put.ok) throw new Error(why(put, t.repo));
  return `https://raw.githubusercontent.com/${t.repo}/${encodeURIComponent(branch)}/${encodeURIComponent(name)}`;
}
