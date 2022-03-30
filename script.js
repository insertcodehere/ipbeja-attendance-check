window.addEventListener('message', event => {
  if (event?.data?.id === 'supercenas' && event?.data?.type === 'request') {
    console.log('Message from window!', event.data);
    console.log('Message from window!', event.data.payload);
    let payload = event.data.payload;
    execute(payload).then(() => {
      //window.postMessage({ id: 'supercenas', type: 'response', done: true });
      window.postMessage({ id: 'supercenas', type: 'response', done: true, missingStudents: payload.students });
    });
  }

});

async function execute(studentsArg) {
  const container = document.querySelector('#alunosAulaGrid');
  const tablePagesParts = container.querySelector('#tbtext-1028').textContent.split(' ');
  const tablePages = +tablePagesParts[tablePagesParts.length - 1];
  const firstPageButton = container.querySelector('#button-1023-btnEl');
  const nextPageButton = container.querySelector('#button-1030-btnEl');

  const state = alunosAulaGrid_grid;
  const selectionModel = state.getSelectionModel();
  const events = selectionModel.store.events;


  if (!firstPageButton.disabled) {
    console.log(performance.now());
    firstPageButton.click();
    await waitUntil(events.load);
    console.log(performance.now());
  }


  await processAllPages(studentsArg);


  async function processAllPages(students) {
    for (let i = 0; i < tablePages; i++) {
      await processNextPage(students);
    }
  }

  async function processNextPage(students) {
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
    const studentIndex = students.findIndex(student => student === studentNumberTd);

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