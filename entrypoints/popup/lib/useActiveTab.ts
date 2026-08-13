import { useEffect, useState } from 'react';

export interface ActiveTab {
  id: number;
  url: string;
  title: string;
}

export function useActiveTab() {
  const [tab, setTab] = useState<ActiveTab | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then(([t]) => {
        if (t?.id && t?.url) {
          setTab({ id: t.id, url: t.url, title: t.title ?? '' });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { tab, loading };
}
