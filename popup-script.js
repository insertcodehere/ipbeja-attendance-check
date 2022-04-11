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
const spinner = executeButton.querySelector('.spinner-border');
const progressBar = document.querySelector('.execution-progress > .progress-bar');
const alertStudentsNotFound = document.querySelector('.alert-students-not-found');

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
  executeButton.disabled = true;
  spinner.style.display = 'inline-block';
  const regex = regexText.value ? new RegExp(regexText.value, 'gm') : defaultRegex;
  let studentIds = studentsTextarea.value.match(regex);

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

  // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  //   let studentIds = studentsTextarea.value.match(defaultRegex);
  //   const payload = {
  //     students: studentIds,
  //     setAbsent: setAbsentCheckbox.checked
  //   };
  //   chrome.tabs.sendMessage(tabs[0].id, payload, function (response) {
  //     log('Response', response);
  //   });
  // });
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