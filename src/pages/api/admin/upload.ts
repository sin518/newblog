import fs from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';

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
    const targetDir = path.join(UPLOADS_ROOT, ym);
    await fs.mkdir(targetDir, { recursive: true });

    const safeBase = sanitizeBaseName(file.name);
    const filename = `${Date.now()}-${safeBase}${ext}`;
    const targetPath = path.join(targetDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(targetPath, buffer);

    const url = `/uploads/${ym}/${filename}`;
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
  } catch {
    return new Response(JSON.stringify({ error: '图片上传失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};
