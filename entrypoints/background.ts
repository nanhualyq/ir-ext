export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'searchBookmarks') {
      browser.bookmarks.search(message.query).then(sendResponse);
      return true; // async response
    }
  });
});
