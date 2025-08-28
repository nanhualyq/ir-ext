import { onMessage } from "./messaging";

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });
  onMessage('getBookmarkByUrl', ({ data: url }) => {
    return browser.bookmarks.search({ url })
  })
});
