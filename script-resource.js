const debug = true;

window.addEventListener('message', event => {
  if (event?.data?.id === 'supercenas' && event?.data?.type === 'request') {
    if (debug) console.log('Message from window!', event.data);
    if (debug) console.log('Message from window!', event.data.payload);

    execute(event.data.payload).then(() => {
      window.postMessage({ id: 'supercenas', type: 'response', done: true });
    });
  }
});

async function execute(request) {
  if (debug) console.log(request)
  const container = document.querySelector('#alunosAulaGrid');
  const tablePagesParts = container.querySelector('#tbtext-1028').textContent.split(' ');
  const tablePages = +tablePagesParts[tablePagesParts.length - 1];
  const firstPageButton = container.querySelector('#button-1023-btnEl');
  const nextPageButton = container.querySelector('#button-1030-btnEl');

  const state = alunosAulaGrid_grid;
  const selectionModel = state.getSelectionModel();
  const events = selectionModel.store.events;


  if (!firstPageButton.disabled) {
    if (debug) console.log(performance.now());
    firstPageButton.click();
    await waitUntil(events.load);
    if (debug) console.log(performance.now());
  }


  await processAllPages(request.students, request.setAbsent);

  async function processAllPages(students, setAbsent) {
    for (let i = 0; i < tablePages; i++) {
      await processNextPage(students, setAbsent);
      if (students.length == 0) break;
      nextPageButton.click();
      return waitUntil(events.load);
    }
  }

  async function processNextPage(students, setAbsent) {
    const table = container.querySelector('#alunosAulaGrid-body table');
    let tableRows = table.querySelectorAll('.x-grid-row');
    if (debug) console.log(tableRows);
    await processStudents(students, tableRows);
  }

  async function processStudents(students, rows) {
    for (let row of rows) {
      await checkStudent(students, row);
    }
  }

  async function checkStudent(students, row) {
    const studentNumberTd = row.querySelector('td:first-child').textContent;
    const checkbox = row.querySelector('td:nth-child(5) input[name="presenca"]');
    const studentIndex = students.findIndex(student => student === studentNumberTd);

    if (studentIndex > -1) {
      // changePresenca(checkbox);
      const selectionRecord = selectionModel.store.getAt(row.viewIndex);
      selectionModel.select(selectionRecord);
      checkbox.click();
      students.splice(studentIndex, 1);
      if (debug) console.log('Click', performance.now());

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