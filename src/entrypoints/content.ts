import { Runtime } from "wxt/browser"

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    browser.runtime.onMessage.addListener(function (message: any, sender: Runtime.MessageSender, sendResponse: (o: any) => void) {
      if (message === 'getPageInfo') {
        getPageInfo(sendResponse);
      }
    })
  },
});
function getPageInfo(sendResponse: (o: any) => void) {
  const url = new URL(window.location.href)
  if (url.host.endsWith('youtube.com') && url.searchParams.has('v')) {
    const video = document.querySelector('video')
    if (video?.currentTime) {
      url.searchParams.set('t', Math.floor(video.currentTime) + '')
    }
  }
  sendResponse({
    url: url.href,
    title: document.title
  });
}

