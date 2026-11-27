/**
 * Post helpers.
 *
 * Reads markdown/mdx files directly from `src/content/posts/<locale>/**` so
 * runtime edits, uploads, and visibility toggles in `/admin` take effect
 * immediately in SSR mode without requiring a rebuild.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

import { SITE, type Locale } from '../config';
import { withBase } from '../i18n/utils';

export type PostData = CollectionEntry<'posts'>['data'] & {
  lang: Locale;
  translationKey: string;
  hidden: boolean;
};

export type Post = Omit<CollectionEntry<'posts'>, 'data'> & {
  data: PostData;
};

export interface PostQueryOptions {
  /** Include posts marked `hidden: true` or `draft: true` (for logged-in owner). */
  includeHidden?: boolean;
  /** Include `unlisted: true` posts. */
  includeUnlisted?: boolean;
}

const POSTS_ROOT = path.resolve(process.cwd(), 'src/content/posts');
const skipPostCollections = import.meta.env.CI_SKIP_CONTENT_COLLECTIONS === 'true';

/** Derive the locale from `posts/<locale>/foo` slug-ish ID. */
function localeFromId(id: string): Locale {
  const seg = id.split(/[\\/]/)[0];
  if (seg && (SITE.locales as readonly string[]).includes(seg)) return seg as Locale;
  return SITE.defaultLocale;
}

/** Strip locale prefix from a content ID. */
function stripLocaleFromId(id: string): string {
  const segs = id.split(/[\\/]/);
  if (segs[0] && (SITE.locales as readonly string[]).includes(segs[0])) {
    return segs.slice(1).join('/');
  }
  return id;
}

async function collectMarkdownFiles(dir: string, baseDir: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(full, baseDir)));
    } else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
      files.push(path.relative(baseDir, full).replace(/\\/g, '/'));
    }
  }
  return files;
}

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function toDate(val: unknown, fallback: Date): Date {
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return fallback;
}

async function loadAllPostsFromDisk(): Promise<Post[]> {
  if (skipPostCollections) return [];
  const relFiles = await collectMarkdownFiles(POSTS_ROOT, POSTS_ROOT);
  const posts: Post[] = [];

  for (const relPath of relFiles) {
    const fullPath = path.join(POSTS_ROOT, relPath);
    try {
      const [raw, stat] = await Promise.all([fs.readFile(fullPath, 'utf8'), fs.stat(fullPath)]);
      const parsed = matter(raw);
      const fm = (parsed.data ?? {}) as Record<string, unknown>;

      const inferredLocale = localeFromId(relPath);
      const lang =
        typeof fm.lang === 'string' && (SITE.locales as readonly string[]).includes(fm.lang)
          ? (fm.lang as Locale)
          : inferredLocale;
      const stripped = stripLocaleFromId(relPath);
      const fallbackTitle = stripped.replace(/\.(md|mdx)$/i, '');

      const data: PostData = {
        title: typeof fm.title === 'string' && fm.title.trim() ? fm.title.trim() : fallbackTitle,
        description:
          typeof fm.description === 'string' && fm.description.trim()
            ? fm.description.trim()
            : fallbackTitle,
        pubDate: toDate(fm.pubDate, stat.mtime),
        updatedDate: fm.updatedDate ? toDate(fm.updatedDate, stat.mtime) : undefined,
        tags: toStringArray(fm.tags),
        categories: toStringArray(fm.categories),
        draft: Boolean(fm.draft),
        hidden: Boolean(fm.hidden),
        heroImage: typeof fm.heroImage === 'string' && fm.heroImage.trim() ? fm.heroImage.trim() : undefined,
        heroImageAlt: typeof fm.heroImageAlt === 'string' ? fm.heroImageAlt : undefined,
        showFeaturedImage:
          typeof fm.showFeaturedImage === 'boolean' ? fm.showFeaturedImage : undefined,
        dynamicPostCardHeight:
          typeof fm.dynamicPostCardHeight === 'boolean' ? fm.dynamicPostCardHeight : undefined,
        canonicalURL: typeof fm.canonicalURL === 'string' ? fm.canonicalURL : undefined,
        comments: typeof fm.comments === 'boolean' ? fm.comments : undefined,
        toc: typeof fm.toc === 'boolean' ? fm.toc : true,
        pinned: Boolean(fm.pinned),
        math: Boolean(fm.math),
        lang,
        translationKey:
          typeof fm.translationKey === 'string' && fm.translationKey.trim()
            ? fm.translationKey.trim()
            : stripped,
        unlisted: Boolean(fm.unlisted),
        unlistedHideFromSeo:
          typeof fm.unlistedHideFromSeo === 'boolean' ? fm.unlistedHideFromSeo : undefined,
      };

      posts.push({
        id: relPath,
        collection: 'posts',
        body: parsed.content,
        filePath: `src/content/posts/${relPath}`,
        data,
      } as Post);
    } catch {
      // Skip malformed files rather than crashing the whole listing
    }
  }

  return posts;
}

