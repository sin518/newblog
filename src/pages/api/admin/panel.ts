import type { APIRoute } from 'astro';
import { getPanelTools, savePanelTools, type PanelToolItem } from '~/lib/panel-tools';

export const prerender = false;

export const GET: APIRoute = async () => {
  const items = await getPanelTools({ includeHidden: true });
  return new Response(JSON.stringify({ items }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = (await request.json()) as Partial<PanelToolItem>;
    const title = (payload.title ?? '').trim();
    const href = (payload.href ?? '').trim();

    if (!title || !href) {
      return new Response(JSON.stringify({ error: '标题和链接不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const items = await getPanelTools({ includeHidden: true });
    const id = (payload.id ?? '').trim() || `tool-${Date.now()}`;
    const nextItem: PanelToolItem = {
      id,
      eyebrow: (payload.eyebrow ?? '').trim() || '个人工具',
      eyebrowEn: (payload.eyebrowEn ?? '').trim() || undefined,
      title,
      titleEn: (payload.titleEn ?? '').trim() || undefined,
      description: (payload.description ?? '').trim(),
      descriptionEn: (payload.descriptionEn ?? '').trim() || undefined,
      href,
      linkText: (payload.linkText ?? '').trim() || '打开链接',
      linkTextEn: (payload.linkTextEn ?? '').trim() || undefined,
      hidden: Boolean(payload.hidden),
    };

    const idx = items.findIndex((i) => i.id === id);
    if (idx >= 0) {
      items[idx] = nextItem;
    } else {
      items.push(nextItem);
    }

    await savePanelTools(items, `chore: save panel item ${id}`);
    return new Response(JSON.stringify({ ok: true, item: nextItem }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '保存失败';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const payload = (await request.json()) as { id?: string; hidden?: boolean };
    const id = (payload.id ?? '').trim();
    if (!id) {
      return new Response(JSON.stringify({ error: '缺少项目 ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const items = await getPanelTools({ includeHidden: true });
    const target = items.find((i) => i.id === id);
    if (!target) {
      return new Response(JSON.stringify({ error: '项目不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    if (typeof payload.hidden === 'boolean') target.hidden = payload.hidden;
    await savePanelTools(items, `chore: toggle panel item ${id}`);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '更新失败';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = (url.searchParams.get('id') ?? '').trim();
    if (!id) {
      return new Response(JSON.stringify({ error: '缺少项目 ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const items = await getPanelTools({ includeHidden: true });
    const filtered = items.filter((i) => i.id !== id);
    if (filtered.length === items.length) {
      return new Response(JSON.stringify({ error: '项目不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    await savePanelTools(filtered, `chore: delete panel item ${id}`);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '删除失败';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};
