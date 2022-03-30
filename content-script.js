console.log('Runtime', chrome.runtime);
console.log('onMessage', chrome.runtime.onMessage);

const scriptElement = document.createElement('script');
scriptElement.src = chrome.runtime.getURL('script.js');
(document.head || document.documentElement).appendChild(scriptElement);

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  debugger;
  console.debug('Tab', sender.tab);
  const rawStudents = request.students;
  const regex = /[1-9]\d{3,4}/gm;
  const students = rawStudents.match(regex);
  await execute(students);
  sendResponse('Job well done!');
});

/* chrome.runtime.onInstalled.addListener((reason) => {
  debugger;
  if (reason !== chrome.runtime.OnInstalledReason.INSTALL) { return }

  userCount();
});

function userCount() { } */

function sendExecutionMessage(config) {
  window.postMessage({ id: 'supercenas', type: 'request', payload: students });
}

async function execute(students) {
  window.postMessage({ id: 'supercenas', type: 'request', payload: students });

  return;
}