export default defineBackground(() => {
  // background.ts
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getBookmarkByUrl") {
      sendResponse(browser.bookmarks.search({ url: message.url }));
      return true;
    }

    if (message.action === "fetch") {
      fetch(message.url, message.options)
        .then((res) => res.json())
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((err) => {
          sendResponse({ success: false, error: err.message });
        });

      // ⭐ 关键：告诉浏览器这是异步响应
      return true;
    }

    sendResponse();
    return true;
  });
});