/** Public slug used for the URL: filename minus locale and extension. */
export function postSlug(entry: Post): string {
  return stripLocaleFromId(entry.id).replace(/\.(md|mdx)$/i, '');
}

/** Full localized URL path for a post. */
export function postPath(entry: Post): string {
  const slug = postSlug(entry);
  const pathUrl =
    entry.data.lang === SITE.defaultLocale
      ? `/posts/${slug}/`
      : `/${entry.data.lang}/posts/${slug}/`;
  return withBase(pathUrl);
}

/** Sort posts: pinned first, then by pubDate desc. */
export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    if (a.data.pinned !== b.data.pinned) return a.data.pinned ? -1 : 1;
    const at = a.data.pubDate?.valueOf?.() ?? 0;
    const bt = b.data.pubDate?.valueOf?.() ?? 0;
    return bt - at;
  });
}

/**
 * Sort posts strictly by `pubDate` (newest first), ignoring `pinned`.
 */
export function sortPostsByDate(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const at = a.data.pubDate?.valueOf?.() ?? 0;
    const bt = b.data.pubDate?.valueOf?.() ?? 0;
    return bt - at;
  });
}

/** Get all posts for a locale (respecting draft/hidden/unlisted visibility). */
export async function getPosts(locale: Locale, options: PostQueryOptions = {}): Promise<Post[]> {
  const { includeHidden = false, includeUnlisted = false } = options;
  const all = await loadAllPostsFromDisk();
  const filtered = all.filter((entry) => {
    if (entry.data.lang !== locale) return false;
    if (!includeHidden && (entry.data.draft || entry.data.hidden)) return false;
    if (!includeUnlisted && entry.data.unlisted) return false;
    return true;
  });
  return sortPosts(filtered);
}

/** Get all posts across all locales (for admin dashboard). */
export async function getAllPostsForAdmin(): Promise<Post[]> {
  const all = await loadAllPostsFromDisk();
  return sortPosts(all);
}

/**
 * Get unlisted posts for a locale.
 */
export async function getUnlistedPosts(
  locale: Locale,
  options: PostQueryOptions = {},
): Promise<Post[]> {
  const { includeHidden = false } = options;
  const all = await loadAllPostsFromDisk();
  const filtered = all.filter((entry) => {
    if (entry.data.lang !== locale) return false;
    if (!entry.data.unlisted) return false;
    if (!includeHidden && (entry.data.draft || entry.data.hidden)) return false;
    return true;
  });
  return sortPosts(filtered);
}

/** Find a single post by locale + slug (path-relative). */
export async function getPostBySlug(
  locale: Locale,
  slug: string,
  options: PostQueryOptions = {},
): Promise<Post | undefined> {
  const posts = await getPosts(locale, { ...options, includeUnlisted: true });
  return posts.find((p) => postSlug(p) === slug);
}

