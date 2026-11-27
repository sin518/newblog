import fs from 'node:fs/promises';
import path from 'node:path';
import { isGitHubStoreEnabled, putGitHubFile } from './github-store';

export interface PanelToolItem {
  id: string;
  eyebrow: string;
  eyebrowEn?: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  href: string;
  linkText: string;
  linkTextEn?: string;
  hidden: boolean;
}

const PANEL_TOOLS_PATH = path.resolve(process.cwd(), 'src/content/panel-tools.json');

export async function getPanelTools(options: { includeHidden?: boolean } = {}): Promise<PanelToolItem[]> {
  const { includeHidden = false } = options;
  try {
    const raw = await fs.readFile(PANEL_TOOLS_PATH, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const items: PanelToolItem[] = parsed
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item) => ({
        id: String(item.id || `tool-${Date.now()}`),
        eyebrow: String(item.eyebrow ?? ''),
        eyebrowEn: typeof item.eyebrowEn === 'string' ? item.eyebrowEn : undefined,
        title: String(item.title ?? ''),
        titleEn: typeof item.titleEn === 'string' ? item.titleEn : undefined,
        description: String(item.description ?? ''),
        descriptionEn: typeof item.descriptionEn === 'string' ? item.descriptionEn : undefined,
        href: String(item.href ?? '#'),
        linkText: String(item.linkText ?? '打开'),
        linkTextEn: typeof item.linkTextEn === 'string' ? item.linkTextEn : undefined,
        hidden: Boolean(item.hidden),
      }));
    return includeHidden ? items : items.filter((item) => !item.hidden);
  } catch {
    return [];
  }
}

export async function savePanelTools(items: PanelToolItem[], message: string): Promise<void> {
  const json = `${JSON.stringify(items, null, 2)}\n`;
  if (isGitHubStoreEnabled()) {
    await putGitHubFile('src/content/panel-tools.json', json, message);
  } else {
    await fs.mkdir(path.dirname(PANEL_TOOLS_PATH), { recursive: true });
    await fs.writeFile(PANEL_TOOLS_PATH, json, 'utf8');
  }
}
