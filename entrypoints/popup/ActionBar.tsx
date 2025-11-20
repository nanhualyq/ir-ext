import { CSSProperties, memo, PropsWithChildren } from "react";

type Props = {
  currentTab: Browser.tabs.Tab;
  bookmark: Browser.bookmarks.BookmarkTreeNode;
};

export default memo(function ({
  currentTab,
  bookmark,
}: PropsWithChildren<Props>) {
  const [info, setInfo] = useState<{
    style: CSSProperties;
    message: string;
  } | null>(null);

  async function replaceBookmark() {
    try {
      setInfo(null);
      const pageInfo = await browser.tabs.sendMessage(
        currentTab.id!,
        "getPageInfo"
      );
      if (!pageInfo) {
        return;
      }
      await browser.bookmarks.update(bookmark.id, pageInfo);
      setInfo({
        style: { color: "green" },
        message: "Bookmark Updated",
      });
    } catch (error) {
      setInfo({
        style: { color: "red" },
        message: error + "",
      });
    }
  }

  async function readSibling(offset: number) {
    const siblings = await browser.bookmarks.getChildren(bookmark.parentId!);

    if (siblings.length <= 1) {
      return;
    }
    let newIndex = bookmark.index || 0;
    while (true) {
      newIndex += offset;
      if (newIndex === -1) {
        newIndex = siblings.length - 1;
      }
      const newMarkbook = siblings[newIndex % siblings.length]!;
      const isFolder = !!newMarkbook.children || !newMarkbook.url;
      const isSeparator = newMarkbook.url === "data:";
      if (isFolder || isSeparator) {
        continue;
      }
      await browser.tabs.update(currentTab.id, { url: newMarkbook.url });
      window.close();
      break;
    }
  }

  function scrollLastText() {
    browser.tabs.sendMessage(currentTab.id!, "scrollLastText");
  }

  return (
    <>
      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <button onClick={replaceBookmark} accessKey="u">
          Update
        </button>
        <button
          className="secondary"
          onClick={() => readSibling(-1)}
          accessKey="p"
        >
          Prev
        </button>
        <button
          className="secondary"
          onClick={() => readSibling(1)}
          accessKey="n"
        >
          Next
        </button>
        <button className="secondary" onClick={scrollLastText} accessKey="s">
          ScrollLast
        </button>
      </div>
      {info && <div style={info.style}>{info.message}</div>}
    </>
  );
});
