console.log('Runtime', chrome.runtime);
console.log('onMessage', chrome.runtime.onMessage);

var scriptTag = document.createElement('script');
scriptTag.src = chrome.runtime.getURL('script-resource.js');
// scriptTag.onload = function() {
//     this.remove();
// };
(document.head || document.documentElement).appendChild(scriptTag);

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  debugger;
  console.log('Tab', sender.tab);
  const rawStudents = request.students;
  const regex = /\d+/gm;
  const students = rawStudents.match(regex);
  await execute(students);
  sendResponse('Job well done!');
});

async function execute(students) {
  window.postMessage({ id: 'supercenas', type: 'request', payload: students });

  return;

  const container = document.querySelector('#alunosAulaGrid');
  const tablePagesParts = container.querySelector('#tbtext-1028').textContent.split(' ');
  const tablePages = +tablePagesParts[tablePagesParts.length - 1];
  const firstPageButton = container.querySelector('#button-1023-btnEl');
  const nextPageButton = container.querySelector('#button-1030-btnEl');
  console.log('Window', window);


  // const students = ['22541', '22606', '22644', '22623', '22690', '23104', '22586'];

  // const state = alunosAulaGrid_grid;
  // const selectionModel = state.getSelectionModel();
  // const events = selectionModel.store.events;


  // if (!firstPageButton.disabled) {
  //   console.log(performance.now());
  //   firstPageButton.click();
  //   await waitUntil(events.load);
  //   console.log(performance.now());
  // }


  // processAllPages();

  async function processAllPages() {
    for (let i = 0; i < tablePages; i++) {
      await processNextPage();
    }
  }

  async function processNextPage() {
    // debugger;
    const table = container.querySelector('#alunosAulaGrid-body table');
    let tableRows = table.querySelectorAll('.x-grid-row');
    console.log(tableRows);
    await processStudents(students, tableRows);
    nextPageButton.click();

    return waitUntil(events.load);
  }

  async function processStudents(students, rows) {
    for (let row of rows) {
      await checkStudent(students, row);
    }
  }

  async function checkStudent(students, row) {
    const studentNumberTd = row.querySelector('td:first-child').textContent;
    const checkbox = row.querySelector('td:nth-child(5) input[name="presenca"]');
    const studentIndex = students.findIndex(student => +student === +studentNumberTd);

    if (studentIndex > -1) {
      // changePresenca(checkbox);
      const selectionRecord = selectionModel.store.getAt(row.viewIndex);
      selectionModel.select(selectionRecord);
      checkbox.click();
      students.splice(studentIndex, 1);
      console.log('Click', performance.now());

      return waitUntil(events.write);
    }

    return Promise.resolve();
  }

  function waitUntil(event) {
    return new Promise(resolve => {
      function listenerFn() {
        event.removeListener(listenerFn)
        resolve();
      };

      event.addListener(listenerFn);
    });
  }
}