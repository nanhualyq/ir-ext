import ActionBar from "./ActionBar";
import BookmarkList from "./BookmarkList";

export default function () {
  const [currentTab, setCurrentTab] = useState<Browser.tabs.Tab>();
  const [bookmark, setBookmark] =
    useState<Browser.bookmarks.BookmarkTreeNode>();

  useEffect(() => {
    browser.tabs
      .query({
        active: true,
        currentWindow: true,
      })
      .then((tabs) => {
        setCurrentTab(tabs?.[0]);
        if (!tabs.length) {
          throw Error("no current tab");
        }
      });
  }, []);

  if (!currentTab) {
    return "Loading";
  }

  return (
    <div style={{ padding: "1rem" }}>
      <BookmarkList
        currentTab={currentTab}
        setBookmark={setBookmark}
      ></BookmarkList>
      {bookmark && (
        <ActionBar currentTab={currentTab} bookmark={bookmark}></ActionBar>
      )}
    </div>
  );
}
