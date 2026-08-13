import { useCallback, useState } from 'react';
import { POSITION_MARKER } from './lib/constants';
import { useActiveTab } from './lib/useActiveTab';
import { useBookmarks } from './lib/useBookmarks';

function App() {
  const { tab, loading: tabLoading } = useActiveTab();
  const { bookmarks, loading: bookmarksLoading } = useBookmarks(tab);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!selectedId && bookmarks.length === 1 && bookmarks[0]) {
    setSelectedId(bookmarks[0].id);
  }
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  const handleSavePosition = useCallback(async () => {
    if (!selectedId || !tab) return;

    setSaveStatus('saving');

    try {
      let selectedText: string | null = null;
      try {
        const response = await browser.tabs.sendMessage(tab.id, {
          type: 'getSelection',
        });
        if (response?.cancelled) {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 2000);
          return;
        }
        selectedText = response?.selectedText || null;
      } catch {
        // Content script not injected on this page
      }

      const newTitle =
        selectedText && selectedText.length > 0
          ? `${tab.title}${POSITION_MARKER}${selectedText}`
          : tab.title;

      await browser.bookmarks.update(selectedId, {
        title: newTitle,
        url: tab.url,
      });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [selectedId, tab]);

  if (tabLoading || bookmarksLoading) {
    return (
      <div className="w-[360px] min-h-[400px] bg-white text-gray-900 font-sans">
        <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
      </div>
    );
  }

  if (!tab) {
    return (
      <div className="w-[360px] min-h-[400px] bg-white text-gray-900 font-sans">
        <p className="text-sm text-gray-400 py-8 text-center">
          Unable to get current tab.
        </p>
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

  const saveButtonText =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved'
        ? '✓ Saved'
        : saveStatus === 'error'
          ? '✗ Failed'
          : '📌 Save Position';

  return (
    <div className="w-[360px] min-h-[400px] bg-white text-gray-900 font-sans">
      <div className="p-2">
        {bookmarks.map((b) => {
          const hasMarker = b.title.includes(POSITION_MARKER);
          const displayTitle = hasMarker
            ? b.title.slice(0, b.title.indexOf(POSITION_MARKER))
            : b.title;

          return (
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
                  {displayTitle || 'Untitled'}
                  {hasMarker && (
                    <span className="ml-1 text-[10px] text-blue-400 font-normal">
                      has position
                    </span>
                  )}
                </span>
                {b.url && (
                  <span className="block text-xs text-gray-400 truncate mt-0.5">
                    {b.url}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      <div className="px-2 pb-2 flex gap-2">
        <button
          disabled={!selectedId || saveStatus === 'saving'}
          onClick={handleSavePosition}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors
            ${
              !selectedId || saveStatus === 'saving'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : saveStatus === 'saved'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : saveStatus === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-gray-900 text-white hover:bg-gray-700 cursor-pointer'
            }`}
        >
          {saveButtonText}
        </button>
      </div>
    </div>
  );
}

export default App;
