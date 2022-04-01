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
  }

  // Done
  if (event.source === 'CONTENT_SCRIPT' && event.payload.done) {
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

function textAreaUpdate() {
  const currentValue = studentsTextarea.value;
  const highlighted = applyHighlights(currentValue);
  highlights.innerHTML = highlighted;
}

studentsTextarea.addEventListener('input', event => {
  textAreaUpdate(event);
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


function applyHighlights(text) {
  const regex = regexText.value ? new RegExp(regexText.value, 'gm') : defaultRegex;
  return text
    .replace(/\n$/g, '\n\n')
    //.replace(/[1-9]\d{3,4}/gm, '<mark>$&</mark>');
    .replace(regex, '<mark>$&</mark>');
}