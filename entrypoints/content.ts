import { POSITION_MARKER } from './popup/lib/constants';

const HIDDEN_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK']);

function findElementByText(text: string): Element | null {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
  );
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.nodeValue?.includes(text)) continue;
    const el = node.parentElement;
    if (!el) continue;
    // Skip non-visible elements: script, style, noscript, etc.
    if (HIDDEN_TAGS.has(el.tagName)) continue;
    // Skip elements not in the layout (hidden, offscreen, etc.)
    if (el.offsetParent === null && el !== document.body) continue;
    // Skip zero-size elements (collapsed, display:none, etc.)
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    return el;
  }
  return null;
}

function scrollToElement(el: Element): void {
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.classList.remove('ir-ext-flash-highlight');
  void (el as HTMLElement).offsetWidth;
  el.classList.add('ir-ext-flash-highlight');
  setTimeout(() => el.classList.remove('ir-ext-flash-highlight'), 2000);
}

function hasPositionMarker(title: string): boolean {
  return title.includes(POSITION_MARKER);
}

function parsePositionText(title: string): string {
  const idx = title.indexOf(POSITION_MARKER);
  return idx !== -1 ? title.slice(idx + POSITION_MARKER.length) : '';
}

async function searchBookmarks(query: object) {
  return browser.runtime.sendMessage({ type: 'searchBookmarks', query });
}

async function autoScrollToPosition() {
  try {
    const bookmarks = await searchBookmarks({ url: location.href });

    for (const bm of bookmarks) {
      if (!bm.title || !hasPositionMarker(bm.title)) continue;

      const positionText = parsePositionText(bm.title);
      if (!positionText) return;

      const el = findElementByText(positionText);
      if (!el) return;

      scrollToElement(el);
      return;
    }
  } catch {
    // silently skip
  }
}

function waitForBody(fn: () => void) {
  if (document.body) {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  }
}

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ir-ext-flash {
        0%, 100% { background-color: transparent; }
        25%, 75% { background-color: rgba(255, 213, 79, 0.45); }
      }
      .ir-ext-flash-highlight {
        animation: ir-ext-flash 2s ease-in-out;
        border-radius: 3px;
        transition: background-color 0.3s;
      }
    `;
    (document.head || document.documentElement).appendChild(style);

    waitForBody(autoScrollToPosition);

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'getSelection') {
        const text = window.getSelection()?.toString().trim() || null;
        if (text && text.length > 0) {
          const body = document.body.innerText;
          const count = body.split(text).length - 1;
          if (count > 1) {
            alert(`Selected text appears ${count} times on this page. Please select a unique snippet.`);
            sendResponse({ cancelled: true });
            return true;
          }
        }
        sendResponse({ selectedText: text });
        return true;
      }

      if (message.type === 'scrollToText' && message.text) {
        const el = findElementByText(message.text);
        if (el) {
          scrollToElement(el);
          sendResponse({ found: true });
        } else {
          sendResponse({ found: false });
        }
        return true;
      }

      if (message.type === 'scrollToLastPosition') {
        autoScrollToPosition();
        sendResponse({ ok: true });
        return true;
      }
    });
  },
});
