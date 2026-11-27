function getEnv(key: string): string {
  return process.env[key] ?? (import.meta.env as Record<string, string | undefined>)[key] ?? '';
}

export function isGitHubStoreEnabled(): boolean {
  return Boolean(getEnv('GITHUB_TOKEN'));
}

function getGitHubConfig() {
  const token = getEnv('GITHUB_TOKEN');
  const repo = getEnv('GITHUB_REPO') || 'sin518/newblog';
  const branch = getEnv('GITHUB_BRANCH') || 'main';
  return { token, repo, branch };
}

function encodeGitHubPath(repoPath: string): string {
  return repoPath
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

async function getFileSha(repoPath: string): Promise<string | undefined> {
  const { token, repo, branch } = getGitHubConfig();
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${encodeGitHubPath(repoPath)}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );
  if (!res.ok) return undefined;
  const data = (await res.json()) as { sha?: string };
  return data.sha;
}

export async function readGitHubFile(repoPath: string): Promise<Buffer | null> {
  const { token, repo, branch } = getGitHubConfig();
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${encodeGitHubPath(repoPath)}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'application/vnd.github.raw+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );
  if (!res.ok) return null;
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export async function putGitHubFile(
  repoPath: string,
  content: Buffer | string,
  message: string,
): Promise<void> {
  const { token, repo, branch } = getGitHubConfig();
  const sha = await getFileSha(repoPath);
  const b64 = Buffer.isBuffer(content)
    ? content.toString('base64')
    : Buffer.from(content, 'utf8').toString('base64');

  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${encodeGitHubPath(repoPath)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        message,
        content: b64,
        branch,
        ...(sha ? { sha } : {}),
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${errText}`);
  }
}

export async function deleteGitHubFile(repoPath: string, message: string): Promise<void> {
  const { token, repo, branch } = getGitHubConfig();
  const sha = await getFileSha(repoPath);
  if (!sha) return;

  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${encodeGitHubPath(repoPath)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        message,
        sha,
        branch,
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub API delete error (${res.status}): ${errText}`);
  }
}
