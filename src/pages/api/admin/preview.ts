import type { APIRoute } from 'astro';
import { renderMarkdown } from '~/lib/markdown';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { markdown } = (await request.json()) as { markdown?: string };
    const { html } = renderMarkdown(typeof markdown === 'string' ? markdown : '');
    return new Response(JSON.stringify({ html }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '预览失败' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};
