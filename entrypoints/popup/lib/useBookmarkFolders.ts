import { useEffect, useState } from 'react';

export interface BookmarkFolder {
  id: string;
  title: string;
  depth: number;
}

interface BookmarkNode {
  id: string;
  title?: string;
  url?: string;
  children?: BookmarkNode[];
}

function flattenFolders(
  node: BookmarkNode,
  depth: number,
  result: BookmarkFolder[],
) {
  const children = node.children;
  if (!children) return;

  for (const child of children) {
    // Folders don't have a url
    if (!child.url) {
      result.push({
        id: child.id,
        title: child.title || '(No title)',
        depth,
      });
      flattenFolders(child, depth + 1, result);
    }
  }
}

export function useBookmarkFolders() {
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    browser.bookmarks.getTree().then((treeArray) => {
      const tree = treeArray[0];
      if (!tree) {
        setLoading(false);
        return;
      }

      const result: BookmarkFolder[] = [];
      // Start from the root's children to skip the virtual "root" node
      const children = tree.children;
      if (children) {
        for (const child of children) {
          if (!child.url) {
            result.push({
              id: child.id,
              title: child.title || '(No title)',
              depth: 0,
            });
            flattenFolders(child, 1, result);
          }
        }
      }
      setFolders(result);
      setLoading(false);
    });
  }, []);

  return { folders, loading };
}
