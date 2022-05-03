const debug = false;

const defaultRegex = /\b[1-9][0-9]{3,4}(?![0-9])/gm;
const defaultRegex2 = /\b[1-9][0-9]{3,4}\b/gm;

const studentsTextarea = document.querySelector('.student-ids');
const autoSaveCheckbox = document.querySelector('#auto-save-switch');
const setAbsentCheckbox = document.querySelector('#student-absence-switch');
const regexText = document.querySelector("#student-ids-regex-input");
const executeButton = document.querySelector('.action.action-execute');
const highlights = document.querySelector('.highlights');
const backdrop = document.querySelector('.backdrop');
const spinner = executeButton.querySelector('.actions .spinner-border');
const progressBar = document.querySelector('.execution-progress > .progress-bar');
const alertStudentsNotFound = document.querySelector('.alert-students-not-found');
const attendanceFile = document.querySelector('#attendance-file-input');
const modal = document.querySelector('#selectFileDataDialog');
const attendanceDateElement = modal.querySelector('.select-date-control select');
const attendanceStatesElement = modal.querySelector('.all-states .controls');
const modalCancelBtns = modal.querySelectorAll('.cancel');
const modalExecuteBtn = modal.querySelector('.execute');
const modalFooterContainer = modal.querySelector('.modal-footer');
const modalSuccessContainer = modal.querySelector('.success-file-extraction');
const modalFailureContainer = modal.querySelector('.failure-file-extraction');

let bootstrapModal = new bootstrap.Modal(document.getElementById('selectFileDataDialog'), {
  backdrop: true,
  keyboard: false,
  focus: true
});

let attendanceData = null;

attendanceFile.addEventListener('change', onUploadFile);

regexText.addEventListener('input', _ => {
  textAreaUpdate();
  const isRegexEmpty = !regexText.checkValidity();

  if (isRegexEmpty) {
    regexText.classList.add('is-invalid');
  }
  else {
    regexText.classList.remove('is-invalid');
  }
});

modalCancelBtns.forEach(btn => {
  btn.addEventListener('click', event => {
    attendanceFile.value = null;
    attendanceData = null;
  });
})

modalExecuteBtn.addEventListener('click', event => {
  log('Execute the attendance check from the file.');

  // 1. Get the date
  const sessionDate = {
    column: attendanceDateElement.value,
    value: attendanceDateElement.selectedOptions[0].innerText
  };

  // 2. Get the states
  let selectedStates = attendanceStatesElement.querySelectorAll('input[type="checkbox"]:checked');
  selectedStates = Array.from(selectedStates).map(element => ({
    column: element.dataset.column,
    value: element.dataset.val
  }));

  // 3. Prepare the regex to detect if the student attendant the class or not
  const statesJoined = selectedStates.map(s => s.value).join('|');
  const regexStr = String.raw`^[${statesJoined}]{1,2}(?=\s)`;
  const regex = new RegExp(regexStr);

  // 4. Map the type to array of studentIds
  const studentIds = attendanceData.content
    .filter(student => {
      // Using the student[0].row but any item from that array would work as the row is the same for every item
      const cellText = attendanceData.fileData[`${sessionDate.column}${student[0].row}`].v;
      return regex.test(cellText) && student[2].value;
    })
    .map(student => student[2].value.toString());
  // 5. Execute the attendance check
  executeAttendanceCheck(studentIds);

  // Close the dialog and reset the state
  bootstrapModal.hide();
  attendanceFile.value = null;
});

function log(message, ...args) {
  if (debug) console.log(message, ...args);
}

const revertConfigurationButton = document.querySelector('#revert-configuration-to-default');
const revertDeveloperButton = document.querySelector('#revert-developer-to-default');

revertConfigurationButton.addEventListener('click', _ => {
  autoSaveCheckbox.checked = false;
  setAbsentCheckbox.checked = true;
});

revertDeveloperButton.addEventListener('click', _ => {
  regexText.value = '\\b[1-9][0-9]{3,4}(?![0-9])';
});

log('Popup opened');

const port = chrome.runtime.connect(chrome.runtime.id, { name: 'student-attendance-channel' });

