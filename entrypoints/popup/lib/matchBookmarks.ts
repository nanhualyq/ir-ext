export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
}

export interface MatchedBookmark extends BookmarkNode {
  tier: number;
}

/**
 * 归一化 URL：
 * - protocol 用原值（Tier 1 用精确比较，Tier 2+ 忽略 protocol）
 * - www 前缀去掉
 * - trailing slash 去掉
 * - hash / searchParams 根据选项去掉
 */
function normalizeUrl(
  url: string,
  options: {
    stripProtocol?: boolean;
    stripHash?: boolean;
    stripSearch?: boolean;
  } = {},
): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    let pathname = u.pathname.replace(/\/+$/, '') || '/';

    if (options.stripSearch) u.search = '';
    if (options.stripHash) u.hash = '';

    let result = (options.stripProtocol ? '' : u.protocol + '//') + host + pathname;
    if (!options.stripSearch && u.search) result += u.search;
    if (!options.stripHash && u.hash) result += u.hash;
    return result;
  } catch {
    return url;
  }
}

/**
 * 检查两个 path 是否存在前缀/包含关系（非相等）
 * e.g. "/a/b" 与 "/a/b/c" → true, "/a/b" 与 "/a/b" → false (相等不算)
 */
function pathRelated(p1: string, p2: string): boolean {
  if (p1 === p2) return false;
  return p1.startsWith(p2) || p2.startsWith(p1);
}

/**
 * 提取 hostname + pathname（归一化）
 */
function hostPath(
  url: string,
): { host: string; pathname: string } | null {
  try {
    const u = new URL(url);
    return {
      host: u.hostname.replace(/^www\./, ''),
      pathname: u.pathname.replace(/\/+$/, '') || '/',
    };
  } catch {
    return null;
  }
}

/**
 * 分层匹配书签（短路：有结果即返回，不再继续下一层）
 *
 * Tier 1 — URL 完全匹配（归一化后）/ title 完全匹配
 * Tier 2 — 去掉 hash 后归一化 URL 相等，或路径不同但互相 includes
 * Tier 3 — 去掉 hash + searchParams 后同理
 * Tier 4 — 同域名，逐级裁剪 path 末段互相 includes
 */
export function matchBookmarks(
  bookmarks: BookmarkNode[],
  currentUrl: string,
  pageTitle: string,
): MatchedBookmark[] {
  // Tier 1: 精确匹配（归一化 protocol/www/trailing slash）
  const tier1 = bookmarks.filter((b) => {
    if (!b.url) return false;
    // URL 完全匹配（归一化后）
    const normalized = normalizeUrl(b.url, { stripProtocol: true });
    const currentNorm = normalizeUrl(currentUrl, { stripProtocol: true });
    if (normalized === currentNorm) return true;
    // title 完全匹配
    if (pageTitle && b.title === pageTitle) return true;
    return false;
  });
  if (tier1.length > 0) return tier1.map((b) => ({ ...b, tier: 1 }));

  // Tier 2: 去掉 hash 后包含匹配
  const normNoHash = normalizeUrl(currentUrl, {
    stripProtocol: true,
    stripHash: true,
  });
  const tier2 = bookmarks.filter((b) => {
    if (!b.url) return false;
    const bNorm = normalizeUrl(b.url, { stripProtocol: true, stripHash: true });
    if (bNorm === normNoHash) return true;
    // 路径不同时才用 includes，避免 path 子串误匹配到 Tier 4
    const cHP = hostPath(currentUrl);
    const bHP = hostPath(b.url);
    if (cHP && bHP && !pathRelated(cHP.pathname, bHP.pathname)) {
      return bNorm.includes(normNoHash) || normNoHash.includes(bNorm);
    }
    return false;
  });
  if (tier2.length > 0) return tier2.map((b) => ({ ...b, tier: 2 }));

  // Tier 3: 去掉 hash + searchParams 后包含匹配
  const normNoHashSearch = normalizeUrl(currentUrl, {
    stripProtocol: true,
    stripHash: true,
    stripSearch: true,
  });
  const tier3 = bookmarks.filter((b) => {
    if (!b.url) return false;
    const bNorm = normalizeUrl(b.url, {
      stripProtocol: true,
      stripHash: true,
      stripSearch: true,
    });
    if (bNorm === normNoHashSearch) return true;
    const cHP = hostPath(currentUrl);
    const bHP = hostPath(b.url);
    if (cHP && bHP && !pathRelated(cHP.pathname, bHP.pathname)) {
      return bNorm.includes(normNoHashSearch) || normNoHashSearch.includes(bNorm);
    }
    return false;
  });
  if (tier3.length > 0) return tier3.map((b) => ({ ...b, tier: 3 }));

  // Tier 4: 同域名 + 逐级裁剪 path
  const currentHP = hostPath(currentUrl);
  if (currentHP) {
    const tier4 = bookmarks.filter((b) => {
      if (!b.url) return false;
      const bHP = hostPath(b.url);
      if (!bHP) return false;

      // host 包含匹配
      const hostMatch =
        bHP.host === currentHP.host ||
        bHP.host.includes(currentHP.host) ||
        currentHP.host.includes(bHP.host);
      if (!hostMatch) return false;

      // 逐级裁剪 path，检查包含
      let p = currentHP.pathname;
      while (p) {
        if (bHP.pathname.startsWith(p) || p.startsWith(bHP.pathname)) {
          return true;
        }
        const lastSlash = p.lastIndexOf('/');
        if (lastSlash <= 0) {
          if (bHP.pathname === '/' || currentHP.pathname === '/') return true;
          break;
        }
        p = p.slice(0, lastSlash);
      }
      return false;
    });
    if (tier4.length > 0) return tier4.map((b) => ({ ...b, tier: 4 }));
  }

  return [];
}
