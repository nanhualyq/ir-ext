import { useEffect, useState } from 'react';
import { matchBookmarks } from './matchBookmarks';
import type { ActiveTab } from './useActiveTab';

export interface BookmarkItem {
  id: string;
  title: string;
  url?: string;
  tier: number;
}

export function useBookmarks(tab: ActiveTab | null) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tab) {
      setLoading(false);
      return;
    }

    const hostname = new URL(tab.url).hostname;
    browser.bookmarks.search(hostname).then((results) => {
      setBookmarks(matchBookmarks(results, tab.url, tab.title));
      setLoading(false);
    });
  }, [tab]);

  return { bookmarks, loading };
}
