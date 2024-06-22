
export default defineBackground(() => {
  // console.log('Hello background!', { id: browser.runtime.id });

  // background.ts
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // console.log({ message, sender });

    const callback = callbackMap[message?.action || message + '']
    if (typeof callback === 'function') {
      return callback(message, sender, sendResponse)
    }

    sendResponse()
    return true;
  });
});

const callbackMap: { [key: string]: Function } = {}

callbackMap.getBookmarkByUrl = function (message: { url: any; }, _: any, sendResponse: Function) {
  sendResponse(browser.bookmarks.search({ url: message?.url }))
}