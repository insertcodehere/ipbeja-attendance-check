const debug = false;

let total = -1;

function log(message, ...args) {
  if (debug) console.log(message, ...args);
}

window.addEventListener('message', event => {
  if (event?.data?.id === 'supercenas' && event?.data?.source === 'CONTENT_SCRIPT') {
    log('Message received in script:', event.data.payload);
    let payload = event.data.payload;
    total = payload.students.length;
    execute(payload).then(() => {
      const responsePayload = { done: true };
      window.postMessage({ id: 'supercenas', source: 'SCRIPT', payload: responsePayload });
    });
  }
});

async function execute(request) {
  log(request)
  const container = document.querySelector('#alunosAulaGrid');
  const tablePages = Math.ceil(alunosAulaGrid_grid.store.totalCount / alunosAulaGrid_grid.store.pageSize);
  const [firstPageButton, , nextPageButton] = document.querySelectorAll('#PagingToolbar_marcarfaltasalunos_alunosAulaGrid-targetEl button');
  const saveButton = document.querySelector('#marcacaoFaltasDialog_gravar-btnEl');
  const setAllStudentsAbsentButton = document.querySelector('#alunosAulaGrid > div:first-child .x-btn:nth-child(5) button');

  const state = alunosAulaGrid_grid;
  const selectionModel = state.getSelectionModel();
  const events = selectionModel.store.events;


  if (!firstPageButton.disabled) {
    firstPageButton.click();
    await waitUntil(events.load);
  }


  await processAllPages(request.students, request.setAbsent);
  // window.postMessage({ id: 'supercenas', type: 'response', missingStudents : request.students});

  if (request.autoSave) {
    saveButton.click();
    await waitUntil(events.load);
  }

  async function processAllPages(students, setAbsent) {
    // If setAbsent, cenas
    if (setAbsent) {
      setAllStudentsAbsentButton.click();
      await waitUntil(events.load);
    }

    for (let i = 0; i < tablePages; i++) {
      await processNextPage(students);
      if (students.length == 0) break;
      nextPageButton.click();
      await waitUntil(events.load);
    }
  }

  async function processNextPage(students) {
    const table = container.querySelector('#alunosAulaGrid-body table');
    let tableRows = table.querySelectorAll('.x-grid-row');
    await processStudents(students, tableRows);
  }

  async function processStudents(students, rows) {
    for (let row of rows) {
      await checkStudent(students, row);
      if (students.length == 0) break;
    }
  }

  async function checkStudent(students, row) {
    const studentNumberTd = row.querySelector('td:first-child').textContent;
    const checkbox = row.querySelector('td:nth-child(5) input[name="presenca"]');
    const studentIndex = students.findIndex(student => student === studentNumberTd);

    if (studentIndex > -1) {
      let done;
      if (!checkbox.checked) {
        const selectionRecord = selectionModel.store.getAt(row.viewIndex);
        selectionModel.select(selectionRecord);
        checkbox.click();
        done = waitUntil(events.write).then(() => {
          window.postMessage({ id: 'supercenas', source: 'SCRIPT', payload: { processedStudents: total - students.length, total: total } });
        });
      }

      students.splice(studentIndex, 1);

      return done;
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