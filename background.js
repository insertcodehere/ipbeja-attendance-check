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
      log('Relay to content-script.js', event);
      ports['page'].postMessage(event);
    }
    else if (event.source === 'CONTENT_SCRIPT') {
      log('Relay to popup.js', event);
      ports['extension'].postMessage(event);
    }
    else {
      log('Else', event);
    }
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  console.log('ChangeInfo', changeInfo);
  console.log('Tab', tab);

  if (!changeInfo.url) return;

  if (changeInfo.url.includes('portal.ipbeja.pt/netpa')) {
    chrome.action.enable({
      tabId: tabId
    });
  }
  else {
    chrome.action.disable({
      tabId: tabId
    });
  }
});

chrome.tabs.onActivated.addListener(function (tabInfo) {
  log('CurrentTabInfo:', tabInfo);
  chrome.tabs.get(tabInfo.tabId, function (currentTab) {
    log('CurrentTab:', currentTab);
    if (currentTab.url.includes('portal.ipbeja.pt/netpa')) {
      chrome.action.enable({
        tabId: tabInfo.tabId
      })
    }
    else {
      chrome.action.disable({
        tabId: tabInfo.tabId
      });
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
