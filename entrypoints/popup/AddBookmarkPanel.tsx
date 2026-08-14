import { useCallback, useState } from 'react';
import { useBookmarkFolders } from './lib/useBookmarkFolders';
import { usePersistedFolder } from './lib/usePersistedFolder';
import type { ActiveTab } from './lib/useActiveTab';

interface Props {
  tab: ActiveTab;
}

export function AddBookmarkPanel({ tab }: Props) {
  const { folders, loading } = useBookmarkFolders();
  const { selectedFolderId, selectFolder } = usePersistedFolder();
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const [showFolders, setShowFolders] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!selectedFolderId || status === 'saving') return;

    setStatus('saving');
    try {
      await browser.bookmarks.create({
        parentId: selectedFolderId,
        title: tab.title,
        url: tab.url,
      });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1500);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  }, [selectedFolderId, tab, status]);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  const statusText =
    status === 'saving'
      ? 'Adding…'
      : status === 'saved'
        ? '✓ Added!'
        : status === 'error'
          ? '✗ Failed'
          : null;

  return (
    <div className="px-2 pb-2">
      <div className="border-t border-gray-100 pt-2">
        {/* Folder selector toggle */}
        <button
          onClick={() => setShowFolders(!showFolders)}
          className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span className="truncate">
            {selectedFolder
              ? `${'  '.repeat(selectedFolder.depth)}📁 ${selectedFolder.title}`
              : 'Select a folder…'}
          </span>
          <span className="text-xs text-gray-400 shrink-0 ml-2">
            {showFolders ? '▲' : '▼'}
          </span>
        </button>

        {/* Folder list */}
        {showFolders && (
          <div className="mt-1 max-h-[200px] overflow-y-auto border border-gray-200 rounded-lg bg-white">
            {loading ? (
              <p className="text-xs text-gray-400 py-2 text-center">
                Loading folders…
              </p>
            ) : folders.length === 0 ? (
              <p className="text-xs text-gray-400 py-2 text-center">
                No folders found
              </p>
            ) : (
              folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    selectFolder(f.id);
                    setShowFolders(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors
                    ${
                      selectedFolderId === f.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                >
                  <span style={{ paddingLeft: f.depth * 12 }}>
                    {f.depth === 0 ? '📂' : '📁'} {f.title}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Add bookmark button */}
        <button
          disabled={!selectedFolderId || status === 'saving'}
          onClick={handleAdd}
          accessKey="a"
          className={`w-full mt-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors
            ${
              !selectedFolderId || status === 'saving'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : status === 'saved'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : status === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
            }`}
        >
          {statusText ?? <>＋ <u>A</u>dd Bookmark</>}
        </button>
      </div>
    </div>
  );
}
