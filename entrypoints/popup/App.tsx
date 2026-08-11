import { useEffect, useState } from 'react';
import { matchBookmarks } from './lib/matchBookmarks';

interface BookmarkItem {
  id: string;
  title: string;
  url?: string;
  tier: number;
}

function App() {
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.url) {
        setLoading(false);
        return;
      }

      const hostname = new URL(tab.url).hostname;
      const results = await browser.bookmarks.search(hostname);
      const matched = matchBookmarks(results, tab.url, tab.title ?? '');

      setBookmarks(matched);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="w-[360px] min-h-[400px] bg-white text-gray-900 font-sans">
        <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="w-[360px] min-h-[400px] bg-white text-gray-900 font-sans">
        <p className="text-sm text-gray-400 py-8 text-center">
          No bookmarks found.
        </p>
      </div>
    );
  }

  return (
    <div className="w-[360px] min-h-[400px] bg-white text-gray-900 font-sans">
      <div className="p-2">
        {bookmarks.map((b) => (
          <label
            key={b.id}
            className={`block w-full flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
              ${selectedId === b.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
          >
            <input
              type="radio"
              name="bookmark"
              className="mt-0.5 accent-blue-600 shrink-0"
              checked={selectedId === b.id}
              onChange={() => setSelectedId(b.id)}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium truncate">
                {b.title || 'Untitled'}
              </span>
              {b.url && (
                <span className="block text-xs text-gray-400 truncate mt-0.5">
                  {b.url}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default App;
