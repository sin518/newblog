import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { APIRoute } from 'astro';
import { SITE } from '~/config';
import { deleteGitHubFile, isGitHubStoreEnabled, putGitHubFile } from '~/lib/github-store';

export const prerender = false;

const POSTS_ROOT = path.resolve(process.cwd(), 'src/content/posts');

function resolveSafePostPath(relId: string | null): string | null {
  if (!relId || relId.includes('..')) return null;
  const resolved = path.resolve(POSTS_ROOT, relId);
  if (!resolved.startsWith(POSTS_ROOT + path.sep)) return null;
  return resolved;
}

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  const fullPath = resolveSafePostPath(id);
  if (!fullPath || !id) {
    return new Response(JSON.stringify({ error: '无效的文章 ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  try {
    const raw = await fs.readFile(fullPath, 'utf8');
    const parsed = matter(raw);
    const fm = (parsed.data ?? {}) as Record<string, unknown>;
    const segs = id.split('/');
    const locale =
      segs[0] && (SITE.locales as readonly string[]).includes(segs[0])
        ? segs[0]
        : SITE.defaultLocale;
    const slug = segs.slice(1).join('/').replace(/\.(md|mdx)$/i, '');

    const pubDate =
      fm.pubDate instanceof Date
        ? fm.pubDate.toISOString().slice(0, 10)
        : typeof fm.pubDate === 'string'
          ? fm.pubDate.slice(0, 10)
          : new Date().toISOString().slice(0, 10);

    return new Response(
      JSON.stringify({
        id,
        locale,
        slug,
        title: typeof fm.title === 'string' ? fm.title : slug,
        description: typeof fm.description === 'string' ? fm.description : '',
        pubDate,
        tags: Array.isArray(fm.tags) ? fm.tags : [],
        categories: Array.isArray(fm.categories) ? fm.categories : [],
        hidden: Boolean(fm.hidden),
        draft: Boolean(fm.draft),
        pinned: Boolean(fm.pinned),
        heroImage: typeof fm.heroImage === 'string' ? fm.heroImage : '',
        body: parsed.content,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      },
    );
  } catch {
    return new Response(JSON.stringify({ error: '文章不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const payload = (await request.json()) as {
      id?: string;
      hidden?: boolean;
      draft?: boolean;
      pinned?: boolean;
    };
    const fullPath = resolveSafePostPath(payload.id ?? null);
    if (!fullPath) {
      return new Response(JSON.stringify({ error: '无效的文章 ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const raw = await fs.readFile(fullPath, 'utf8');
    const parsed = matter(raw);
    const data = { ...(parsed.data ?? {}) } as Record<string, unknown>;

    if (typeof payload.hidden === 'boolean') data.hidden = payload.hidden;
    if (typeof payload.draft === 'boolean') data.draft = payload.draft;
    if (typeof payload.pinned === 'boolean') data.pinned = payload.pinned;

    const updatedContent = matter.stringify(parsed.content, data);
    if (isGitHubStoreEnabled() && payload.id) {
      await putGitHubFile(
        `src/content/posts/${payload.id}`,
        updatedContent,
        `chore: update post ${payload.id}`,
      );
    } else {
      await fs.writeFile(fullPath, updatedContent, 'utf8');
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '更新状态失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  const fullPath = resolveSafePostPath(id);
  if (!fullPath) {
    return new Response(JSON.stringify({ error: '无效的文章 ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  try {
    if (isGitHubStoreEnabled() && id) {
      await deleteGitHubFile(`src/content/posts/${id}`, `chore: delete post ${id}`);
    } else {
      await fs.unlink(fullPath);
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '删除文章失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};
