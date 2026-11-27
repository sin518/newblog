import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { APIRoute } from 'astro';
import { SITE, type Locale } from '~/config';
import { getAllPostsForAdmin, postPath, postSlug } from '~/utils/posts';

export const prerender = false;

const POSTS_ROOT = path.resolve(process.cwd(), 'src/content/posts');

function resolveSafePostPath(relId: string): string | null {
  if (!relId || relId.includes('..')) return null;
  const resolved = path.resolve(POSTS_ROOT, relId);
  if (!resolved.startsWith(POSTS_ROOT + path.sep)) return null;
  return resolved;
}

function sanitizeSlug(raw: string): string {
  return raw
    .trim()
    .replace(/[\\/]+/g, '-')
    .replace(/\.\.+/g, '')
    .replace(/\.(md|mdx)$/i, '')
    .replace(/^-+|-+$/g, '');
}

export const GET: APIRoute = async () => {
  const posts = await getAllPostsForAdmin();
  const items = posts.map((p) => ({
    id: p.id,
    locale: p.data.lang,
    slug: postSlug(p),
    url: postPath(p),
    title: p.data.title,
    description: p.data.description,
    pubDate: p.data.pubDate.toISOString().slice(0, 10),
    tags: p.data.tags,
    categories: p.data.categories,
    hidden: Boolean(p.data.hidden),
    draft: Boolean(p.data.draft),
    pinned: Boolean(p.data.pinned),
    unlisted: Boolean(p.data.unlisted),
    heroImage: typeof p.data.heroImage === 'string' ? p.data.heroImage : '',
  }));

  return new Response(JSON.stringify({ posts: items }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = (await request.json()) as {
      originalId?: string;
      locale?: string;
      slug?: string;
      title?: string;
      description?: string;
      pubDate?: string;
      tags?: string[] | string;
      categories?: string[] | string;
      hidden?: boolean;
      draft?: boolean;
      pinned?: boolean;
      heroImage?: string;
      body?: string;
    };

    const locale: Locale =
      payload.locale && (SITE.locales as readonly string[]).includes(payload.locale)
        ? (payload.locale as Locale)
        : SITE.defaultLocale;

    const title = (payload.title ?? '').trim();
    if (!title) {
      return new Response(JSON.stringify({ error: '文章标题不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const slug = sanitizeSlug(payload.slug || title) || `post-${Date.now()}`;
    const targetId = `${locale}/${slug}.md`;
    const targetPath = resolveSafePostPath(targetId);
    if (!targetPath) {
      return new Response(JSON.stringify({ error: '非法文件路径' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    // Preserve existing frontmatter keys when editing
    let existingData: Record<string, unknown> = {};
    if (payload.originalId) {
      const oldPath = resolveSafePostPath(payload.originalId);
      if (oldPath) {
        try {
          const oldRaw = await fs.readFile(oldPath, 'utf8');
          existingData = matter(oldRaw).data ?? {};
        } catch {
          // Ignore if original file does not exist
        }
      }
    }

    const toArray = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
      if (typeof v === 'string') {
        return v
          .split(/[,，]/)
          .map((x) => x.trim())
          .filter(Boolean);
      }
      return [];
    };

    const frontmatter: Record<string, unknown> = {
      ...existingData,
      title,
      description: (payload.description ?? '').trim() || title,
      pubDate: payload.pubDate || new Date().toISOString().slice(0, 10),
      tags: toArray(payload.tags),
      categories: toArray(payload.categories),
      hidden: Boolean(payload.hidden),
      draft: Boolean(payload.draft),
      pinned: Boolean(payload.pinned),
      toc: existingData.toc ?? true,
    };

    if (payload.heroImage && payload.heroImage.trim()) {
      frontmatter.heroImage = payload.heroImage.trim();
    } else {
      delete frontmatter.heroImage;
    }

    const content = matter.stringify(payload.body ?? '', frontmatter);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, content, 'utf8');

    // Remove old file if renamed / moved locale
    if (payload.originalId && payload.originalId !== targetId) {
      const oldPath = resolveSafePostPath(payload.originalId);
      if (oldPath) {
        await fs.unlink(oldPath).catch(() => {});
      }
    }

    return new Response(JSON.stringify({ ok: true, id: targetId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '保存文章失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};
