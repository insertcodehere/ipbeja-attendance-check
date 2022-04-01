const debug = false;

const ports = {};

function log(message, ...args) {
  if (debug) console.log(message, ...args);
}

log('Background script loaded');
log('Runtime', chrome.runtime);

// Necessary
chrome.runtime.onConnect.addListener(function (port) {
  console.assert(port.name === 'student-attendance-channel');
  log(ports);

  if (port.sender.origin.includes('portal.ipbeja.pt')) {
    ports['page'] = port;
  }
  else if (port.sender.origin.includes('chrome-extension')) {
    ports['extension'] = port;
  }


  port.onMessage.addListener(function (event) {
    if (event.source === 'POPUP') {
      log('[Done] Relay to content-script.js', event);
      ports['page'].postMessage(event);
    }
    else if (event.source === 'CONTENT_SCRIPT') {
      log('[In progress] Relay to popup.js', event);
      ports['extension'].postMessage(event);
    }
    else {
      // Source, Destination, Id, Payload
      log('Else', event);
    }
  });
});

// For debug
chrome.runtime.onInstalled.addListener(() => {
  log('Installed');
});

chrome.runtime.onStartup.addListener(() => {
  log('OnStartup');
});

chrome.runtime.onSuspend.addListener(() => {
  log('OnSuspend');
});

chrome.runtime.onSuspendCanceled.addListener(() => {
  log('OnSuspendCanceled');
});
