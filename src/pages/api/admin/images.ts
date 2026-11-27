import fs from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';

export const prerender = false;

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');
const ALLOWED_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif']);

async function walkImages(dir: string): Promise<Array<{ url: string; name: string; mtime: number }>> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const results: Array<{ url: string; name: string; mtime: number }> = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkImages(full)));
    } else if (entry.isFile() && ALLOWED_EXTS.has(path.extname(entry.name).toLowerCase())) {
      const stat = await fs.stat(full);
      const rel = path.relative(UPLOADS_ROOT, full).replace(/\\/g, '/');
      results.push({
        url: `/uploads/${rel}`,
        name: entry.name,
        mtime: stat.mtimeMs,
      });
    }
  }
  return results;
}

export const GET: APIRoute = async () => {
  const images = (await walkImages(UPLOADS_ROOT)).sort((a, b) => b.mtime - a.mtime);
  return new Response(JSON.stringify({ images }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
