import type { APIRoute } from 'astro';
import {
  getSidebarConfig,
  saveSidebarConfig,
  type SidebarConfig,
} from '~/lib/sidebar-config';

export const prerender = false;

export const GET: APIRoute = async () => {
  const config = await getSidebarConfig({ includeHidden: true });
  return new Response(JSON.stringify({ config }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const payload = (await request.json()) as Partial<SidebarConfig>;
    const current = await getSidebarConfig({ includeHidden: true });

    const next: SidebarConfig = {
      profile: {
        title: (payload.profile?.title ?? current.profile.title).trim() || current.profile.title,
        bio:
          typeof payload.profile?.bio === 'string'
            ? payload.profile.bio.trim()
            : current.profile.bio,
      },
      navItems: Array.isArray(payload.navItems) ? payload.navItems : current.navItems,
      tools: Array.isArray(payload.tools) ? payload.tools : current.tools,
      socials: Array.isArray(payload.socials) ? payload.socials : current.socials,
    };

    await saveSidebarConfig(next, 'chore: update sidebar config');
    return new Response(JSON.stringify({ ok: true, config: next }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '保存左侧栏目配置失败';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};
