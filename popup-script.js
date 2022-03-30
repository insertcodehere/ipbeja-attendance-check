const debug = true;
const defaultRegex = /\b[1-9][0-9]{3,4}\b/gm;

if (debug) console.log('Popup');
const studentsTextarea = document.querySelector('.student-ids');
const setAbsentCheckbox = document.querySelector('#student-absence-switch');
const regexText = document.querySelector("#student-ids-regex");
const executeButton = document.querySelector('.action.action-execute');
const highlights = document.querySelector('.highlights');
const backdrop = document.querySelector('.backdrop');
const spinner = executeButton.querySelector('.spinner-border');


studentsTextarea.addEventListener('scroll', (event) => {
  debugger;
  var scrollTop = studentsTextarea.scrollTop;
  backdrop.scroll(0, scrollTop);
}
);

chrome.storage.sync.get(['studentNrs'], function (result) {
  if (debug) console.log('Value currently is ' + result);
  studentsTextarea.value = result.studentNrs;
  textAreaUpdate();
});

/* executeButton.addEventListener('click', event => {

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      students: studentsTextarea.value,
      setAbsent: setAbsentCheckbox.checked,
      regex: regexText.value.trim()
    }, function (response) {
      if (debug) console.log('Response', response);

    }
    );
  })
}); */



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
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //let studentIds = studentsTextarea.value.match(/[1-9]\d{3,4}/gm);
    let studentIds = studentsTextarea.value.match(defaultRegex);
    chrome.tabs.sendMessage(tabs[0].id, {
      students: studentsTextarea.value,
      setAbsent: setAbsentCheckbox.checked,
      regex: regexText.value.trim()
    }, function (response) {
      if (debug) console.log('Response', response);

    }
    );
  });
});


studentsTextarea.addEventListener("input", (event) => {
  chrome.storage.sync.set({ 'studentNrs': studentsTextarea.value }, function () {
    if (debug) console.log('Value is set to ' + studentsTextarea.value);
  });
});


function applyHighlights(text) {
  return text
    .replace(/\n$/g, '\n\n')
    //.replace(/[1-9]\d{3,4}/gm, '<mark>$&</mark>');
    .replace(defaultRegex, '<mark>$&</mark>');
}
