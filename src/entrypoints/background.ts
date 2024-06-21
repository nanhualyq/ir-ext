
export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  // background.ts
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log({ message, sender });

    const callback = callbackMap[message?.action || message + '']
    if (typeof callback === 'function') {
      return callback(message, sender, sendResponse)
    }


    // // Wait 1 second and respond with "pong"
    // setTimeout(() => sendResponse(res), 1000);

    sendResponse()

    // const res = await execSql('select * from items2')
    // console.log(res);

    return true;
  });
});

const callbackMap: { [key: string]: Function } = {}

// callbackMap.addPage = function ({ newUrl }) {
//   console.log(newUrl)
// }