/** All translation siblings of a post (other locales sharing translationKey). */
export async function getTranslations(
  entry: Post,
  options: PostQueryOptions = {},
): Promise<Record<Locale, Post | undefined>> {
  const out: Partial<Record<Locale, Post | undefined>> = {};
  for (const locale of SITE.locales) {
    if (locale === entry.data.lang) {
      out[locale] = entry;
      continue;
    }
    const all = await getPosts(locale, options);
    out[locale] = all.find((p) => p.data.translationKey === entry.data.translationKey);
  }
  return out as Record<Locale, Post | undefined>;
}

/** Tags for a locale, with counts, sorted by count desc then alpha. */
export async function getTagsWithCount(
  locale: Locale,
  options: PostQueryOptions = {},
): Promise<Array<{ name: string; count: number }>> {
  const posts = await getPosts(locale, options);
  const map = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.data.tags) map.set(t, (map.get(t) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Categories for a locale, with counts. */
export async function getCategoriesWithCount(
  locale: Locale,
  options: PostQueryOptions = {},
): Promise<Array<{ name: string; count: number }>> {
  const posts = await getPosts(locale, options);
  const map = new Map<string, number>();
  for (const p of posts) {
    for (const c of p.data.categories) map.set(c, (map.get(c) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Group posts by year -> month for the archives page. */
export function groupByYearMonth(
  posts: Post[],
  locale: Locale,
): Array<{
  year: number;
  months: Array<{ month: number; label: string; posts: Post[] }>;
}> {
  const buckets = new Map<number, Map<number, Post[]>>();
  for (const post of posts) {
    const date = post.data.pubDate;
    if (!date) continue;
    const y = date.getFullYear();
    const m = date.getMonth();
    if (!buckets.has(y)) buckets.set(y, new Map());
    const months = buckets.get(y)!;
    if (!months.has(m)) months.set(m, []);
    months.get(m)!.push(post);
  }
  const lang = locale === 'zh' ? 'zh-CN' : 'en-US';
  const fmt = new Intl.DateTimeFormat(lang, { month: 'long' });
  return Array.from(buckets.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => ({
      year,
      months: Array.from(months.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([month, list]) => ({
          month,
          label: fmt.format(new Date(year, month, 1)),
          posts: list,
        })),
    }));
}

/**
 * Resolve whether a post should display its featured (hero) image.
 */
export function shouldShowHero(post: Post): boolean {
  if (!post.data.heroImage) return false;
  return post.data.showFeaturedImage ?? SITE.showFeaturedImages;
}

/** The hero image source URL/path for a post (or undefined). */
export function heroImageSrc(post: Post): string | undefined {
  const img = post.data.heroImage;
  if (!img) return undefined;
  let src: string | undefined;
  if (typeof img === 'string') src = img;
  else if (typeof img === 'object' && 'src' in (img as Record<string, unknown>)) {
    src = (img as { src: string }).src;
  }
  if (!src) return undefined;
  return src.startsWith('/') && !src.startsWith('//') ? withBase(src) : src;
}

/**
 * The raw hero image, suitable for passing straight to `<SmartImage>`.
 */
export function heroImage(post: Post): ImageMetadata | string | undefined {
  const img = post.data.heroImage;
  if (!img) return undefined;
  if (typeof img === 'string') {
    return img.startsWith('/') && !img.startsWith('//') ? withBase(img) : img;
  }
  return img as ImageMetadata;
}

/** Slugify a tag/category for use in URLs. */
export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return slug || encodeURIComponent(value.trim());
}

/** Build the URL for a tag listing page in a given locale. */
export function tagPath(locale: Locale, tag: string): string {
  const slug = slugify(tag);
  const pathUrl = locale === SITE.defaultLocale ? `/tags/${slug}/` : `/${locale}/tags/${slug}/`;
  return withBase(pathUrl);
}

/** Build the URL for a category listing page in a given locale. */
export function categoryPath(locale: Locale, category: string): string {
  const slug = slugify(category);
  const pathUrl =
    locale === SITE.defaultLocale ? `/categories/${slug}/` : `/${locale}/categories/${slug}/`;
  return withBase(pathUrl);
}
