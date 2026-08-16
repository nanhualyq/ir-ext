import { useEffect, useState } from 'react';
import { matchBookmarks, type BookmarkNode, type MatchedBookmark } from './matchBookmarks';
import type { ActiveTab } from './useActiveTab';

export interface BookmarkItem {
  id: string;
  title: string;
  url?: string;
  tier: number;
}

/**
 * Collect all bookmark URLs from the bookmark tree (flattened).
 * Used as fallback when bookmarks.search() can't find file:// URLs.
 */
async function collectAllBookmarks(): Promise<BookmarkNode[]> {
  const tree = await browser.bookmarks.getTree();
  const results: BookmarkNode[] = [];
  function walk(nodes: { id: string; title: string; url?: string; children?: any[] }[]) {
    for (const node of nodes) {
      if (node.url) {
        results.push({ id: node.id, title: node.title, url: node.url });
      }
      if (node.children) walk(node.children);
    }
  }
  for (const root of tree) {
    if (root.children) walk(root.children);
  }
  return results;
}

/**
 * Deduplicate bookmarks by URL.
 */
function dedup(bookmarks: BookmarkNode[]): BookmarkNode[] {
  const seen = new Set<string>();
  return bookmarks.filter((b) => {
    if (!b.url || seen.has(b.url)) return false;
    seen.add(b.url);
    return true;
  });
}

/**
 * Search bookmarks for file:// URLs using multiple strategies:
 * 1. Search by URL-encoded pathname
 * 2. Search by decoded pathname
 * 3. Search by filename only
 * 4. Fallback: get ALL bookmarks and let matchBookmarks filter locally
 */
async function searchFileBookmarks(
  currentUrl: string,
  pageTitle: string,
): Promise<MatchedBookmark[]> {
  const parsed = new URL(currentUrl);
  const encodedPath = parsed.pathname;
  const decodedPath = decodeURIComponent(encodedPath);
  const filename = decodedPath.split('/').pop() || decodedPath;

  // 多种搜索策略
  const r1 = await browser.bookmarks.search(encodedPath);
  const r2 = await browser.bookmarks.search(decodedPath);
  const r3 = await browser.bookmarks.search(filename);
  const merged = dedup([...r1, ...r2, ...r3]);

  if (merged.length > 0) {
    return matchBookmarks(merged, currentUrl, pageTitle);
  }

  // Fallback: 遍历书签树，本地匹配所有 file:// 书签
  const all = await collectAllBookmarks();
  const fileBookmarks = all.filter((b) => b.url?.startsWith('file://'));
  return matchBookmarks(fileBookmarks, currentUrl, pageTitle);
}

export function useBookmarks(tab: ActiveTab | null) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tab) {
      setLoading(false);
      return;
    }

    const isFileUrl = tab.url.startsWith('file://');

    if (!isFileUrl) {
      // HTTP(S) — 正常搜索 hostname
      const searchQuery = new URL(tab.url).hostname;
      browser.bookmarks.search(searchQuery).then((results) => {
        setBookmarks(matchBookmarks(results, tab.url, tab.title));
        setLoading(false);
      });
      return;
    }

    // file:// — Chrome bookmarks search 对 file:// 支持差，多种策略回退
    searchFileBookmarks(tab.url, tab.title).then((matched) => {
      setBookmarks(matched);
      setLoading(false);
    });
  }, [tab]);

  return { bookmarks, loading };
}
