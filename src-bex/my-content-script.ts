/**
 * Importing the file below initializes the content script.
 *
 * Warning:
 *   Do not remove the import statement below. It is required for the extension to work.
 *   If you don't need createBridge(), leave it as "import '#q-app/bex/content'".
 */
import { createBridge } from '#q-app/bex/content';

// The use of the bridge is optional.
const bridge = createBridge({ debug: false });
/**
 * bridge.portName is 'content@<path>-<number>'
 *   where <path> is the relative path of this content script
 *   filename (without extension) from /src-bex
 *   (eg. 'my-content-script', 'subdir/my-script')
 *   and <number> is a unique instance number (1-10000).
 */

declare module '@quasar/app-vite' {
  interface BexEventMap {
    'some.event': [{ someProp: string }, void];
  }
}

// Hook into the bridge to listen for events sent from the other BEX parts.
bridge.on('some.event', ({ payload }) => {
  if (payload.someProp) {
    // Access a DOM element from here.
    // Document in this instance is the underlying website the contentScript runs on
    const el = document.getElementById('some-id');
    if (el) {
      el.innerText = 'Quasar Rocks!';
    }
  }
});

/**
 * Leave this AFTER you attach your initial listeners
 * so that the bridge can properly handle them.
 *
 * You can also disconnect from the background script
 * later on by calling bridge.disconnectFromBackground().
 *
 * To check connection status, access bridge.isConnected
 */
bridge
  .connectToBackground()
  .then(() => {
    console.log('Connected to background');
    void scrollLastText();
  })
  .catch((err) => {
    console.error('Failed to connect to background:', err);
  });

/*
// More examples:

// Listen to a message from the client
bridge.on('test', message => {
  console.log(message);
  console.log(message.payload);
});

// Send a message and split payload into chunks
// to avoid max size limit of BEX messages.
// Warning! This happens automatically when the payload is an array.
// If you actually want to send an Array, wrap it in an object.
bridge.send({
  event: 'test',
  to: 'app',
  payload: [ 'chunk1', 'chunk2', 'chunk3', ... ]
}).then(responsePayload => { ... }).catch(err => { ... });

// Send a message and wait for a response
bridge.send({
  event: 'test',
  to: 'background',
  payload: { banner: 'Hello from content-script' }
}).then(responsePayload => { ... }).catch(err => { ... });

// Listen to a message from the client and respond synchronously
bridge.on('test', message => {
  console.log(message);
  return { banner: 'Hello from a content-script!' };
});

// Listen to a message from the client and respond asynchronously
bridge.on('test', async message => {
  console.log(message);
  const result = await someAsyncFunction();
  return result;
});
bridge.on('test', message => {
  console.log(message);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ banner: 'Hello from a content-script!' });
    }, 1000);
  });
});

// Broadcast a message to background, app & the other content scripts
bridge.portList.forEach(portName => {
  bridge.send({ event: 'test', to: portName, payload: 'Hello from content-script!' });
});

// Find any connected content script and send a message to it
const contentPort = bridge.portList.find(portName => portName.startsWith('content@'));
if (contentPort) {
  bridge.send({ event: 'test', to: contentPort, payload: 'Hello from a content-script!' });
}

// Send a message to a certain content script
bridge
  .send({ event: 'test', to: 'content@my-content-script-2345', payload: 'Hello from a content-script!' })
  .then(responsePayload => { ... })
  .catch(err => { ... });

// Listen for connection events
// (the "@quasar:ports" is an internal event name registered automatically by the bridge)
// --> ({ portList: string[], added?: string } | { portList: string[], removed?: string })
bridge.on('@quasar:ports', ({ portList, added, removed }) => {
  console.log('Ports:', portList);
  if (added) {
    console.log('New connection:', added);
  } else if (removed) {
    console.log('Connection removed:', removed);
  }
});

// Current bridge port name (can be 'content@<name>-<xxxxx>')
console.log(bridge.portName);

// Dynamically set debug mode
bridge.setDebug(true); // boolean

// Log a message on the console (if debug is enabled)
bridge.log('Hello world!');
bridge.log('Hello', 'world!');
bridge.log('Hello world!', { some: 'data' });
bridge.log('Hello', 'world', '!', { some: 'object' });
// Log a warning on the console (regardless of the debug setting)
bridge.warn('Hello world!');
bridge.warn('Hello', 'world!');
bridge.warn('Hello world!', { some: 'data' });
bridge.warn('Hello', 'world', '!', { some: 'object' });
*/

// import { onMessage, sendMessage } from "./messaging";

// export default defineContentScript({
//   matches: ["<all_urls>"],
//   main() {
//     onMessage('getPageInfo', getPageInfo)
//     scrollLastText()
//   },
// });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPageInfo') {
    sendResponse(getPageInfo());
  } else if (message.action === 'scrollLastText') {
    void scrollLastText();
  }
});

function countOccurrences(str: string, subStr: string) {
  const regex = new RegExp(subStr, 'g'); // 全局匹配
  const matches = str.match(regex);
  return matches ? matches.length : 0;
}

function getPageInfo() {
  const url = new URL(window.location.href);
  let title = document.title;
  if (url.host.endsWith('youtube.com') && url.searchParams.has('v')) {
    const video = document.querySelector('video');
    if (video?.currentTime) {
      url.searchParams.set('t', Math.floor(video.currentTime) + '');
    }
  }
  // 单个元素内的文本包含\n会被换成空白
  const selection = window.getSelection();
  if (selection?.type === 'Range') {
    const selectionText = selection.toString().trim();
    title += `___lastText=${selectionText}`;
    if (countOccurrences(document.body.textContent || '', selectionText) > 1) {
      alert('Your selected text is not unique!');
    }
  }
  return {
    url: url.href,
    title,
  };
}

async function scrollLastText() {
  const [bookmark] = await bridge.send({
    event: 'getBookmarkByUrl',
    payload: window.location.href,
    to: 'background',
  });
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