port.onMessage.addListener(function (event) {
  // Progress
  if (event.source === 'CONTENT_SCRIPT' && !event.payload.done) {
    const percentage = Math.round((event.payload.processedStudents / event.payload.total) * 100);
    log('Calculate progress bar', percentage, event.payload);
    progressBar.style.width = `${percentage}%`;
    progressBar.innerText = `${percentage}%`;
    progressBar.ariaValueNow = `${percentage}`;
  }

  // Done
  if (event.source === 'CONTENT_SCRIPT' && event.payload.done) {
    const notFoundStudents = event.payload.notFoundStudents;
    if (notFoundStudents.length) {
      progressBar.style.width = `100%`;
      progressBar.innerText = `100%`;
      progressBar.ariaValueNow = `100`;

      textAreaUpdate(notFoundStudents);

      const alertContent = `
      <div class="alert-students-not-found-content alert alert-warning d-flex alert-dismissible fade show" role="alert">
        <svg
          class="bi flex-shrink-0 me-2"
          width="24"
          height="24"
          role="img"
          aria-label="Warning:"
          viewBox="0 0 16 16">
          <path
            d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
        </svg>
        <div class="alert-message">
          <div class="alert-message-intro">The students below could not be found.</div>
          <ul>
            ${notFoundStudents.map(notFoundStudent => `<li>${notFoundStudent}</li>`).join('')}
          </ul>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
      alertStudentsNotFound.innerHTML = alertContent;
      alertStudentsNotFound.classList.add('visible');

      const alert = document.querySelector('.alert-students-not-found-content');
      alert.addEventListener('closed.bs.alert', function () {
        alertStudentsNotFound.classList.remove('visible');
      });
    }

    executeButton.disabled = false;
    spinner.style.display = 'none';
    attendanceData = null;
  }
  log('Popup', event);
});

studentsTextarea.addEventListener('scroll', (event) => {
  const scrollTop = studentsTextarea.scrollTop;
  backdrop.scroll(0, scrollTop);
});

autoSaveCheckbox.addEventListener('change', event => {
  chrome.storage.sync.set({ 'autoSave': event.target.checked }, function () {
    log('Set value into storage (autoSave):', event.target.checked);
  });
});

chrome.storage.sync.get(['autoSave'], function (result) {
  log('Loaded value from storage (autoSave):', result.autoSave);
  autoSaveCheckbox.checked = result.autoSave ?? false;
});

setAbsentCheckbox.addEventListener('change', event => {
  chrome.storage.sync.set({ 'setAbsent': event.target.checked }, function () {
    log('Set value into storage (setAbsent):', event.target.checked);
  });
});

chrome.storage.sync.get(['setAbsent'], function (result) {
  log('Loaded value from storage (setAbsent):', result.setAbsent);
  setAbsentCheckbox.checked = result.setAbsent ?? true;
});

function textAreaUpdate(exclusion = []) {
  const currentValue = studentsTextarea.value;
  const highlighted = applyHighlights(currentValue, exclusion);
  highlights.innerHTML = highlighted;
}

studentsTextarea.addEventListener('input', event => {
  textAreaUpdate();
});

executeButton.addEventListener('click', _ => {
  const regex = regexText.value ? new RegExp(regexText.value, 'gm') : defaultRegex;
  let studentIds = studentsTextarea.value.match(regex);
  executeAttendanceCheck(studentIds);
});


chrome.storage.sync.get(['studentNrs'], function (result) {
  if (debug) console.log('Value currently is ' + result);
  studentsTextarea.value = result.studentNrs ?? '';
  textAreaUpdate();
});

studentsTextarea.addEventListener("input", (event) => {
  chrome.storage.sync.set({ 'studentNrs': studentsTextarea.value }, function () {
    log('Set value into storage:', studentsTextarea.value);
  });
});

function executeAttendanceCheck(studentIds) {
  executeButton.disabled = true;
  spinner.style.display = 'inline-block';

  const payload = {
    students: studentIds,
    autoSave: autoSaveCheckbox.checked,
    setAbsent: setAbsentCheckbox.checked
  };
  const event = {
    source: 'POPUP',
    destination: 'CONTENT_SCRIPT',
    payload: payload
  };
  port.postMessage(event);
}

function applyHighlights(text, exclusion) {
  let prefix = '';
  if (exclusion.length) {
    prefix = `(?!${exclusion.join('|')})`;
  }
  const successRegex = regexText.value ? new RegExp(`${prefix}(${regexText.value})`, 'gm') : defaultRegex;

  let textHighlighted = text
    .replace(/\n$/g, '\n\n')
    .replace(successRegex, `<mark class="success">$&</mark>`);

  if (exclusion.length) {
    const failureRegex = new RegExp(`${exclusion.join('|')}`, 'gm');
    textHighlighted = textHighlighted.replace(failureRegex, `<mark class="failure">$&</mark>`);
  }

  return textHighlighted;
}

function onUploadFile(event) {
  log('File:', event.target.files);

  const file = event.target.files[0];

  // Validate the file submitted
  const validFileTypeRegex = new RegExp('\.(xls|xlsx)$', 'i');
  if (!validFileTypeRegex.test(file.name)) {
    // throw new Error('File invalid format.');
    modalSuccessContainer.style.display = 'none';
    modalFooterContainer.style.display = 'none';
    modalFailureContainer.style.display = 'block';
    bootstrapModal.show();
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = e.target.result;
    const workbook = XLSX.read(data);
    extractAttendanceData(workbook);
  };
  reader.readAsArrayBuffer(file);
}

function extractAttendanceData(workbook) {
  const [sheet] = Object.values(workbook.Sheets);

  if (!isValidFormat(sheet)) {
    // throw new Error('File invalid format.');
    modalSuccessContainer.style.display = 'none';
    modalFooterContainer.style.display = 'none';
    modalFailureContainer.style.display = 'block';
    bootstrapModal.show();
    return;
  }

  modalSuccessContainer.style.display = 'block';
  modalFooterContainer.style.display = 'block';
  modalFailureContainer.style.display = 'none';

  attendanceData = toAttendanceData(sheet);
  updateModalView(attendanceData);
  bootstrapModal.show();

  /*
    {
      className: 'Encaminhamento em Redes de Computadores',
      edges: [{ column: 'A', row: 4, coordinate: 'A4' }, { column: 'N', row: 22, coordinate: 'N22' }],
      header: [{ column: 'A', row: 4, coordinate: 'A4', value: 'Apelido' }, { column: 'B', row: 4, coordinate: 'B4', value: 'Nome' }, { column: 'C', row: 4, coordinate: 'C4', value: 'ID do aluno' }],
      content: [
        [{ column: 'A', row: 5, coordinate: 'A5', value: 'Afonso' }, { column: 'B', row: 5, coordinate: 'B5', value: 'Gonçalo' }, { column: 'C', row: 5, coordinate: 'C5', value: '19428', sessions: [] }],
      ],
      sessions: [{ label: '4 Mar 2022 09:30 Todos os alunos', column: 'E', date: '4 Mar 2022 09:30' }, ...],
      possibleStates: [{ label: 'P', column: 'I' }, { label: 'A', column: 'J' }, { label: 'F', column: 'K' }]
    } 
  */
}

function updateModalView(attendanceData) {
  attendanceDateElement.innerHTML = '';
  attendanceData.sessions.forEach(session => {
    attendanceDateElement.innerHTML += `<option value="${session.column}">${session.label}</option>`
  });

  attendanceStatesElement.innerHTML = '';
  attendanceData.possibleStates.forEach(state => {
    attendanceStatesElement.innerHTML += `
    <div class="form-check form-check-inline">
      <input class="form-check-input" type="checkbox" name="state_${state.label}" data-val="${state.label}" data-column="${state.column}" />
      <label class="form-check-label">${state.label}</label>
    </div>`
  });
}

function isValidFormat(sheet) {
  const firstStudent = {
    firstName: sheet.A5.v,
    lastName: sheet.B5.v,
    id: sheet.D5.v.match(/\d+/)?.toString() ?? null,
    email: sheet.D5.v
  };

  // If any of the fields are not filled in, it is not a valid format
  if (!(firstStudent.firstName || firstStudent.lastName || firstStudent.id || firstStudent.email)) {
    return false;
  }

  // If the data has has not the correct format, it isn't a student
  if (!_isStudent(firstStudent)) {
    return false;
  }

  return true;
}

function _isStudent(student) {
  const validNameRegex = /[A-Za-zÀ-ÖØ-öø-įĴ-őŔ-žǍ-ǰǴ-ǵǸ-țȞ-ȟȤ-ȳɃɆ-ɏḀ-ẞƀ-ƓƗ-ƚƝ-ơƤ-ƥƫ-ưƲ-ƶẠ-ỿ ]+/;
  const validIdRegex = /\d+/;
  const validEmailRegex = /.+\@(stu.|alunos.)?ipbeja.pt/i;

  return validNameRegex.test(student.firstName) &&
    validNameRegex.test(student.lastName) &&
    validIdRegex.test(student.id) &&
    validEmailRegex.test(student.email);
}

function toAttendanceData(sheet) {
  const attendanceData = {
    className: sheet.B1.v,
    edges: _extractEdges(sheet),
    header: _extractHeader(sheet),
    content: _extractContent(sheet),
    sessions: _extractSessions(sheet),
    possibleStates: _extractPossibleStates(sheet),
    fileData: { ...sheet }
  };

  return attendanceData;
}

function _extractEdges(sheet) {
  let lastRowIndex = 5;
  let lastColumnCharCode = 'A'.charCodeAt(0);
  let inspectedItem;

  while (inspectedItem = sheet[`A${lastRowIndex + 1}`]) {
    lastRowIndex++;
  }

  while (inspectedItem = sheet[`${String.fromCharCode(lastColumnCharCode + 1)}${lastRowIndex}`]) {
    lastColumnCharCode++;
  }

  return [
    { column: 'A', row: 5, coordinate: 'A5' },
    { column: String.fromCharCode(lastColumnCharCode), row: lastRowIndex, coordinate: `${String.fromCharCode(lastColumnCharCode)}${lastRowIndex}` }
  ];
}

function _extractHeader(sheet) {
  const header = [];
  let cell;
  let columnCharCode = 'A'.charCodeAt(0);
  while (state = sheet[`${String.fromCharCode(columnCharCode)}4`]) {
    cell = sheet[`${String.fromCharCode(columnCharCode)}4`];
    header.push({
      column: String.fromCharCode(columnCharCode),
      row: 4,
      coordinate: `${String.fromCharCode(columnCharCode)}4`,
      value: cell.v
    });
    columnCharCode = columnCharCode + 1;
  }

  return header;
}

function _extractContent(sheet) {
  const content = [];
  let rowNumber = 5;
  while (state = sheet[`A${rowNumber}`]) {
    firstName = sheet[`A${rowNumber}`];
    lastName = sheet[`B${rowNumber}`];
    id = sheet[`C${rowNumber}`];
    email = sheet[`D${rowNumber}`];
    const row = [];
    row.push({
      column: 'A',
      row: rowNumber,
      coordinate: `A${rowNumber}`,
      value: firstName.v
    });
    row.push({
      column: 'B',
      row: rowNumber,
      coordinate: `B${rowNumber}`,
      value: lastName.v
    });
    row.push({
      column: 'C',
      row: rowNumber,
      coordinate: `C${rowNumber}`,
      value: email.v.match(/\d+/)?.toString() ?? null
    });
    row.push({
      column: 'D',
      row: rowNumber,
      coordinate: `D${rowNumber}`,
      value: email.v
    });
    content.push(row);
    rowNumber = rowNumber + 1;
  }

  return content;
}

function _extractSessions(sheet) {
  const sessions = [];
  let session;
  let columnCharCode = 'E'.charCodeAt(0);
  while (session = sheet[`${String.fromCharCode(columnCharCode)}4`]) {
    const cell = sheet[`${String.fromCharCode(columnCharCode)}4`];

    if (!cell.v || cell.v.length <= 2) {
      break;
    }

    sessions.push({ label: session.v, column: String.fromCharCode(columnCharCode) });
    columnCharCode = columnCharCode + 1;
  }

  return sessions;
}

function _extractPossibleStates(sheet) {
  const states = [];
  let state;
  let columnCharCode = 'E'.charCodeAt(0);
  let started = false;
  while (state = sheet[`${String.fromCharCode(columnCharCode)}4`]) {
    const cell = sheet[`${String.fromCharCode(columnCharCode)}4`];
    columnCharCode = columnCharCode + 1;

    if (!started && cell.v && cell.v.length <= 2) {
      started = true;
      states.push({ label: state.v, column: String.fromCharCode(columnCharCode - 1) });
    }
    else if (started && cell.v && cell.v.length <= 2) {
      states.push({ label: state.v, column: String.fromCharCode(columnCharCode - 1) });
    }
    else if (started && cell.v && cell.v.length > 2) {
      break;
    }
  }

  return states;
}