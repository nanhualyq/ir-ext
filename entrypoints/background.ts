export default defineBackground(() => {
  // background.ts
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.action === "getBookmarkByUrl") {
      sendResponse(browser.bookmarks.search({ url: message.url }));
      return;
    }

    sendResponse();
    return true;
  });
});