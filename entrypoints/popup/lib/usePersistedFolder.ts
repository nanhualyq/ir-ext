import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ir-ext-last-folder-id';

export function usePersistedFolder() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    browser.storage.local.get(STORAGE_KEY).then((result) => {
      const stored = result[STORAGE_KEY];
      if (typeof stored === 'string' && stored.length > 0) {
        setSelectedFolderId(stored);
      }
      setLoaded(true);
    });
  }, []);

  const selectFolder = useCallback((id: string) => {
    setSelectedFolderId(id);
    browser.storage.local.set({ [STORAGE_KEY]: id });
  }, []);

  return { selectedFolderId, selectFolder, loaded };
}
