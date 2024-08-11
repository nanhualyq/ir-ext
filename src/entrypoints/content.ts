import { Runtime } from "wxt/browser"

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    browser.runtime.onMessage.addListener(function (message: any, sender: Runtime.MessageSender, sendResponse: (o: any) => void) {
      if (message === 'getPageInfo') {
        getPageInfo(sendResponse);
      }
    })
    scrollLastText()
  },
});
function getPageInfo(sendResponse: (o: any) => void) {
  const url = new URL(window.location.href)
  let title = document.title
  if (url.host.endsWith('youtube.com') && url.searchParams.has('v')) {
    const video = document.querySelector('video')
    if (video?.currentTime) {
      url.searchParams.set('t', Math.floor(video.currentTime) + '')
    }
  }
  // 单个元素内的文本包含\n会被换成空白
  const selection = window.getSelection()
  if (selection?.type === 'Range') {
    title += ` - ${JSON.stringify({
      lastText: selection.toString().trim()
    })}`
  }
  sendResponse({
    url: url.href,
    title
  });
}
async function scrollLastText() {
  const [bookmark] = await browser.runtime.sendMessage({
    action: 'getBookmarkByUrl',
    url: window.location.href
  })
  if (!bookmark) {
    return
  }
  const jsonText = bookmark.title.match(/\{.*\}$/)?.[0] || ''
  const { lastText } = JSON.parse(jsonText) || {}
  if (!lastText) {
    return
  }

  const doms = Array.from(document.querySelectorAll('*:not(script)'))
    .filter(el => el.textContent
      ?.replaceAll(/\n|\s+/g, ' ')
      ?.includes(lastText)
    )

  doms[doms.length - 1]?.scrollIntoView()
}