/* global URL */
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '~/config';
import { resolveLocaleParam } from '~/i18n/utils';
import { getPosts, postPath } from '~/utils/posts';

export const GET: APIRoute = async (context) => {
  const locale = resolveLocaleParam(context.params.locale);
  if (!locale) return new Response(null, { status: 404 });

  if (import.meta.env.CI_SKIP_RSS_SITEMAP === 'true') {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const siteWithBase = `${(context.site ?? new URL(SITE.url)).origin}${base}`;
    return rss({
      title: SITE.title,
      description: SITE.description,
      site: siteWithBase,
      stylesheet: `${base}/rss/styles.xsl`,
      items: [],
      customData: `<language>en-us</language>`,
    });
  }

  // RSS is public-only: never expose hidden or draft posts
  const posts = await getPosts(locale, { includeHidden: false });
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const siteWithBase = `${(context.site ?? new URL(SITE.url)).origin}${base}`;
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: siteWithBase,
    stylesheet: `${base}/rss/styles.xsl`,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: postPath(post),
      categories: [...post.data.tags, ...post.data.categories],
    })),
    customData: `<language>en-us</language>`,
  });
};
