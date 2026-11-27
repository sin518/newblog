import fs from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';

export const prerender = false;

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

export const GET: APIRoute = async ({ params }) => {
  const relPath = params.path ?? '';
  if (!relPath || relPath.includes('..')) {
    return new Response(null, { status: 404 });
  }

  const resolved = path.resolve(UPLOADS_ROOT, relPath);
  if (!resolved.startsWith(UPLOADS_ROOT + path.sep)) {
    return new Response(null, { status: 403 });
  }

  try {
    const data = await fs.readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_MAP[ext] ?? 'application/octet-stream';
    return new Response(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
};
