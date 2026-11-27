import fs from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { isGitHubStoreEnabled, putGitHubFile } from '~/lib/github-store';

export const prerender = false;

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif']);

function sanitizeBaseName(name: string): string {
  const base = path.basename(name, path.extname(name));
  const cleaned = base
    .replace(/[^\p{Letter}\p{Number}_-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return cleaned || 'image';
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: '未检测到上传文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: '图片大小需在 1B ~ 10MB 之间' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const ext = path.extname(file.name).toLowerCase() || '.png';
    if (!ALLOWED_EXTS.has(ext)) {
      return new Response(
        JSON.stringify({ error: '仅支持 png / jpg / webp / gif / svg / avif 格式图片' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        },
      );
    }

    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const safeBase = sanitizeBaseName(file.name);
    const filename = `${Date.now()}-${safeBase}${ext}`;
    const relPath = `${ym}/${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (isGitHubStoreEnabled()) {
      await putGitHubFile(`public/uploads/${relPath}`, buffer, `chore: upload image ${relPath}`);
    } else {
      const targetDir = path.join(UPLOADS_ROOT, ym);
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(path.join(targetDir, filename), buffer);
    }

    const url = `/uploads/${relPath}`;
    return new Response(
      JSON.stringify({
        ok: true,
        url,
        name: file.name,
        markdown: `![${safeBase}](${url})`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : '图片上传失败';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};
