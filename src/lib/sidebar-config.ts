import fs from 'node:fs/promises';
import path from 'node:path';
import { SITE, NAV, SOCIALS } from '../config';
import { isGitHubStoreEnabled, putGitHubFile } from './github-store';

export interface SidebarProfile {
  title: string;
  bio: string;
}

export interface SidebarNavItem {
  id: string;
  label: string;
  labelEn?: string;
  href: string;
  icon: string;
  hidden: boolean;
}

export interface SidebarToolItem {
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

export interface SidebarSocialItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  hidden: boolean;
}

export interface SidebarConfig {
  profile: SidebarProfile;
  navItems: SidebarNavItem[];
  tools: SidebarToolItem[];
  socials: SidebarSocialItem[];
}

const SIDEBAR_CONFIG_PATH = path.resolve(process.cwd(), 'src/content/sidebar-config.json');

function defaultConfig(): SidebarConfig {
  return {
    profile: {
      title: SITE.title,
      bio: SITE.author.bio ?? '',
    },
    navItems: NAV.map((item) => ({
      id: item.key,
      label: item.key,
      href: item.href,
      icon: item.icon ?? 'lucide:link',
      hidden: false,
    })),
    tools: [],
    socials: SOCIALS.map((s, idx) => ({
      id: `social-${idx}`,
      label: s.label,
      href: s.href,
      icon: s.icon,
      hidden: false,
    })),
  };
}

export async function getSidebarConfig(
  options: { includeHidden?: boolean } = {},
): Promise<SidebarConfig> {
  const { includeHidden = false } = options;
  try {
    const raw = await fs.readFile(SIDEBAR_CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<SidebarConfig>;
    const fallback = defaultConfig();

    const profile: SidebarProfile = {
      title: parsed.profile?.title?.trim() || fallback.profile.title,
      bio: typeof parsed.profile?.bio === 'string' ? parsed.profile.bio : fallback.profile.bio,
    };

    const navItems: SidebarNavItem[] = Array.isArray(parsed.navItems)
      ? parsed.navItems.map((n) => ({
          id: String(n.id || `nav-${Date.now()}`),
          label: String(n.label ?? ''),
          labelEn: typeof n.labelEn === 'string' ? n.labelEn : undefined,
          href: String(n.href ?? '/'),
          icon: String(n.icon || 'lucide:link'),
          hidden: Boolean(n.hidden),
        }))
      : fallback.navItems;

    const tools: SidebarToolItem[] = Array.isArray(parsed.tools)
      ? parsed.tools.map((t) => ({
          id: String(t.id || `tool-${Date.now()}`),
          eyebrow: String(t.eyebrow ?? ''),
          eyebrowEn: typeof t.eyebrowEn === 'string' ? t.eyebrowEn : undefined,
          title: String(t.title ?? ''),
          titleEn: typeof t.titleEn === 'string' ? t.titleEn : undefined,
          description: String(t.description ?? ''),
          descriptionEn: typeof t.descriptionEn === 'string' ? t.descriptionEn : undefined,
          href: String(t.href ?? '#'),
          linkText: String(t.linkText ?? '打开'),
          linkTextEn: typeof t.linkTextEn === 'string' ? t.linkTextEn : undefined,
          hidden: Boolean(t.hidden),
        }))
      : [];

    const socials: SidebarSocialItem[] = Array.isArray(parsed.socials)
      ? parsed.socials.map((s) => ({
          id: String(s.id || `social-${Date.now()}`),
          label: String(s.label ?? ''),
          href: String(s.href ?? '#'),
          icon: String(s.icon || 'lucide:link'),
          hidden: Boolean(s.hidden),
        }))
      : fallback.socials;

    return {
      profile,
      navItems: includeHidden ? navItems : navItems.filter((n) => !n.hidden),
      tools: includeHidden ? tools : tools.filter((t) => !t.hidden),
      socials: includeHidden ? socials : socials.filter((s) => !s.hidden),
    };
  } catch {
    return defaultConfig();
  }
}

export async function saveSidebarConfig(config: SidebarConfig, message: string): Promise<void> {
  const json = `${JSON.stringify(config, null, 2)}\n`;
  if (isGitHubStoreEnabled()) {
    await putGitHubFile('src/content/sidebar-config.json', json, message);
  } else {
    await fs.mkdir(path.dirname(SIDEBAR_CONFIG_PATH), { recursive: true });
    await fs.writeFile(SIDEBAR_CONFIG_PATH, json, 'utf8');
  }
}
