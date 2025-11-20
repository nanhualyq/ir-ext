export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    scrollLastText()
    browser.runtime.onMessage.addListener(function (
      message: any,
      sender: Browser.runtime.MessageSender,
      sendResponse: (o: any) => void
    ) {
      if (message === "getPageInfo") {
        getPageInfo(sendResponse);
      }
      if (message === "scrollLastText") {
        scrollLastText();
      }
    });
  },
});

function countOccurrences(subStr: string) {
  const elList = document.querySelectorAll("body > *:not(script)");
  for (const el of elList) {
    const regex = new RegExp(subStr, "g"); // 全局匹配
    const matches = el.textContent?.match(regex);
    if (matches?.length) {
      return matches.length;
    }
  }
  return 0;
}

function getPageInfo(sendResponse: (o: any) => void) {
  const url = new URL(window.location.href);
  let title = document.title;
  if (url.host.endsWith("youtube.com") && url.searchParams.has("v")) {
    const video = document.querySelector("video");
    if (video?.currentTime) {
      url.searchParams.set("t", Math.floor(video.currentTime) + "");
    }
  }
  // 单个元素内的文本包含\n会被换成空白
  const selection = window.getSelection();
  if (selection?.type === "Range") {
    const selectionText = selection.toString().trim();
    title += `___lastText=${selectionText}`;
    if (countOccurrences(selectionText) > 1) {
      alert("Your selected text is not unique!");
      return
    }
  }
  sendResponse({
    url: url.href,
    title,
  });
}

async function scrollLastText() {
  const [bookmark] = await browser.runtime.sendMessage({
    action: 'getBookmarkByUrl',
    url: window.location.href
  })
  if (!bookmark) {
    console.log('ir-ext', 'no bookmark');
    return;
  }
  const lastText = bookmark.title.match(/___lastText=(.*)$/)?.[1] || '';
  if (!lastText) {
    console.log('ir-ext', 'no lastText');
    return;
  }

  console.log('ir-ext', `start find lastText: ${lastText}`);
  const elements = Array.from(document.querySelectorAll('body *:not(script)'));
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i]!;
    if (el.textContent?.replaceAll(/\s+/g, ' ')?.includes(lastText)) {
      console.log('ir-ext', `lastText match element`, el);
      if (el instanceof HTMLElement) {
        Object.assign(el.style, {
          // backgroundColor: 'yellow',
          textDecoration: 'line-through',
        });
      }
      el.scrollIntoView();
      return;
    }
  }
  console.log('ir-ext', 'lastText not match any element');
}