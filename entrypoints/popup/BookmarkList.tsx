import { memo } from "react";
import { PropsWithChildren } from "react";

type Props = {
  currentTab: Browser.tabs.Tab;
  setBookmark: (bookmark: Browser.bookmarks.BookmarkTreeNode) => void;
};

export default memo(function ({
  currentTab,
  setBookmark,
}: PropsWithChildren<Props>) {
  const [bookmarks, setBookmarks] =
    useState<Browser.bookmarks.BookmarkTreeNode[]>();

  useEffect(
    () =>
      void fetchBookmarks().then((list) => {
        setBookmarks(list);
        if (list.length === 0) {
          throw Error("No Bookmarks Matched");
        }
        setBookmark(list[0]);
      }),
    []
  );

  async function fetchBookmarks() {
    const activeUrl = new URL(currentTab.url || "");
    const searchList: unknown[] = [
      { url: activeUrl.href },
      { title: currentTab.title },
    ];
    const searchParams = new URLSearchParams(activeUrl.search);
    activeUrl.search = "";
    activeUrl.hash = "";
    while (activeUrl.pathname.match(/^\/[^/]+/)) {
      activeUrl.pathname = activeUrl.pathname.replace(/\/[^/]*$/, "");
      searchList.push(activeUrl.href);
    }
    for (const [key, value] of searchParams.entries()) {
      searchList.push(`${key}=${value}`);
    }
    for (const search of searchList) {
      try {
        const b = await browser.bookmarks.search(search as string);
        if (b.length) {
          return b;
        }
      } catch (error) {
          // fix: url like about:debugging#/runtime/this-firefox
        continue;
      }
    }
    return [];
  }

  return (
    <form>
      {bookmarks?.map((bookmark, index) => (
        <label key={bookmark.id} style={{ display: "block" }}>
          <input
            type="radio"
            name="selected"
            value={index}
            defaultChecked={index === 0}
            autoFocus={index === 0}
            onChange={() => setBookmark(bookmark)}
          />
          <a href={bookmark.url}>{bookmark.title}</a>
          <span style={{ color: "gray", marginLeft: "10px" }}>
            ({bookmark.url})
          </span>
        </label>
      ))}
    </form>
  );
});
