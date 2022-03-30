const debug = true;

if (debug) console.log('Runtime', chrome.runtime);
if (debug) console.log('onMessage', chrome.runtime.onMessage);

const scriptElement = document.createElement('script');
scriptElement.src = chrome.runtime.getURL('script.js');
(document.head || document.documentElement).appendChild(scriptElement);



chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (debug) console.log('Tab', sender.tab);
  const rawStudents = request.students;

  const regex = /[1-9]\d{3,4}/gm; // todo: use request.regex if not empty
  const students = rawStudents.match(regex);
  request.students = students;

  /* window.addEventListener('message', (event) => {
    if (event.data.id === 'supercoiso' && event.data.type === 'response') {
        sendResponse(event.data);
    }
  }) */
  await execute(request);


});

async function execute(students) {
  window.postMessage({ id: 'supercenas', type: 'request', payload: students });

  return;
}