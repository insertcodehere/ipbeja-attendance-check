const debug = false;

function log(message, ...args) {
  if (debug) console.log(message, ...args);
}

const port = chrome.runtime.connect(chrome.runtime.id, { name: 'student-attendance-channel' });

port.onMessage.addListener(function (event) {
  log('Settings', event);
  dispatchWorker(event.payload);
});

// Inject and load the script into the page
const scriptElement = document.createElement('script');
scriptElement.src = chrome.runtime.getURL('script.js');
(document.head || document.documentElement).appendChild(scriptElement);

function dispatchWorker(settings) {
  window.postMessage({ id: 'supercenas', source: 'CONTENT_SCRIPT', payload: settings });
}

window.addEventListener('message', event => {
  if (event.data?.id === 'supercenas' && event.data.source === 'SCRIPT') {
    log('Message received at ContentScript:', event.data.payload);

    // Progress
    // Done
    port.postMessage({ source: 'CONTENT_SCRIPT', payload: event.data.payload });
  }
});

// chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
//   log('On message sender tab:', sender.tab);

//   window.addEventListener('message', (event) => {
//     if (event.data.id === 'supercoiso' && event.data.type === 'response') {
//       sendResponse(event.data);
//     }
//   })
//   await execute(request);

//   return true;
// });

// async function execute(students) {
//   window.postMessage({ id: 'supercenas', type: 'request', payload: students });

//   return;
// }