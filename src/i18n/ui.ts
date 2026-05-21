/**
 * UI dictionaries.
 * Add new locales by adding a key to `messages` and to `SITE.locales` in
 * src/config.ts. All keys must exist for every locale (TypeScript enforces it).
 */

import type { Locale } from '../config';

export const messages = {
  zh: {
    'site.skipToContent': '跳到正文',
    'nav.home': '首页',
    'nav.posts': '文章',
    'nav.tags': '标签',
    'nav.categories': '分类',
    'nav.archives': '归档',
    'nav.about': '关于',
    'nav.search': '搜索',
    'nav.toggleMenu': '切换菜单',

    'theme.toggle': '切换主题',
    'theme.light': '浅色',
    'theme.dark': '深色',
    'theme.system': '跟随系统',

    'lang.switcher': '语言',
    'lang.zh': '中文',
    'lang.en': '英语',

    'post.publishedOn': '发布于',
    'post.updatedOn': '更新于',
    'post.readingTime': '分钟阅读',
    'post.toc': '目录',
    'post.tags': '标签',
    'post.categories': '分类',
    'post.previous': '上一篇',
    'post.next': '下一篇',
    'post.comments': '评论',
    'post.commentsDisabled': '本文已关闭评论。',
    'post.commentsSetupTitle': '评论需要配置',
    'post.commentsSetupBody':
      'Giscus 已启用但尚未配置。请添加下面的仓库信息来开启评论。',
    'post.commentsSetupStep1':
      '访问 `giscus.app` 并选择你的公开 GitHub 仓库（需要启用 Discussions）。',
    'post.commentsSetupStep2':
      '复制生成的 `data-repo-id`、`data-category` 和 `data-category-id`。',
    'post.commentsSetupStep3':
      '在 `.env` 文件中设置 `PUBLIC_GISCUS_ENABLED`、`PUBLIC_GISCUS_REPO`、`PUBLIC_GISCUS_REPO_ID`、`PUBLIC_GISCUS_CATEGORY` 和 `PUBLIC_GISCUS_CATEGORY_ID` 环境变量。',
    'post.commentsSetupStep4': '重新构建站点后，此提示会替换为实时评论区。',
    'post.commentsSetupDocs': '打开 giscus.app',
    'post.share': '分享',
    'post.copyLink': '复制链接',
    'post.copied': '已复制！',
    'post.author': '作者',

    'list.allPosts': '全部文章',
    'list.empty': '暂无文章。',
    'list.tagPosts': '标签文章',
    'list.categoryPosts': '分类文章',
    'list.totalPosts': '篇文章',
    'list.totalPostsOne': '篇文章',

    'pagination.previous': '上一页',
    'pagination.next': '下一页',
    'pagination.page': '第',
    'pagination.of': '页，共',

    'archives.title': '归档',
    'archives.empty': '暂无文章。',

    'tags.title': '标签',
    'tags.empty': '暂无标签。',

    'categories.title': '分类',
    'categories.empty': '暂无分类。',

    'panel.recentlyUpdated': '最近更新',
    'panel.trendingTags': '热门标签',

    'search.title': '搜索',
    'search.placeholder': '搜索站点',
    'search.openLabel': '打开搜索',
    'search.closeLabel': '关闭搜索',
    'search.empty': '没有结果。',
    'search.loading': '正在加载搜索…',
    'search.typeToStart': '输入内容开始搜索…',
    'search.hintShortcut': '按 / 打开搜索',
    'search.searching': '搜索中…',
    'search.noResultsFor': '没有找到',
    'search.resultsCount': '条结果',
    'search.resultsCountOne': '条结果',
    'search.hintNavigate': '导航',
    'search.hintSelect': '打开',
    'search.clearLabel': '清除',

    'code.copy': '复制',
    'code.copied': '已复制',

    '404.title': '页面未找到',
    '404.description': '你要找的页面不存在。',
    '404.cta': '返回首页',

    'footer.poweredBy': '由',
    'footer.theme': '主题',
    'footer.privacy': '隐私政策',
    'footer.copyright': '版权所有。',
  },

  en: {
    'site.skipToContent': 'Skip to content',
    'nav.home': 'Home',
    'nav.posts': 'Posts',
    'nav.tags': 'Tags',
    'nav.categories': 'Categories',
    'nav.archives': 'Archives',
    'nav.about': 'About',
    'nav.search': 'Search',
    'nav.toggleMenu': 'Toggle menu',

    'theme.toggle': 'Toggle theme',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',

    'lang.switcher': 'Language',
    'lang.zh': 'Chinese',
    'lang.en': 'English',

    'post.publishedOn': 'Published on',
    'post.updatedOn': 'Updated on',
    'post.readingTime': 'min read',
    'post.toc': 'Table of contents',
    'post.tags': 'Tags',
    'post.categories': 'Categories',
    'post.previous': 'Previous',
    'post.next': 'Next',
    'post.comments': 'Comments',
    'post.commentsDisabled': 'Comments are disabled for this post.',
    'post.commentsSetupTitle': 'Comments need configuration',
    'post.commentsSetupBody':
      'Giscus is enabled but not yet configured. Add the repository details below to start collecting comments.',
    'post.commentsSetupStep1':
      'Visit `giscus.app` and select your public GitHub repository (Discussions must be enabled).',
    'post.commentsSetupStep2':
      'Copy the generated `data-repo-id`, `data-category` and `data-category-id` values.',
    'post.commentsSetupStep3':
      'Set the `PUBLIC_GISCUS_ENABLED`, `PUBLIC_GISCUS_REPO`, `PUBLIC_GISCUS_REPO_ID`, `PUBLIC_GISCUS_CATEGORY` and `PUBLIC_GISCUS_CATEGORY_ID` env vars in your `.env` file.',
    'post.commentsSetupStep4':
      'Rebuild the site — this notice will be replaced by the live comments thread.',
    'post.commentsSetupDocs': 'Open giscus.app',
    'post.share': 'Share',
    'post.copyLink': 'Copy link',
    'post.copied': 'Copied!',
    'post.author': 'Author',

    'list.allPosts': 'All posts',
    'list.empty': 'No posts found.',
    'list.tagPosts': 'Posts tagged',
    'list.categoryPosts': 'Posts in',
    'list.totalPosts': 'posts',
    'list.totalPostsOne': 'post',

    'pagination.previous': 'Previous page',
    'pagination.next': 'Next page',
    'pagination.page': 'Page',
    'pagination.of': 'of',

    'archives.title': 'Archives',
    'archives.empty': 'No posts yet.',

    'tags.title': 'Tags',
    'tags.empty': 'No tags yet.',

    'categories.title': 'Categories',
    'categories.empty': 'No categories yet.',

    'panel.recentlyUpdated': 'Recently Updated',
    'panel.trendingTags': 'Trending Tags',

    'search.title': 'Search',
    'search.placeholder': 'Search the site',
    'search.openLabel': 'Open search',
    'search.closeLabel': 'Close search',
    'search.empty': 'No results.',
    'search.loading': 'Loading search…',
    'search.typeToStart': 'Type to search…',
    'search.hintShortcut': 'Press / anywhere to open search',
    'search.searching': 'Searching…',
    'search.noResultsFor': 'No results for',
    'search.resultsCount': 'results',
    'search.resultsCountOne': 'result',
    'search.hintNavigate': 'to navigate',
    'search.hintSelect': 'to open',
    'search.clearLabel': 'Clear',

    'code.copy': 'Copy',
    'code.copied': 'Copied',

    '404.title': 'Page not found',
    '404.description': 'The page you are looking for has flown away.',
    '404.cta': 'Back to home',

    'footer.poweredBy': 'Powered by',
    'footer.theme': 'Theme',
    'footer.privacy': 'Privacy Policy',
    'footer.copyright': 'All rights reserved.',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof messages)['en'];
