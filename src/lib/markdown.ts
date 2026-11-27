import { Marked } from 'marked';
import type { MarkdownHeading } from 'astro';

function slugifyHeading(text: string): string {
  const plain = text
    .replace(/<[^>]+>/g, '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Letter}\p{Number}\s_-]+/gu, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return plain || 'section';
}

export function renderMarkdown(markdown: string): {
  html: string;
  headings: MarkdownHeading[];
} {
  const headings: MarkdownHeading[] = [];
  const slugCounts = new Map<string, number>();

  const instance = new Marked({
    gfm: true,
    breaks: false,
  });

  instance.use({
    renderer: {
      heading({ tokens, depth }) {
        const textHtml = this.parser.parseInline(tokens);
        const plainText = textHtml.replace(/<[^>]+>/g, '').trim();
        const baseSlug = slugifyHeading(plainText);
        const count = slugCounts.get(baseSlug) ?? 0;
        slugCounts.set(baseSlug, count + 1);
        const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`;

        headings.push({
          depth,
          slug,
          text: plainText,
        });

        return `<h${depth} id="${slug}"><a class="heading-anchor" aria-hidden="true" tabindex="-1" href="#${slug}">${textHtml}</a></h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const safeHref = href ?? '';
        const isExternal = /^https?:\/\//i.test(safeHref);
        const titleAttr = title ? ` title="${title.replace(/"/g, '&quot;')}"` : '';
        if (isExternal) {
          return `<a href="${safeHref}"${titleAttr} target="_blank" rel="nofollow noopener noreferrer">${text}</a>`;
        }
        return `<a href="${safeHref}"${titleAttr}>${text}</a>`;
      },
    },
  });

  const html = instance.parse(markdown) as string;
  return { html, headings };
}
