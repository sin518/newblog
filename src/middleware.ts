import { defineMiddleware } from 'astro:middleware';
import { getSessionFromCookies } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const session = getSessionFromCookies(context.cookies);
  context.locals.isAdmin = Boolean(session);
  context.locals.adminUser = session?.username ?? null;

  const { pathname } = context.url;

  if (pathname.startsWith('/api/admin') && !context.locals.isAdmin) {
    return new Response(JSON.stringify({ error: '未授权访问，请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  if (pathname.startsWith('/admin') && !context.locals.isAdmin) {
    const redirectTarget = encodeURIComponent(pathname + context.url.search);
    return context.redirect(`/login?redirect=${redirectTarget}`);
  }

  return next();
});
