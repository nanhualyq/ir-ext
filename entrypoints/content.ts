export default defineContentScript({
  matches: ["<all_urls>"],
  main(ctx) {
    scrollLastText();
    ctx.addEventListener(window, "keyup", handleKeyup, {
      passive: true,
    });
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
      return;
    }
  }
  sendResponse({
    url: url.href,
    title,
  });
}

async function scrollLastText() {
  const [bookmark] = await browser.runtime.sendMessage({
    action: "getBookmarkByUrl",
    url: window.location.href,
  });
  if (!bookmark) {
    console.log("ir-ext", "no bookmark");
    return;
  }
  const lastText = bookmark.title.match(/___lastText=(.*)$/)?.[1] || "";
  if (!lastText) {
    console.log("ir-ext", "no lastText");
    return;
  }

  console.log("ir-ext", `start find lastText: ${lastText}`);
  const elements = Array.from(document.querySelectorAll("body *:not(script)"));
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i]!;
    if (el.textContent?.replaceAll(/\s+/g, " ")?.includes(lastText)) {
      console.log("ir-ext", `lastText match element`, el);
      if (el instanceof HTMLElement) {
        Object.assign(el.style, {
          // backgroundColor: 'yellow',
          textDecoration: "line-through",
        });
      }
      el.scrollIntoView();
      return;
    }
  }
  console.log("ir-ext", "lastText not match any element");
}

const CODE = Symbol();
const HTML = Symbol();
let mode: symbol | null = null;

function setMode(m: symbol) {
  mode = m;
  setTimeout(() => {
    mode = null;
  }, 3000);
}

const keysMap = {
  "ctrl+alt+1": () => postAnki(),
  "ctrl+alt+2": () => postAnki({ field: "Back" }),
  "ctrl+alt+3": () => postAnki({ modelName: "@Cloze", field: "Text" }),
  "ctrl+alt+c": () => setMode(CODE),
  "ctrl+alt+h": () => setMode(HTML),
};

function handleKeyup(e: KeyboardEvent) {
  let key = e.ctrlKey ? "ctrl+" : "";
  key += e.altKey ? "alt+" : "";
  key += e.key;
  if (key in keysMap) {
    keysMap[key as "ctrl+alt+1"]();
  }
}

function escapeHTML(str: string) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getAllSelectedHTML() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";
  const container = document.createElement("div");

  for (let i = 0; i < selection.rangeCount; i++) {
    container.appendChild(selection.getRangeAt(i).cloneContents());
  }
  return container.innerHTML;
}

function getText() {
  const text = window?.getSelection()?.toString();
  if (!text) {
    return "";
  }
  if (mode === CODE) {
    return `<pre><code>${escapeHTML(text)}</code></pre><br>`;
  } else if (mode === HTML) {
    return getAllSelectedHTML();
  }
  return text;
}

function postAnki(options?: { field?: string; modelName?: string }) {
  browser.runtime
    .sendMessage({
      action: "fetch",
      url: "http://127.0.0.1:8765",
      options: {
        method: "POST",
        body: JSON.stringify({
          version: 6,
          action: "guiAddCards",
          params: {
            note: {
              deckName: "Default",
              modelName: options?.modelName || "@Basic",
              fields: {
                [options?.field || "Front"]: getText(),
                Url: location.href,
                Title: document.title,
              },
            },
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    })
    .then(console.log);
}
