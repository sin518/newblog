/**
 * Dynamic OG image endpoint (SSR).
 *
 * Route: /og/[...slug].png
 */
/* global Response */
import type { APIRoute } from 'astro';
import { generateOgImage } from '../../utils/og-image';
import { getPostBySlug } from '../../utils/posts';
import { SITE, type Locale } from '../../config';
import { formatDate } from '../../i18n/utils';

export const GET: APIRoute = async ({ params, locals }) => {
  if (!SITE.autoOgImage || import.meta.env.CI_SKIP_AUTO_OG_IMAGE === 'true') {
    return new Response(null, { status: 404 });
  }

  const rawSlug = params.slug ?? '';
  let locale: Locale = SITE.defaultLocale;
  let slug = rawSlug;

  for (const loc of SITE.locales) {
    if (loc !== SITE.defaultLocale && rawSlug.startsWith(`${loc}/`)) {
      locale = loc;
      slug = rawSlug.slice(loc.length + 1);
      break;
    }
  }

  const post = await getPostBySlug(locale, slug, { includeHidden: locals.isAdmin });
  if (!post) return new Response(null, { status: 404 });

  const date = post.data.pubDate ? formatDate(post.data.pubDate, locale) : undefined;

  const png = await generateOgImage({
    title: post.data.title,
    description: post.data.description,
    date,
    category: post.data.categories[0],
    tags: post.data.tags,
  });

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
