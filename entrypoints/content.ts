import { POSITION_MARKER } from './popup/lib/constants';

const HIDDEN_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK']);

function findElementByText(text: string): Element | null {
  // 策略1：尝试找到包含文本的独立元素（非 <pre>/<code> 的行级元素）
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
  );
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.nodeValue?.includes(text)) continue;
    const el = node.parentElement;
    if (!el) continue;
    if (HIDDEN_TAGS.has(el.tagName)) continue;
    if (el.offsetParent === null && el !== document.body) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    // 如果父元素不是 pre/code，直接返回（精确行级定位）
    const parent = el.closest('pre, code');
    if (!parent) return el;
  }

  // 策略2：在 <pre>/<code> 中找到文本，用 Range 定位精确位置
  const preWalker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
  );
  while (preWalker.nextNode()) {
    const node = preWalker.currentNode;
    if (!node.nodeValue?.includes(text)) continue;
    const el = node.parentElement;
    if (!el) continue;
    if (el.offsetParent === null && el !== document.body) continue;

    // 用 Range 精确定位文本位置
    const range = document.createRange();
    const idx = node.nodeValue.indexOf(text);
    range.setStart(node, idx);
    range.setEnd(node, idx + text.length);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;

    // 创建一个临时锚点元素，滚动到它
    const anchor = document.createElement('span');
    anchor.id = 'ir-ext-scroll-anchor';
    anchor.style.position = 'absolute';
    anchor.style.left = `${rect.left + window.scrollX}px`;
    anchor.style.top = `${rect.top + window.scrollY}px`;
    anchor.style.width = '1px';
    anchor.style.height = '1px';
    anchor.style.pointerEvents = 'none';
    document.body.appendChild(anchor);
    return anchor;
  }

  return null;
}

function scrollToElement(el: Element): void {
  // 如果是临时锚点，滚动到它上方一些位置以保持可见
  if (el.id === 'ir-ext-scroll-anchor') {
    const rect = el.getBoundingClientRect();
    const targetY = window.scrollY + rect.top - 100; // 留 100px 上边距
    window.scrollTo({ top: targetY, behavior: 'smooth' });
    // 清理锚点
    setTimeout(() => el.remove(), 2500);
    return;
  }
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

async function autoScrollToPosition() {
  try {
    const bookmarks: any[] = await browser.runtime.sendMessage({
      type: 'searchBookmarks',
      query: location.href,
    });

    // 精确匹配当前 URL 的书签
    const exact = bookmarks.filter((b: any) => {
      if (!b.url) return false;
      if (b.url === location.href) return true;
      try { return decodeURIComponent(b.url) === decodeURIComponent(location.href); }
      catch { return false; }
    });

    for (const bm of exact) {
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
  matches: ['<all_urls>', 'file:///*'],
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
